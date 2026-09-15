/* ============================================================
   GRACECONNECT — APP36.JS
   TARGETED FINAL PATCH

   FIXED:
   1. English/KJV/etc. remains handled by app19.js.
   2. Existing Swahili New Testament remains intact.
   3. Swahili Old Testament MEGA structures are parsed correctly.
   4. Category Members now uses the REAL app30 category cards.
   5. Group Members logic remains intact.
   6. Exactly one Chat button per member.
   7. Existing GraceConnect chat engine is reused.
   ============================================================ */

(function () {
    'use strict';

    console.log('GC APP36: targeted final patch loading');

    /* ============================================================
       HELPERS
       ============================================================ */

    function db36() {
        try {
            if (typeof window.sb === 'function') {
                var c = window.sb();
                if (c && typeof c.from === 'function') {
                    return c;
                }
            }

            if (
                window.sb &&
                typeof window.sb.from === 'function'
            ) {
                return window.sb;
            }

            if (
                window.supabaseClient &&
                typeof window.supabaseClient.from === 'function'
            ) {
                return window.supabaseClient;
            }
        } catch (e) {
            console.error('APP36 DB:', e);
        }

        return null;
    }

    function esc36(v) {
        if (typeof window.esc === 'function') {
            return window.esc(v);
        }

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

    function normalize36(v) {
        return String(v || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }

    function me36() {
        return window.user || null;
    }


    /* ============================================================
       BIBLE BOOK MAPS
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
        var m = String(ref || '')
            .trim()
            .match(
                /^(.+?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?$/
            );

        if (!m) return null;

        var name = normalize36(m[1]);

        var book =
            SW36[name] ||
            EN36[name];

        if (!book) return null;

        return {
            book: book[0],
            slug: book[1],
            chapter: parseInt(m[2], 10),
            start: m[3]
                ? parseInt(m[3], 10)
                : null,
            end: m[4]
                ? parseInt(m[4], 10)
                : (
                    m[3]
                        ? parseInt(m[3], 10)
                        : null
                )
        };
    }


    /* ============================================================
       ROBUST MEGA VERSE PARSER
       ============================================================ */

    function addVerse36(
        out,
        number,
        text
    ) {
        if (
            number == null ||
            text == null
        ) {
            return;
        }

        var n =
            parseInt(
                String(number)
                    .replace(/[^\d]/g, ''),
                10
            );

        if (
            isNaN(n) ||
            n <= 0
        ) {
            return;
        }

        var t =
            String(text)
                .replace(/\s+/g, ' ')
                .trim();

        if (!t) return;

        out.push({
            verse: n,
            text: t
        });
    }


    function collectVerses36(
        value,
        out,
        seen
    ) {
        if (
            value === null ||
            value === undefined
        ) {
            return;
        }

        if (!out) {
            out = [];
        }

        if (!seen) {
            seen = [];
        }

        /*
         * Plain string:
         *
         * Handles responses such as:
         *
         * "1 Hapo mwanzo..."
         * "2 Nayo nchi..."
         */
        if (
            typeof value ===
            'string'
        ) {
            var lines =
                value.split(/\r?\n+/);

            lines.forEach(
                function (line) {
                    var m =
                        line
                            .trim()
                            .match(
                                /^(\d+)[\s.)-]+(.+)$/
                            );

                    if (m) {
                        addVerse36(
                            out,
                            m[1],
                            m[2]
                        );
                    }
                }
            );

            return;
        }

        if (
            typeof value !==
            'object'
        ) {
            return;
        }

        if (
            seen.indexOf(value) !==
            -1
        ) {
            return;
        }

        seen.push(value);

        /*
         * Arrays of verse objects.
         */
        if (
            Array.isArray(value)
        ) {
            value.forEach(
                function (item) {
                    collectVerses36(
                        item,
                        out,
                        seen
                    );
                }
            );

            return;
        }

        /*
         * Direct verse object:
         *
         * { verse: 1, text: "..." }
         */
        var number =
            value.verse != null
                ? value.verse
                : value.number != null
                    ? value.number
                    : value.verseNumber != null
                        ? value.verseNumber
                        : value.n != null
                            ? value.n
                            : null;

        var text =
            value.text != null
                ? value.text
                : value.value != null
                    ? value.value
                    : (
                        typeof value.content ===
                        'string'
                            ? value.content
                            : null
                    );

        if (
            number != null &&
            text != null
        ) {
            addVerse36(
                out,
                number,
                text
            );
        }

        /*
         * IMPORTANT:
         *
         * MEGA can expose verses as:
         *
         * {
         *   "1": "verse text",
         *   "2": "verse text"
         * }
         *
         * The previous APP36 ignored those strings.
         *
         * This handles them directly.
         */
        Object.keys(value)
            .forEach(
                function (key) {
                    var child =
                        value[key];

                    if (
                        /^\d+$/.test(key) &&
                        typeof child ===
                            'string'
                    ) {
                        addVerse36(
                            out,
                            key,
                            child
                        );

                        return;
                    }

                    if (
                        key ===
                            'crossReferences' ||
                        key ===
                            'references' ||
                        key ===
                            'topics' ||
                        key ===
                            'people' ||
                        key ===
                            'places' ||
                        key ===
                            'events'
                    ) {
                        return;
                    }

                    if (
                        child &&
                        typeof child ===
                            'object'
                    ) {
                        collectVerses36(
                            child,
                            out,
                            seen
                        );
                    }
                }
            );
    }


    function uniqueVerses36(
        list
    ) {
        var map = {};

        (list || [])
            .forEach(
                function (v) {
                    if (
                        !v ||
                        !v.verse ||
                        !v.text
                    ) {
                        return;
                    }

                    var n =
                        parseInt(
                            v.verse,
                            10
                        );

                    if (
                        isNaN(n) ||
                        n <= 0
                    ) {
                        return;
                    }

                    if (!map[n]) {
                        map[n] = {
                            verse: n,
                            text: String(
                                v.text
                            )
                                .replace(
                                    /\s+/g,
                                    ' '
                                )
                                .trim()
                        };
                    }
                }
            );

        return Object.keys(map)
            .map(
                function (key) {
                    return map[key];
                }
            )
            .sort(
                function (a, b) {
                    return (
                        a.verse -
                        b.verse
                    );
                }
            );
    }


    function fetchJSON36(
        url
    ) {
        return fetch(
            url,
            {
                method: 'GET',
                mode: 'cors',
                cache: 'no-store',
                headers: {
                    'Accept':
                        'application/json,text/plain,*/*'
                }
            }
        )
            .then(
                function (r) {
                    if (!r.ok) {
                        throw new Error(
                            'HTTP ' +
                            r.status
                        );
                    }

                    return r.json();
                }
            );
    }


    /* ============================================================
       SWAHILI LOADER
       ============================================================ */

    function loadSwahili36(
        parsed
    ) {
        var key =
            'gc36_sw_' +
            parsed.slug +
            '_' +
            parsed.chapter;

        var mega =
            'https://mega.bible/sw/' +
            'biblia-takatifu/' +
            parsed.slug +
            '/' +
            parsed.chapter +
            '.json';

        console.log(
            'APP36 MEGA:',
            mega
        );

        return fetchJSON36(
            mega
        )
            .then(
                function (data) {
                    var found = [];

                    collectVerses36(
                        data,
                        found,
                        []
                    );

                    var verses =
                        uniqueVerses36(
                            found
                        );

                    console.log(
                        'APP36 MEGA verses:',
                        parsed.book,
                        parsed.chapter,
                        verses.length
                    );

                    if (
                        !verses.length
                    ) {
                        throw new Error(
                            'No verses from MEGA'
                        );
                    }

                    try {
                        localStorage.setItem(
                            key,
                            JSON.stringify(
                                verses
                            )
                        );
                    } catch (e) {}

                    return verses;
                }
            )
            .catch(
                function (megaError) {
                    console.warn(
                        'APP36 MEGA failed:',
                        megaError
                    );

                    return fetchJSON36(
                        '/api/bible' +
                        '?translation=swahili' +
                        '&book=' +
                        encodeURIComponent(
                            parsed.book
                        ) +
                        '&chapter=' +
                        encodeURIComponent(
                            parsed.chapter
                        )
                    )
                        .then(
                            function (data) {
                                var found =
                                    [];

                                collectVerses36(
                                    data,
                                    found,
                                    []
                                );

                                var verses =
                                    uniqueVerses36(
                                        found
                                    );

                                if (
                                    !verses.length
                                ) {
                                    throw new Error(
                                        'No Swahili verses'
                                    );
                                }

                                try {
                                    localStorage.setItem(
                                        key,
                                        JSON.stringify(
                                            verses
                                        )
                                    );
                                } catch (e) {}

                                return verses;
                            }
                        )
                        .catch(
                            function (apiError) {
                                console.warn(
                                    'APP36 GraceConnect Bible API failed:',
                                    apiError
                                );

                                try {
                                    var cached =
                                        JSON.parse(
                                            localStorage.getItem(
                                                key
                                            ) ||
                                            'null'
                                        );

                                    if (
                                        Array.isArray(
                                            cached
                                        ) &&
                                        cached.length
                                    ) {
                                        return cached;
                                    }
                                } catch (e) {}

                                throw megaError;
                            }
                        );
                }
            );
    }


    function paintSwahili36(
        parsed,
        verses
    ) {
        var out =
            document.getElementById(
                'readerOut'
            );

        if (!out) return;

        var shown =
            verses || [];

        if (
            parsed.start != null
        ) {
            shown =
                shown.filter(
                    function (v) {
                        return (
                            v.verse >=
                                parsed.start &&
                            v.verse <=
                                (
                                    parsed.end ==
                                    null
                                        ? parsed.start
                                        : parsed.end
                                )
                        );
                    }
                );
        }

        if (!shown.length) {
            throw new Error(
                'Requested verse not found'
            );
        }

        window._bibleVerses =
            shown;

        window._selectedVerses =
            [];

        var title =
            parsed.book +
            ' ' +
            parsed.chapter +
            (
                parsed.start != null
                    ? ':' +
                      parsed.start +
                      (
                        parsed.end != null &&
                        parsed.end !==
                            parsed.start
                            ? '-' +
                              parsed.end
                            : ''
                      )
                    : ''
            );

        var html =
            '<div style="' +
            'font-weight:800;' +
            'color:#92400E;' +
            'margin-bottom:8px' +
            '">' +
            esc36(title) +
            '</div>';

        shown.forEach(
            function (v) {
                html +=
                    '<p ' +
                    'data-v="' +
                    v.verse +
                    '" ' +
                    'onclick="' +
                    'if(typeof toggleVerseHighlight===\\'function\\')' +
                    'toggleVerseHighlight(this,' +
                    v.verse +
                    ')" ' +
                    'style="' +
                    'padding:5px 6px;' +
                    'margin:0 0 2px;' +
                    'border-radius:7px;' +
                    'cursor:pointer' +
                    '">' +
                    '<sup style="' +
                    'font-weight:800' +
                    '">' +
                    v.verse +
                    '</sup> ' +
                    esc36(v.text) +
                    '</p>';
            }
        );

        out.innerHTML =
            html;
    }


    /* ============================================================
       BIBLE WRAPPER
       ============================================================ */

    function installBible36() {
        var original =
            window.loadBibleChapter;

        if (
            typeof original !==
                'function'
        ) {
            return;
        }

        if (
            original.__gc36Wrapped
        ) {
            return;
        }

        function wrappedBible() {
            var trans =
                document.getElementById(
                    'readerTrans'
                );

            var ref =
                document.getElementById(
                    'readerRef'
                );

            var translation =
                trans
                    ? String(
                        trans.value || ''
                    )
                    : '';

            /*
             * DO NOT TOUCH ENGLISH/KJV/OTHER
             * TRANSLATIONS.
             */
            if (
                normalize36(
                    translation
                ) !== 'swahili'
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

            var out =
                document.getElementById(
                    'readerOut'
                );

            if (!parsed) {
                if (out) {
                    out.innerHTML =
                        '<div style="color:#991B1B">' +
                        'Invalid Bible reference. Example: Mwanzo 1, Marko 3, Yohana 3:16.' +
                        '</div>';
                }

                return;
            }

            if (out) {
                out.innerHTML =
                    '<div style="color:#64748B">' +
                    '<i class="fas fa-spinner fa-spin"></i> ' +
                    'Loading Swahili ' +
                    esc36(
                        parsed.book +
                        ' ' +
                        parsed.chapter
                    ) +
                    '…</div>';
            }

            loadSwahili36(
                parsed
            )
                .then(
                    function (verses) {
                        paintSwahili36(
                            parsed,
                            verses
                        );
                    }
                )
                .catch(
                    function (error) {
                        console.error(
                            'APP36 Swahili:',
                            error
                        );

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
                                '<button type="button" class="btn btn-primary btn-sm" onclick="loadBibleChapter()">' +
                                '<i class="fas fa-rotate-right"></i> Retry' +
                                '</button>' +
                                '</div>';
                        }
                    }
                );
        }

        wrappedBible.__gc36Wrapped =
            true;

        window.loadBibleChapter =
            wrappedBible;

        console.log(
            'APP36: Swahili Bible wrapper installed'
        );
    }


    /* ============================================================
       EXISTING CHAT ENGINE
       ============================================================ */

    function openChat36(
        uid
    ) {
        if (!uid) {
            console.warn(
                'APP36: missing chat UID'
            );

            return false;
        }

        /*
         * USE THE EXISTING CHAT SYSTEM.
         */
        if (
            typeof window.c26OpenChat ===
            'function'
        ) {
            try {
                window.c26OpenChat(
                    uid
                );

                return true;
            } catch (e) {
                console.error(
                    'APP36 c26OpenChat:',
                    e
                );
            }
        }

        if (
            typeof window.h27ChatWith ===
            'function'
        ) {
            try {
                window.h27ChatWith(
                    uid
                );

                return true;
            } catch (e) {
                console.error(
                    'APP36 h27ChatWith:',
                    e
                );
            }
        }

        if (
            typeof window.openChatWith ===
            'function'
        ) {
            try {
                window.openChatWith(
                    uid
                );

                return true;
            } catch (e) {
                console.error(
                    'APP36 openChatWith:',
                    e
                );
            }
        }

        alert(
            'Chat is not ready yet. Please refresh the page and try again.'
        );

        return false;
    }

    window.gc36OpenChat =
        openChat36;


    /* ============================================================
       CHAT BUTTON
       ============================================================ */

    function makeChat36(
        uid
    ) {
        var b =
            document.createElement(
                'button'
            );

        b.type = 'button';

        b.className =
            'gc32-btn gc32-btn-primary gc36-chat-button';

        b.setAttribute(
            'data-gc36-chat',
            '1'
        );

        b.setAttribute(
            'data-chat-user',
            uid
        );

        b.style.cssText =
            'display:inline-flex;' +
            'align-items:center;' +
            'justify-content:center;' +
            'gap:6px;' +
            'white-space:nowrap;' +
            'cursor:pointer;' +
            'position:relative;' +
            'z-index:50;';

        b.innerHTML =
            '<i class="fas fa-comment-dots"></i> Chat';

        b.onclick =
            function (event) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    if (
                        event.stopImmediatePropagation
                    ) {
                        event.stopImmediatePropagation();
                    }
                }

                openChat36(
                    b.getAttribute(
                        'data-chat-user'
                    )
                );

                return false;
            };

        return b;
    }


    function removeExtraChat36(
        row,
        keep
    ) {
        if (!row) return;

        var nodes =
            row.querySelectorAll(
                'button,a,[role="button"]'
            );

        Array.prototype.forEach.call(
            nodes,
            function (node) {
                if (
                    node === keep
                ) {
                    return;
                }

                var text =
                    normalize36(
                        node.textContent ||
                        ''
                    );

                var onclick =
                    node.getAttribute(
                        'onclick'
                    ) || '';

                var isChat =
                    text === 'chat' ||
                    text === 'inbox' ||
                    /c26openchat/i.test(
                        onclick
                    ) ||
                    /h27chatwith/i.test(
                        onclick
                    ) ||
                    /openchatwith/i.test(
                        onclick
                    ) ||
                    /h32categorychat/i.test(
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
        if (
            !row ||
            !uid
        ) {
            return;
        }

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
         * Reuse an existing Chat/Inbox
         * button if another patch already
         * created one.
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
                        node.textContent ||
                        ''
                    );

                var onclick =
                    node.getAttribute(
                        'onclick'
                    ) || '';

                if (
                    text === 'chat' ||
                    text === 'inbox' ||
                    /c26openchat/i.test(
                        onclick
                    ) ||
                    /h27chatwith/i.test(
                        onclick
                    ) ||
                    /openchatwith/i.test(
                        onclick
                    ) ||
                    /h32categorychat/i.test(
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

            old.removeAttribute(
                'onclick'
            );

            old.onclick =
                function (event) {
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        if (
                            event.stopImmediatePropagation
                        ) {
                            event.stopImmediatePropagation();
                        }
                    }

                    openChat36(
                        uid
                    );

                    return false;
                };

            removeExtraChat36(
                row,
                old
            );

            return;
        }

        var button =
            makeChat36(
                uid
            );

        /*
         * app30 category cards do not
         * necessarily have a dedicated
         * actions class, so try those
         * first, then append to card.
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
            actions.appendChild(
                button
            );
        } else {
            row.appendChild(
                button
            );
        }
    }


    /* ============================================================
       IMPROVED MEMBER ROW FINDER
       ============================================================ */

    function findRow36(
        container,
        name
    ) {
        if (
            !container ||
            !name
        ) {
            return null;
        }

        var target =
            normalize36(
                name
            );

        if (!target) {
            return null;
        }

        /*
         * FIRST:
         *
         * Look specifically at <b> elements.
         *
         * app30 category members render:
         *
         * <div class="card">
         *   ...
         *   <b>Member Name</b>
         *   ...
         * </div>
         *
         * This is the important fix.
         */
        var bolds =
            container.querySelectorAll(
                'b,strong'
            );

        var found = null;

        Array.prototype.some.call(
            bolds,
            function (el) {
                var text =
                    normalize36(
                        el.textContent ||
                        ''
                    );

                if (
                    text === target
                ) {
                    found = el;
                    return true;
                }

                return false;
            }
        );

        if (found) {
            /*
             * Walk upward until the actual
             * member card is reached.
             */
            var row =
                found;

            for (
                var i = 0;
                i < 8 && row;
                i++
            ) {
                if (
                    row.classList &&
                    (
                        row.classList.contains(
                            'card'
                        ) ||
                        row.classList.contains(
                            'member-card'
                        ) ||
                        row.classList.contains(
                            'list-item'
                        )
                    )
                ) {
                    return row;
                }

                /*
                 * A row containing buttons is
                 * also a valid member container.
                 */
                if (
                    row !== found &&
                    row.querySelector &&
                    row.querySelector(
                        'button,a,[role="button"]'
                    )
                ) {
                    return row;
                }

                row =
                    row.parentElement;
            }

            if (
                found.parentElement
            ) {
                return found.parentElement;
            }
        }


        /*
         * SECOND:
         *
         * Look for explicit member/user IDs.
         */
        var selectors = [
            '[data-user-id="' +
                name +
                '"]',
            '[data-member-id="' +
                name +
                '"]'
        ];

        for (
            var s = 0;
            s < selectors.length;
            s++
        ) {
            var byId =
                container.querySelector(
                    selectors[s]
                );

            if (byId) {
                return (
                    byId.closest(
                        '.card,.member-card,.list-item,li,tr'
                    ) ||
                    byId.parentElement ||
                    byId
                );
            }
        }


        /*
         * THIRD:
         *
         * Fallback to small elements whose
         * text contains the member name.
         */
        var elements =
            container.querySelectorAll(
                'div,li,tr,article,.card,.member-card,.list-item'
            );

        var candidate =
            null;

        Array.prototype.some.call(
            elements,
            function (el) {
                var text =
                    normalize36(
                        el.textContent ||
                        ''
                    );

                if (
                    text === target
                ) {
                    candidate = el;
                    return true;
                }

                return false;
            }
        );

        if (!candidate) {
            Array.prototype.some.call(
                elements,
                function (el) {
                    var text =
                        normalize36(
                            el.textContent ||
                            ''
                        );

                    if (
                        text.indexOf(
                            target
                        ) !== -1 &&
                        text.length <
                            target.length +
                            180
                    ) {
                        candidate = el;
                        return true;
                    }

                    return false;
                }
            );
        }

        if (!candidate) {
            return null;
        }

        var fallback =
            candidate;

        for (
            var j = 0;
            j < 8 &&
            fallback;
            j++
        ) {
            if (
                fallback.querySelector &&
                (
                    fallback.querySelector(
                        'button,a,[role="button"]'
                    ) ||
                    (
                        fallback.classList &&
                        fallback.classList.contains(
                            'card'
                        )
                    )
                )
            ) {
                return fallback;
            }

            fallback =
                fallback.parentElement;
        }

        return (
            candidate.parentElement ||
            candidate
        );
    }


    /* ============================================================
       PROFILES
       ============================================================ */

    function profiles36() {
        var c =
            db36();

        if (!c) {
            return Promise.resolve(
                []
            );
        }

        return c
            .from('profiles')
            .select(
                'id,name,profile_pic,email,role'
            )
            .order('name')
            .then(
                function (r) {
                    if (r.error) {
                        console.error(
                            'APP36 profiles:',
                            r.error
                        );

                        return [];
                    }

                    return (
                        r.data ||
                        []
                    );
                }
            );
    }


    /* ============================================================
       CURRENT GROUP
       ============================================================ */

    function currentGroup36() {
        if (
            window._gg &&
            window._gg.currentGroupId
        ) {
            return (
                window._gg.currentGroupId
            );
        }

        if (
            window._gg &&
            window._gg.group &&
            window._gg.group.id
        ) {
            return (
                window._gg.group.id
            );
        }

        return (
            window._h29GroupId ||
            window._h32GroupId ||
            (
                window._h32Group &&
                window._h32Group.id
            ) ||
            null
        );
    }


    /* ============================================================
       CURRENT CATEGORY
       ============================================================ */

    function currentCategory36() {
        /*
         * app22 keeps the current category
         * here as well.
         */
        if (
            window._gg &&
            window._gg.currentCategoryId
        ) {
            return (
                window._gg.currentCategoryId
            );
        }

        /*
         * app30/app32 set _h32Cat.
         */
        if (
            window._h32Cat &&
            window._h32Cat.id
        ) {
            return (
                window._h32Cat.id
            );
        }

        return null;
    }


    /* ============================================================
       GROUP CHAT PATCH
