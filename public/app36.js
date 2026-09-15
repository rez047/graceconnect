/* ============================================================
   GRACECONNECT — APP36.JS
   TARGETED FINAL PATCH

   IMPORTANT:
   - Does NOT replace the existing English Bible loader.
     app19.js remains responsible for English/KJV/etc.
   - Intercepts ONLY Swahili Bible requests.
   - Uses MEGA.Bible's complete Swahili Biblia Takatifu first,
     then GraceConnect /api/bible as fallback.
   - Adds exactly one Chat button to actual GROUP and CATEGORY
     member rows using the existing Supabase membership tables.
   ============================================================ */

(function () {
    'use strict';

    console.log('GC APP36: targeted patch loading');

    /* ============================================================
       HELPERS
       ============================================================ */

    function db36() {
        try {
            if (typeof window.sb === 'function') {
                var c = window.sb();
                if (c && typeof c.from === 'function') return c;
            }

            if (window.sb && typeof window.sb.from === 'function') {
                return window.sb;
            }

            if (
                window.supabaseClient &&
                typeof window.supabaseClient.from === 'function'
            ) {
                return window.supabaseClient;
            }
        } catch (e) {}

        return null;
    }

    function esc36(v) {
        if (typeof window.esc === 'function') return window.esc(v);

        return String(v == null ? '' : v).replace(
            /[&<>"']/g,
            function (c) {
                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                }[c];
            }
        );
    }

    function me36() {
        return window.user || null;
    }

    function normalize36(v) {
        return String(v || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }


    /* ============================================================
       SWAHILI BOOK MAP
       ============================================================ */

    var SW36 = {
        'mwanzo': ['Genesis', 'gen'],
        'kutoka': ['Exodus', 'exo'],
        'walawi': ['Leviticus', 'lev'],
        'mambo ya walawi': ['Leviticus', 'lev'],
        'hesabu': ['Numbers', 'num'],
        'kumbukumbu': ['Deuteronomy', 'deu'],
        'kumbukumbu la torati': ['Deuteronomy', 'deu'],
        'yoshua': ['Joshua', 'jos'],
        'waamuzi': ['Judges', 'jdg'],
        'ruthu': ['Ruth', 'rut'],
        '1 samweli': ['1 Samuel', '1sa'],
        '2 samweli': ['2 Samuel', '2sa'],
        '1 wafalme': ['1 Kings', '1ki'],
        '2 wafalme': ['2 Kings', '2ki'],
        '1 nyakati': ['1 Chronicles', '1ch'],
        '2 nyakati': ['2 Chronicles', '2ch'],
        'ezra': ['Ezra', 'ezr'],
        'nehemia': ['Nehemiah', 'neh'],
        'esta': ['Esther', 'est'],
        'ayubu': ['Job', 'job'],
        'zaburi': ['Psalm', 'psa'],
        'zab': ['Psalm', 'psa'],
        'mithali': ['Proverbs', 'pro'],
        'mhubiri': ['Ecclesiastes', 'ecc'],
        'wimbo ulio bora': ['Song of Solomon', 'sng'],
        'wimbo wa sulemani': ['Song of Solomon', 'sng'],
        'isaya': ['Isaiah', 'isa'],
        'yeremia': ['Jeremiah', 'jer'],
        'maombolezo': ['Lamentations', 'lam'],
        'ezekieli': ['Ezekiel', 'eze'],
        'danieli': ['Daniel', 'dan'],
        'hosea': ['Hosea', 'hos'],
        'yoeli': ['Joel', 'joe'],
        'amosi': ['Amos', 'amo'],
        'obadia': ['Obadiah', 'oba'],
        'yona': ['Jonah', 'jon'],
        'mika': ['Micah', 'mic'],
        'nahumu': ['Nahum', 'nah'],
        'habakuki': ['Habakkuk', 'hab'],
        'sefania': ['Zephaniah', 'zep'],
        'hagayi': ['Haggai', 'hag'],
        'zekaria': ['Zechariah', 'zec'],
        'malaki': ['Malachi', 'mal'],

        'mathayo': ['Matthew', 'mat'],
        'matayo': ['Matthew', 'mat'],
        'marko': ['Mark', 'mrk'],
        'mariko': ['Mark', 'mrk'],
        'luka': ['Luke', 'luk'],
        'yohana': ['John', 'jhn'],
        'matendo': ['Acts', 'act'],
        'matendo ya mitume': ['Acts', 'act'],
        'warumi': ['Romans', 'rom'],
        '1 wakorintho': ['1 Corinthians', '1co'],
        '2 wakorintho': ['2 Corinthians', '2co'],
        '1 wakorinto': ['1 Corinthians', '1co'],
        '2 wakorinto': ['2 Corinthians', '2co'],
        'wagalatia': ['Galatians', 'gal'],
        'waefeso': ['Ephesians', 'eph'],
        'wafilipi': ['Philippians', 'php'],
        'wakolosai': ['Colossians', 'col'],
        '1 wathesalonike': ['1 Thessalonians', '1th'],
        '2 wathesalonike': ['2 Thessalonians', '2th'],
        '1 timotheo': ['1 Timothy', '1ti'],
        '2 timotheo': ['2 Timothy', '2ti'],
        'tito': ['Titus', 'tit'],
        'filemoni': ['Philemon', 'phm'],
        'waebrania': ['Hebrews', 'heb'],
        'yakobo': ['James', 'jas'],
        '1 petro': ['1 Peter', '1pe'],
        '2 petro': ['2 Peter', '2pe'],
        '1 yohana': ['1 John', '1jn'],
        '2 yohana': ['2 John', '2jn'],
        '3 yohana': ['3 John', '3jn'],
        'yuda': ['Jude', 'jud'],
        'ufunuo': ['Revelation', 'rev'],
        'ufunuo wa yohana': ['Revelation', 'rev']
    };

    var EN36 = {
        'genesis': ['Genesis', 'gen'],
        'exodus': ['Exodus', 'exo'],
        'leviticus': ['Leviticus', 'lev'],
        'numbers': ['Numbers', 'num'],
        'deuteronomy': ['Deuteronomy', 'deu'],
        'joshua': ['Joshua', 'jos'],
        'judges': ['Judges', 'jdg'],
        'ruth': ['Ruth', 'rut'],
        '1 samuel': ['1 Samuel', '1sa'],
        '2 samuel': ['2 Samuel', '2sa'],
        '1 kings': ['1 Kings', '1ki'],
        '2 kings': ['2 Kings', '2ki'],
        '1 chronicles': ['1 Chronicles', '1ch'],
        '2 chronicles': ['2 Chronicles', '2ch'],
        'ezra': ['Ezra', 'ezr'],
        'nehemiah': ['Nehemiah', 'neh'],
        'esther': ['Esther', 'est'],
        'job': ['Job', 'job'],
        'psalm': ['Psalm', 'psa'],
        'psalms': ['Psalm', 'psa'],
        'proverbs': ['Proverbs', 'pro'],
        'ecclesiastes': ['Ecclesiastes', 'ecc'],
        'song of solomon': ['Song of Solomon', 'sng'],
        'isaiah': ['Isaiah', 'isa'],
        'jeremiah': ['Jeremiah', 'jer'],
        'lamentations': ['Lamentations', 'lam'],
        'ezekiel': ['Ezekiel', 'eze'],
        'daniel': ['Daniel', 'dan'],
        'hosea': ['Hosea', 'hos'],
        'joel': ['Joel', 'joe'],
        'amos': ['Amos', 'amo'],
        'obadiah': ['Obadiah', 'oba'],
        'jonah': ['Jonah', 'jon'],
        'micah': ['Micah', 'mic'],
        'nahum': ['Nahum', 'nah'],
        'habakkuk': ['Habakkuk', 'hab'],
        'zephaniah': ['Zephaniah', 'zep'],
        'haggai': ['Haggai', 'hag'],
        'zechariah': ['Zechariah', 'zec'],
        'malachi': ['Malachi', 'mal'],
        'matthew': ['Matthew', 'mat'],
        'mark': ['Mark', 'mrk'],
        'luke': ['Luke', 'luk'],
        'john': ['John', 'jhn'],
        'acts': ['Acts', 'act'],
        'romans': ['Romans', 'rom'],
        '1 corinthians': ['1 Corinthians', '1co'],
        '2 corinthians': ['2 Corinthians', '2co'],
        'galatians': ['Galatians', 'gal'],
        'ephesians': ['Ephesians', 'eph'],
        'philippians': ['Philippians', 'php'],
        'colossians': ['Colossians', 'col'],
        '1 thessalonians': ['1 Thessalonians', '1th'],
        '2 thessalonians': ['2 Thessalonians', '2th'],
        '1 timothy': ['1 Timothy', '1ti'],
        '2 timothy': ['2 Timothy', '2ti'],
        'titus': ['Titus', 'tit'],
        'philemon': ['Philemon', 'phm'],
        'hebrews': ['Hebrews', 'heb'],
        'james': ['James', 'jas'],
        '1 peter': ['1 Peter', '1pe'],
        '2 peter': ['2 Peter', '2pe'],
        '1 john': ['1 John', '1jn'],
        '2 john': ['2 John', '2jn'],
        '3 john': ['3 John', '3jn'],
        'jude': ['Jude', 'jud'],
        'revelation': ['Revelation', 'rev']
    };


    /* ============================================================
       BIBLE REFERENCE
       ============================================================ */

    function parse36(ref) {
        var m = String(ref || '').trim().match(
            /^(.+?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?$/
        );

        if (!m) return null;

        var name = normalize36(m[1]);
        var book = SW36[name] || EN36[name];

        if (!book) return null;

        return {
            book: book[0],
            slug: book[1],
            chapter: parseInt(m[2], 10),
            start: m[3] ? parseInt(m[3], 10) : null,
            end: m[4]
                ? parseInt(m[4], 10)
                : (m[3] ? parseInt(m[3], 10) : null)
        };
    }


    function collectVerses36(value, out, seen) {
        if (!value || typeof value !== 'object') return;

        if (!seen) seen = [];

        if (seen.indexOf(value) !== -1) return;
        seen.push(value);

        if (Array.isArray(value)) {
            value.forEach(function (x) {
                collectVerses36(x, out, seen);
            });
            return;
        }

        var n =
            value.verse != null ? value.verse :
            value.number != null ? value.number :
            value.verseNumber != null ? value.verseNumber :
            null;

        var text =
            value.text ||
            value.value ||
            (
                typeof value.content === 'string'
                    ? value.content
                    : ''
            );

        if (
            n != null &&
            text &&
            /^\d+$/.test(String(n))
        ) {
            out.push({
                verse: parseInt(n, 10),
                text: String(text).replace(/\s+/g, ' ').trim()
            });
        }

        Object.keys(value).forEach(function (key) {
            var child = value[key];

            if (
                child &&
                typeof child === 'object' &&
                key !== 'crossReferences' &&
                key !== 'references' &&
                key !== 'topics' &&
                key !== 'people' &&
                key !== 'events'
            ) {
                collectVerses36(child, out, seen);
            }
        });
    }


    function uniqueVerses36(list) {
        var map = {};

        list.forEach(function (v) {
            if (
                v &&
                v.verse > 0 &&
                v.text &&
                !map[v.verse]
            ) {
                map[v.verse] = v;
            }
        });

        return Object.keys(map)
            .map(function (k) {
                return map[k];
            })
            .sort(function (a, b) {
                return a.verse - b.verse;
            });
    }


    function fetchJSON36(url) {
        return fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        }).then(function (r) {
            if (!r.ok) {
                throw new Error('HTTP ' + r.status);
            }

            return r.json();
        });
    }


    /* ============================================================
       SWAHILI LOADER — ONLY SWAHILI IS OVERRIDDEN
       ============================================================ */

    function loadSwahili36(parsed) {
        var key =
            'gc36_sw_' +
            parsed.slug +
            '_' +
            parsed.chapter;

        var mega =
            'https://mega.bible/sw/biblia-takatifu/' +
            parsed.slug +
            '/' +
            parsed.chapter +
            '.json';

        /*
         * MEGA.Bible is tried first because it contains the complete
         * Swahili Old + New Testament.
         */

        return fetchJSON36(mega)
            .then(function (data) {
                var found = [];

                collectVerses36(
                    data,
                    found
                );

                var verses =
                    uniqueVerses36(found);

                if (!verses.length) {
                    throw new Error(
                        'No verses from MEGA'
                    );
                }

                try {
                    localStorage.setItem(
                        key,
                        JSON.stringify(verses)
                    );
                } catch (e) {}

                return verses;
            })

            .catch(function () {
                /*
                 * Server fallback preserves compatibility with the
                 * existing GraceConnect Bible API.
                 */

                return fetchJSON36(
                    '/api/bible?translation=swahili' +
                    '&book=' +
                    encodeURIComponent(parsed.book) +
                    '&chapter=' +
                    encodeURIComponent(parsed.chapter)
                )
                    .then(function (data) {
                        var found = [];

                        collectVerses36(
                            data,
                            found
                        );

                        var verses =
                            uniqueVerses36(found);

                        if (!verses.length) {
                            throw new Error(
                                'No Swahili verses'
                            );
                        }

                        return verses;
                    });
            })

            .catch(function (err) {
                var cached = null;

                try {
                    cached = JSON.parse(
                        localStorage.getItem(key) || 'null'
                    );
                } catch (e) {}

                if (
                    Array.isArray(cached) &&
                    cached.length
                ) {
                    return cached;
                }

                throw err;
            });
    }


    function paintSwahili36(
        parsed,
        verses,
        offline
    ) {
        var out =
            document.getElementById('readerOut');

        if (!out) return;

        var shown = verses;

        if (parsed.start != null) {
            shown = verses.filter(function (v) {
                return (
                    v.verse >= parsed.start &&
                    v.verse <= (
                        parsed.end == null
                            ? parsed.start
                            : parsed.end
                    )
                );
            });
        }

        if (!shown.length) {
            throw new Error(
                'Requested verse not found'
            );
        }

        window._bibleVerses = shown;
        window._selectedVerses = [];

        var html =
            '<div style="font-weight:800;color:#92400E;margin-bottom:8px">' +
            esc36(
                parsed.book +
                ' ' +
                parsed.chapter +
                (
                    parsed.start != null
                        ? ':' +
                          parsed.start +
                          (
                            parsed.end != null &&
                            parsed.end !== parsed.start
                                ? '-' + parsed.end
                                : ''
                          )
                        : ''
                )
            ) +
            (
                offline
                    ? ' <span class="chip chip-green">offline</span>'
                    : ''
            ) +
            '</div>';

        shown.forEach(function (v) {
            html +=
                '<p ' +
                'data-v="' + v.verse + '"' +
                'onclick="toggleVerseHighlight(this,' +
                v.verse +
                ')"' +
                'style="padding:5px 6px;margin:0 0 2px;border-radius:7px;cursor:pointer">' +
                '<sup style="font-weight:800">' +
                v.verse +
                '</sup> ' +
                esc36(v.text) +
                '</p>';
        });

        out.innerHTML = html;
    }


    function installBible36() {
        var original =
            window.loadBibleChapter;

        if (
            typeof original !== 'function' ||
            original.__gc36Wrapped
        ) {
            return;
        }

        function wrappedBible() {
            var trans =
                document.getElementById('readerTrans');

            var ref =
                document.getElementById('readerRef');

            var translation =
                trans
                    ? String(trans.value || '')
                    : '';

            /*
             * CRITICAL:
             *
             * Every non-Swahili translation goes straight to the
             * original loader.
             *
             * This preserves Mark 3 and all existing English Bible
             * functionality.
             */

            if (
                normalize36(translation) !==
                'swahili'
            ) {
                return original.apply(
                    this,
                    arguments
                );
            }

            var parsed =
                parse36(
                    ref
                        ? ref.value
                        : ''
                );

            if (!parsed) {
                var invalidOut =
                    document.getElementById(
                        'readerOut'
                    );

                if (invalidOut) {
                    invalidOut.innerHTML =
                        '<div style="color:#991B1B">' +
                        'Invalid Bible reference. Example: Mwanzo 1, ' +
                        'Marko 3, Yohana 3:16.' +
                        '</div>';
                }

                return;
            }

            var out =
                document.getElementById(
                    'readerOut'
                );

            if (out) {
                out.innerHTML =
                    '<div style="color:#64748B">' +
                    'Loading Swahili ' +
                    esc36(
                        parsed.book +
                        ' ' +
                        parsed.chapter
                    ) +
                    '…</div>';
            }

            loadSwahili36(parsed)
                .then(function (verses) {
                    paintSwahili36(
                        parsed,
                        verses,
                        false
                    );
                })
                .catch(function () {
                    if (out) {
                        out.innerHTML =
                            '<div style="color:#991B1B">' +
                            'Could not load ' +
                            esc36(
                                parsed.book +
                                ' ' +
                                parsed.chapter
                            ) +
                            '. ' +
                            '<button type="button" class="btn btn-primary btn-sm" ' +
                            'onclick="loadBibleChapter()">' +
                            '<i class="fas fa-rotate-right"></i> Retry' +
                            '</button>' +
                            '</div>';
                    }
                });
        }

        wrappedBible.__gc36Wrapped = true;

        window.loadBibleChapter =
            wrappedBible;
    }


    /* ============================================================
       CHAT
       ============================================================ */

    function openChat36(uid) {
        if (!uid) return false;

        if (
            typeof window.c26OpenChat ===
            'function'
        ) {
            window.c26OpenChat(uid);
            return false;
        }

        if (
            typeof window.h27ChatWith ===
            'function'
        ) {
            window.h27ChatWith(uid);
            return false;
        }

        if (
            typeof window.openChatWith ===
            'function'
        ) {
            window.openChatWith(uid);
            return false;
        }

        return false;
    }


    window.gc36OpenChat =
        openChat36;


    function makeChat36(uid) {
        var b =
            document.createElement(
                'button'
            );

        b.type = 'button';

        b.className =
            'gc32-btn gc32-btn-primary gc36-chat-button';

        b.style.cssText =
            'display:inline-flex;' +
            'align-items:center;' +
            'gap:6px;' +
            'white-space:nowrap;';

        b.innerHTML =
            '<i class="fas fa-comment-dots"></i> Chat';

        b.setAttribute(
            'data-gc36-chat',
            '1'
        );

        b.setAttribute(
            'data-chat-user',
            uid
        );

        b.onclick =
            function (event) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                openChat36(uid);

                return false;
            };

        return b;
    }


    function removeExtraChat36(
        row,
        keep
    ) {
        var nodes =
            row.querySelectorAll(
                'button,a,[role="button"]'
            );

        Array.prototype.forEach.call(
            nodes,
            function (node) {
                if (node === keep) return;

                var text =
                    normalize36(
                        node.textContent || ''
                    );

                var onclick =
                    node.getAttribute(
                        'onclick'
                    ) || '';

                var isChat =
                    text === 'chat' ||
                    text === 'inbox' ||
                    /c26openchat|h27chatwith|openchatwith|h32categorychat/i.test(
                        onclick
                    );

                if (isChat) {
                    node.remove();
                }
            }
        );
    }


    function addChat36(
        row,
        uid
    ) {
        if (!row || !uid) return;

        var existing =
            row.querySelector(
                '[data-gc36-chat="1"]'
            );

        if (existing) {
            existing.setAttribute(
                'data-chat-user',
                uid
            );

            removeExtraChat36(
                row,
                existing
            );

            return;
        }

        /*
         * If app35/app27 already created a Chat/Inbox control,
         * reuse it rather than creating a second button.
         */

        var candidates =
            row.querySelectorAll(
                'button,a,[role="button"]'
            );

        var old = null;

        Array.prototype.some.call(
            candidates,
            function (node) {
                var text =
                    normalize36(
                        node.textContent || ''
                    );

                var onclick =
                    node.getAttribute(
                        'onclick'
                    ) || '';

                if (
                    text === 'chat' ||
                    text === 'inbox' ||
                    /c26openchat|h27chatwith|openchatwith|h32categorychat/i.test(
                        onclick
                    )
                ) {
                    old = node;
                    return true;
                }

                return false;
            }
        );

        if (old) {
            old.innerHTML =
                '<i class="fas fa-comment-dots"></i> Chat';

            old.classList.add(
                'gc36-chat-button'
            );

            old.setAttribute(
                'data-gc36-chat',
                '1'
            );

            old.setAttribute(
                'data-chat-user',
                uid
            );

            old.onclick =
                function (event) {
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    }

                    openChat36(uid);

                    return false;
                };

            removeExtraChat36(
                row,
                old
            );

            return;
        }

        var button =
            makeChat36(uid);

        /*
         * Append beside the existing controls.
         */

        var actions =
            row.querySelector(
                '.member-actions,' +
                '.user-actions,' +
                '.actions,' +
                '.gc32-actions,' +
                '.gc35-actions'
            );

        if (actions) {
            actions.appendChild(button);
        } else {
            row.appendChild(button);
        }
    }


    /*
     * Find a member row from the member's displayed name.
     *
     * This matches the existing DOM instead of assuming a fake
     * #groupMembers element.
     */

    function findRow36(
        container,
        name
    ) {
        if (!container || !name) {
            return null;
        }

        var target =
            normalize36(name);

        var elements =
            container.querySelectorAll(
                'div,li,tr,article,.card,.member-card,.list-item'
            );

        var exact = [];

        Array.prototype.forEach.call(
            elements,
            function (el) {
                var text =
                    normalize36(
                        el.textContent || ''
                    );

                if (text === target) {
                    exact.push(el);
                }
            }
        );

        if (!exact.length) {
            return null;
        }

        /*
         * The smallest exact-name element is usually the name
         * itself. Walk upward to the first useful member row.
         */

        var nameNode =
            exact[0];

        var row =
            nameNode;

        for (
            var i = 0;
            i < 5 && row;
            i++
        ) {
            var buttons =
                row.querySelectorAll(
                    'button,a,[role="button"]'
                );

            if (
                buttons.length ||
                row.classList.contains(
                    'card'
                ) ||
                row.classList.contains(
                    'member-card'
                ) ||
                row.classList.contains(
                    'list-item'
                ) ||
                row.tagName.toLowerCase() ===
                    'li' ||
                row.tagName.toLowerCase() ===
                    'tr'
            ) {
                return row;
            }

            row =
                row.parentElement;
        }

        return (
            nameNode.parentElement ||
            nameNode
        );
    }


    function profiles36() {
        var c = db36();

        if (!c) {
            return Promise.resolve([]);
        }

        return c
            .from('profiles')
            .select(
                'id,name,profile_pic,email,role'
            )
            .order('name')
            .then(function (r) {
                return r.error
                    ? []
                    : (r.data || []);
            });
    }


    function currentGroup36() {
        return (
            window._gg &&
            (
                window._gg.currentGroupId ||
                (
                    window._gg.group &&
                    window._gg.group.id
                )
            )
        ) ||
        window._h29GroupId ||
        window._h32GroupId ||
        (
            window._h32Group &&
            window._h32Group.id
        ) ||
        null;
    }


    function currentCategory36() {
        return (
            window._h32Cat &&
            window._h32Cat.id
        ) || null;
    }


    function patchGroupChats36() {
        var c = db36();

        var gid =
            currentGroup36();

        if (!c || !gid) return;

        var container =
            document.getElementById(
                'gg-root'
            );

        if (!container) return;

        c
            .from(
                'church_group_members'
            )
            .select('user_id')
            .eq(
                'group_id',
                gid
            )
            .then(function (mr) {
                if (mr.error) return;

                var ids =
                    (mr.data || [])
                        .map(
                            function (x) {
                                return x.user_id;
                            }
                        );

                if (!ids.length) return;

                profiles36()
                    .then(function (users) {
                        users.forEach(
                            function (u) {
                                if (
                                    !u ||
                                    !ids.includes(
                                        u.id
                                    )
                                ) {
                                    return;
                                }

                                var row =
                                    findRow36(
                                        container,
                                        u.name
                                    );

                                if (row) {
                                    addChat36(
                                        row,
                                        u.id
                                    );
                                }
                            }
                        );
                    });
            });
    }


    function patchCategoryChats36() {
        var c = db36();

        var cid =
            currentCategory36();

        if (!c || !cid) return;

        var container =
            document.getElementById(
                'h32c-members'
            );

        if (!container) return;

        c
            .from(
                'church_group_category_members'
            )
            .select('user_id')
            .eq(
                'category_id',
                cid
            )
            .then(function (mr) {
                if (mr.error) return;

                var ids =
                    (mr.data || [])
                        .map(
                            function (x) {
                                return x.user_id;
                            }
                        );

                if (!ids.length) return;

                profiles36()
                    .then(function (users) {
                        users.forEach(
                            function (u) {
                                if (
                                    !u ||
                                    !ids.includes(
                                        u.id
                                    )
                                ) {
                                    return;
                                }

                                var row =
                                    findRow36(
                                        container,
                                        u.name
                                    );

                                if (row) {
                                    addChat36(
                                        row,
                                        u.id
                                    );
                                }
                            }
                        );
                    });
            });
    }


    function patchChats36() {
        patchGroupChats36();
        patchCategoryChats36();
    }


    /* ============================================================
       HOOK THE REAL EXISTING TABS
       ============================================================ */

    function hookFunction36(
        name,
        after
    ) {
        var fn =
            window[name];

        if (
            typeof fn !== 'function' ||
            fn.__gc36Wrapped
        ) {
            return;
        }

        function wrapped() {
            var result =
                fn.apply(
                    this,
                    arguments
                );

            setTimeout(
                after,
                100
            );

            setTimeout(
                after,
                400
            );

            setTimeout(
                after,
                1000
            );

            return result;
        }

        wrapped.__gc36Wrapped =
            true;

        window[name] =
            wrapped;
    }


    function hook36() {
        /*
         * Category renderer/tab.
         */

        hookFunction36(
            'h32CatMembers',
            patchCategoryChats36
        );

        hookFunction36(
            'h32CatTab',
            patchCategoryChats36
        );

        /*
         * Actual Group tab used by app22.
         */

        hookFunction36(
            'ggSwitchGroupTab',
            patchGroupChats36
        );

        hookFunction36(
            'ggOpenGroup',
            patchGroupChats36
        );

        hookFunction36(
            'ggOpenCategory',
            patchCategoryChats36
        );
    }


    /* ============================================================
       OBSERVE DYNAMIC MEMBER RENDERING
       ============================================================ */

    function observer36() {
        if (!window.MutationObserver) {
            return;
        }

        var timer = null;

        var ob =
            new MutationObserver(
                function () {
                    clearTimeout(timer);

                    timer =
                        setTimeout(
                            function () {
                                hook36();
                                patchChats36();
                            },
                            150
                        );
                }
            );

        if (document.body) {
            ob.observe(
                document.body,
                {
                    childList: true,
                    subtree: true
                }
            );
        }
    }


    /* ============================================================
       START
       ============================================================ */

    function start36() {
        /*
         * Install Bible wrapper AFTER app19/app30 has loaded.
         */

        installBible36();

        hook36();

        patchChats36();

        setTimeout(
            function () {
                installBible36();
                hook36();
                patchChats36();
            },
            300
        );

        setTimeout(
            function () {
                installBible36();
                hook36();
                patchChats36();
            },
            1000
        );

        setTimeout(
            function () {
                installBible36();
                hook36();
                patchChats36();
            },
            2500
        );

        observer36();

        console.log(
            'GC APP36: active — English Bible preserved; Swahili + Group/Category Chat patched'
        );
    }


    if (
        document.readyState ===
        'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            start36
        );
    } else {
        start36();
    }

})();
