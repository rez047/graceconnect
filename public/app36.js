/* ============================================================
   GRACECONNECT — APP36.JS
   FINAL TARGETED PATCH

   KEEP:
   - Existing Group Chat logic
   - Existing Swahili New Testament behavior
   - Existing English/KJV/etc. Bible loader

   FIX:
   - Category -> Members -> Chat
   - Swahili Old Testament loading

   DOES NOT create a new chat system.
   Uses the existing c26OpenChat / h27ChatWith engine.
   ============================================================ */

(function () {
    'use strict';

    console.log('GC APP36: final targeted patch loading');

    /* ============================================================
       SUPABASE
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
        } catch (e) {}

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


    /* ============================================================
       BIBLE BOOK MAP
       ============================================================ */

    var SW36 = {

        /* OLD TESTAMENT */

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

        /* NEW TESTAMENT */

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
       BIBLE REFERENCE PARSER
       ============================================================ */

    function parse36(ref) {

        var m = String(ref || '')
            .trim()
            .match(
                /^(.+?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?$/
            );

        if (!m) {
            return null;
        }

        var name = normalize36(m[1]);

        var book =
            SW36[name] ||
            EN36[name];

        if (!book) {
            return null;
        }

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
       ROBUST MEGA.BIBLE VERSE COLLECTOR
       
       THIS IS THE IMPORTANT OLD TESTAMENT FIX.

       Handles:
       1. [{verse:1,text:"..." }]
       2. {verse:1,text:"..."}
       3. {"1":"verse text","2":"verse text"}
       4. {"1":{text:"..."}}
       5. strings containing:
            1 verse text
            2 verse text
       6. nested data / chapter / verses objects
       ============================================================ */

    function collectVerses36(value, out, seen, inheritedVerse) {

        if (value == null) {
            return;
        }

        if (!out) {
            out = [];
        }

        if (!seen) {
            seen = [];
        }

        /* ----------------------------
           STRING
           ---------------------------- */

        if (typeof value === 'string') {

            var raw = value.trim();

            if (!raw) {
                return;
            }

            /*
             * If the parent numeric key supplied the verse number,
             * the entire string is the verse text.
             */
            if (
                inheritedVerse != null &&
                /^\d+$/.test(String(inheritedVerse))
            ) {
                out.push({
                    verse: parseInt(
                        inheritedVerse,
                        10
                    ),
                    text: raw.replace(
                        /\s+/g,
                        ' '
                    ).trim()
                });

                return;
            }

            /*
             * Otherwise parse strings such as:
             *
             * 1 In the beginning...
             * 2 And the earth...
             *
             * Also accepts:
             * 1. text
             * 1) text
             * 1 - text
             */
            var lines =
                raw.split(/\r?\n+/);

            var parsedAny = false;

            lines.forEach(function (line) {

                var s =
                    String(line || '')
                        .trim();

                if (!s) {
                    return;
                }

                var m =
                    s.match(
                        /^(\d+)[\s.)\-:]+(.+)$/
                    );

                if (m) {

                    var num =
                        parseInt(
                            m[1],
                            10
                        );

                    var txt =
                        m[2]
                            .replace(
                                /\s+/g,
                                ' '
                            )
                            .trim();

                    if (num > 0 && txt) {

                        out.push({
                            verse: num,
                            text: txt
                        });

                        parsedAny = true;
                    }
                }
            });

            /*
             * Some sources may return a single verse as:
             * "1 In the beginning..."
             */
            if (
                !parsedAny &&
                /^\d+[\s.)\-:]+.+/.test(raw)
            ) {

                var one =
                    raw.match(
                        /^(\d+)[\s.)\-:]+(.+)$/
                    );

                if (one) {

                    out.push({
                        verse: parseInt(
                            one[1],
                            10
                        ),
                        text: one[2]
                            .replace(
                                /\s+/g,
                                ' '
                            )
                            .trim()
                    });
                }
            }

            return;
        }


        /* ----------------------------
           ARRAY
           ---------------------------- */

        if (Array.isArray(value)) {

            value.forEach(function (item) {

                collectVerses36(
                    item,
                    out,
                    seen,
                    null
                );

            });

            return;
        }


        /* ----------------------------
           OBJECT
           ---------------------------- */

        if (typeof value !== 'object') {
            return;
        }


        if (seen.indexOf(value) !== -1) {
            return;
        }

        seen.push(value);


        /*
         * Explicit verse number.
         */

        var n =
            value.verse != null
                ? value.verse
                : value.number != null
                    ? value.number
                    : value.verseNumber != null
                        ? value.verseNumber
                        : value.n != null
                            ? value.n
                            : null;


        /*
         * Explicit verse text.
         */

        var text = '';

        if (typeof value.text === 'string') {
            text = value.text;
        }
        else if (typeof value.value === 'string') {
            text = value.value;
        }
        else if (typeof value.verseText === 'string') {
            text = value.verseText;
        }
        else if (typeof value.content === 'string') {
            text = value.content;
        }


        if (
            n != null &&
            text &&
            /^\d+$/.test(
                String(n)
            )
        ) {

            out.push({
                verse: parseInt(
                    n,
                    10
                ),
                text: String(text)
                    .replace(
                        /\s+/g,
                        ' '
                    )
                    .trim()
            });
        }


        /*
         * IMPORTANT:
         *
         * MEGA OT data may contain:
         *
         * {
         *   "1": "verse...",
         *   "2": "verse..."
         * }
         *
         * The old collector completely ignored those strings.
         *
         * We explicitly recognize numeric keys.
         */

        Object.keys(value).forEach(function (key) {

            var child =
                value[key];

            /*
             * Numeric object key = verse number.
             */
            if (
                /^\d+$/.test(key)
            ) {

                var verseNumber =
                    parseInt(
                        key,
                        10
                    );

                /*
                 * Direct string:
                 * "1": "In the beginning..."
                 */
                if (
                    typeof child === 'string'
                ) {

                    var directText =
                        child
                            .replace(
                                /\s+/g,
                                ' '
                            )
                            .trim();

                    if (
                        verseNumber > 0 &&
                        directText
                    ) {

                        out.push({
                            verse: verseNumber,
                            text: directText
                        });
                    }

                    return;
                }


                /*
                 * Numeric key containing an object:
                 *
                 * "1": {
                 *    text: "..."
                 * }
                 */
                if (
                    child &&
                    typeof child === 'object'
                ) {

                    var childN =
                        child.verse != null
                            ? child.verse
                            : child.number != null
                                ? child.number
                                : child.verseNumber != null
                                    ? child.verseNumber
                                    : null;

                    var childText =
                        typeof child.text === 'string'
                            ? child.text
                            : typeof child.value === 'string'
                                ? child.value
                                : typeof child.content === 'string'
                                    ? child.content
                                    : typeof child.verseText === 'string'
                                        ? child.verseText
                                        : '';

                    if (
                        !childN &&
                        childText &&
                        verseNumber > 0
                    ) {

                        out.push({
                            verse: verseNumber,
                            text: childText
                                .replace(
                                    /\s+/g,
                                    ' '
                                )
                                .trim()
                        });
                    }

                    collectVerses36(
                        child,
                        out,
                        seen,
                        verseNumber
                    );

                    return;
                }
            }


            /*
             * Normal nested Bible structures.
             *
             * Do not recurse into obvious metadata.
             */

            if (
                child &&
                typeof child === 'object' &&
                key !== 'crossReferences' &&
                key !== 'references' &&
                key !== 'topics' &&
                key !== 'people' &&
                key !== 'events' &&
                key !== 'metadata'
            ) {

                collectVerses36(
                    child,
                    out,
                    seen,
                    null
                );
            }


            /*
             * String values under normal keys can themselves
             * contain numbered verses.
             */

            if (
                typeof child === 'string' &&
                (
                    key === 'text' ||
                    key === 'content' ||
                    key === 'value' ||
                    key === 'verses'
                )
            ) {

                collectVerses36(
                    child,
                    out,
                    seen,
                    null
                );
            }

        });
    }


    function uniqueVerses36(list) {

        var map = {};

        (list || []).forEach(function (v) {

            if (
                !v ||
                !v.verse ||
                !v.text
            ) {
                return;
            }

            var num =
                parseInt(
                    v.verse,
                    10
                );

            if (
                num > 0 &&
                !map[num]
            ) {

                map[num] = {
                    verse: num,
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
        });


        return Object.keys(map)
            .map(function (k) {
                return map[k];
            })
            .sort(function (a, b) {
                return a.verse - b.verse;
            });
    }


    /* ============================================================
       JSON FETCH
       ============================================================ */

    function fetchJSON36(url) {

        return fetch(
            url,
            {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            }
        )
        .then(function (r) {

            if (!r.ok) {
                throw new Error(
                    'HTTP ' + r.status
                );
            }

            return r.json();
        });
    }


    /* ============================================================
       SWAHILI BIBLE LOADER
       ONLY SWAHILI IS OVERRIDDEN.
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
         * MEGA first.
         */

        return fetchJSON36(
            mega
        )

        .then(function (data) {

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


            if (!verses.length) {

                throw new Error(
                    'MEGA returned no verses'
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
        })


        /*
         * Existing GraceConnect API fallback.
         */

        .catch(function () {

            return fetchJSON36(
                '/api/bible?translation=swahili' +
                '&book=' +
                encodeURIComponent(
                    parsed.book
                ) +
                '&chapter=' +
                encodeURIComponent(
                    parsed.chapter
                )
            )

            .then(function (data) {

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


                if (!verses.length) {

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
            });
        })


        /*
         * Last resort = cached chapter.
         */

        .catch(function (err) {

            var cached = null;

            try {

                cached =
                    JSON.parse(
                        localStorage.getItem(
                            key
                        ) || 'null'
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


    /* ============================================================
       PAINT SWAHILI
       ============================================================ */

    function paintSwahili36(
        parsed,
        verses,
        offline
    ) {

        var out =
            document.getElementById(
                'readerOut'
            );

        if (!out) {
            return;
        }


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
                                    parsed.end == null
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


        var html =
            '<div style="' +
            'font-weight:800;' +
            'color:#92400E;' +
            'margin-bottom:8px' +
            '">' +

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
                                ? '-' +
                                  parsed.end
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
                'data-v="' +
                v.verse +
                '"' +

                ' onclick="toggleVerseHighlight(this,' +
                v.verse +
                ')"' +

                ' style="' +
                'padding:5px 6px;' +
                'margin:0 0 2px;' +
                'border-radius:7px;' +
                'cursor:pointer' +
                '">' +

                '<sup style="font-weight:800">' +
                v.verse +
                '</sup> ' +

                esc36(
                    v.text
                ) +

                '</p>';
        });


        out.innerHTML =
            html;
    }


    /* ============================================================
       INSTALL SWAHILI WRAPPER
       ============================================================ */

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
             * VERY IMPORTANT:
             *
             * Everything except Swahili is sent
             * directly to the original loader.
             *
             * This protects existing English/KJV/etc.
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


            if (!parsed) {

                var invalidOut =
                    document.getElementById(
                        'readerOut'
                    );


                if (invalidOut) {

                    invalidOut.innerHTML =
                        '<div style="color:#991B1B">' +
                        'Invalid Bible reference. Example: Mwanzo 1, Marko 3, Yohana 3:16.' +
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


            loadSwahili36(
                parsed
            )

            .then(function (verses) {

                paintSwahili36(
                    parsed,
                    verses,
                    false
                );

            })

            .catch(function (err) {

                console.error(
                    'GC APP36 Swahili Bible error:',
                    err
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

                        '<button ' +
                        'type="button" ' +
                        'class="btn btn-primary btn-sm" ' +
                        'onclick="loadBibleChapter()"' +
                        '>' +

                        '<i class="fas fa-rotate-right"></i> Retry' +

                        '</button>' +

                        '</div>';
                }
            });
        }


        wrappedBible.__gc36Wrapped =
            true;


        window.loadBibleChapter =
            wrappedBible;
    }


    /* ============================================================
       EXISTING CHAT ENGINE
       ============================================================ */

    function openChat36(uid) {

        if (!uid) {
            return false;
        }


        /*
         * THIS IS THE EXISTING WORKING CHAT PATH.
         */

        if (
            typeof window.c26OpenChat ===
            'function'
        ) {

            window.c26OpenChat(
                uid
            );

            return false;
        }


        if (
            typeof window.h27ChatWith ===
            'function'
        ) {

            window.h27ChatWith(
                uid
            );

            return false;
        }


        if (
            typeof window.openChatWith ===
            'function'
        ) {

            window.openChatWith(
                uid
            );

            return false;
        }


        console.warn(
            'GC APP36: existing chat engine not available'
        );

        return false;
    }


    window.gc36OpenChat =
        openChat36;


    /* ============================================================
       CREATE THE SAME BLUE CHAT BUTTON
       ============================================================ */

    function makeChat36(uid) {

        var b =
            document.createElement(
                'button'
            );


        b.type =
            'button';


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


                openChat36(
                    uid
                );


                return false;
            };


        return b;
    }


    /* ============================================================
       REMOVE DUPLICATE CHAT BUTTONS
       ============================================================ */

    function removeExtraChat36(
        row,
        keep
    ) {

        if (!row) {
            return;
        }


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
                    /c26openchat|h27chatwith|openchatwith|h32categorychat/i.test(
                        onclick
                    );


                if (isChat) {

                    node.remove();
                }
            }
        );
    }


    /* ============================================================
       ADD / REUSE CHAT BUTTON
       ============================================================ */

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


        /*
         * Already patched.
         */

        var existing =
            row.querySelector(
                '[data-gc36-chat="1"]'
            );


        if (existing) {

            existing.setAttribute(
                'data-chat-user',
                uid
            );


            /*
             * Keep the working button.
             */

            existing.onclick =
                function (event) {

                    if (event) {

                        event.preventDefault();
                        event.stopPropagation();
                    }


                    openChat36(
                        uid
                    );


                    return false;
                };


            removeExtraChat36(
                row,
                existing
            );


            return;
        }


        /*
         * Reuse an existing Chat/Inbox button
         * if another patch already generated one.
         */

        var candidates =
            row.querySelectorAll(
                'button,a,[role="button"]'
            );


        var old =
            null;


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
                    /c26openchat|h27chatwith|openchatwith|h32categorychat/i.test(
                        onclick
                    )
                ) {

                    old =
                        node;

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


        /*
         * Create exactly one button.
         */

        var button =
            makeChat36(
                uid
            );


        /*
         * Prefer existing action containers.
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
       MEMBER PROFILE DATA
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
            .from(
                'profiles'
            )
            .select(
                'id,name,full_name,profile_pic,avatar_url,email,role'
            )
            .order(
                'name'
            )


            .then(function (r) {

                if (r.error) {

                    console.error(
                        'GC APP36 profiles:',
                        r.error
                    );

                    return [];
                }


                return r.data ||
                    [];
            });
    }


    /* ============================================================
       GROUP STATE
       
       KEEPING THE WORKING GROUP APPROACH.
       ============================================================ */

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


    /* ============================================================
       CATEGORY STATE
       ============================================================ */

    function currentCategory36() {

        /*
         * Actual Category state.
         */

        if (
            window._h32Cat &&
            window._h32Cat.id
        ) {

            return window._h32Cat.id;
        }


        /*
         * Compatibility fallback if the category
         * navigation stores its ID elsewhere.
         */

        if (
            window._gg &&
            window._gg.currentCategoryId
        ) {

            return window._gg.currentCategoryId;
        }


        if (
            window._h32CategoryId
        ) {

            return window._h32CategoryId;
        }


        return null;
    }


    /* ============================================================
       FIND THE ACTUAL MEMBER ROW
       
       THIS IS THE CATEGORY FIX.

       Previous code required:
           row.textContent === member name

       But Category cards contain:
           name
           role
           buttons
           other text

       Therefore that test never found the card.

       We now look for the actual name element first.
       ============================================================ */

    function findMemberRow36(
        container,
        user
    ) {

        if (
            !container ||
            !user
        ) {

            return null;
        }


        var uid =
            String(
                user.id ||
                ''
            );


        var name =
            normalize36(
                user.name ||
                user.full_name ||
                ''
            );


        /*
         * BEST CASE:
         * Renderer already placed the user ID
         * on the card.
         */

        if (uid) {

            var byUid =
                container.querySelector(
                    '[data-user-id="' +
                    CSS.escape
                        ? CSS.escape(uid)
                        : uid +
                    '"]'
                );


            if (byUid) {

                return (
                    byUid.closest(
                        '.card,.member-card,.list-item,li,tr,article'
                    ) ||
                    byUid
                );
            }
        }


        /*
         * Alternate data attribute.
         */

        if (uid) {

            var byMemberUid =
                container.querySelector(
                    '[data-member-id="' +
                    uid +
                    '"]'
                );


            if (byMemberUid) {

                return (
                    byMemberUid.closest(
                        '.card,.member-card,.list-item,li,tr,article'
                    ) ||
                    byMemberUid
                );
            }
        }


        if (!name) {

            return null;
        }


        /*
         * Search actual name-bearing elements.
         *
         * Category member renderer normally puts the
         * member name inside a small text element,
         * not as the complete card text.
         */

        var nameNodes =
            container.querySelectorAll(
                'b,strong,.member-name,.user-name,' +
                '.profile-name,.name,[data-name]'
            );


        var found =
            null;


        Array.prototype.some.call(
            nameNodes,
            function (node) {

                var nodeName =
                    normalize36(
                        node.textContent ||
                        node.getAttribute(
                            'data-name'
                        ) ||
                        ''
                    );


                if (
                    nodeName === name
                ) {

                    found =
                        node;

                    return true;
                }


                return false;
            }
        );


        if (found) {

            /*
             * Walk up to the actual member card.
             */

            var row =
                found;


            for (
                var i = 0;
                i < 7 && row;
                i++
            ) {

                if (
                    row.matches &&
                    row.matches(
                        '.card,.member-card,.list-item,li,tr,article'
                    )
                ) {

                    return row;
                }


                row =
                    row.parentElement;
            }


            /*
             * If no named class exists, use the
             * first useful parent containing buttons.
             */

            row =
                found.parentElement;


            for (
                var j = 0;
                j < 5 && row;
                j++
            ) {

                if (
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


            return (
                found.parentElement ||
                found
            );
        }


        /*
         * Final fallback:
         *
         * Search cards and inspect only their
         * name-bearing children.
         */

        var cards =
            container.querySelectorAll(
                '.card,.member-card,.list-item,li,tr,article'
            );


        for (
            var k = 0;
            k < cards.length;
            k++
        ) {

            var card =
                cards[k];


            var possibleNames =
                card.querySelectorAll(
                    'b,strong,.member-name,.user-name,' +
                    '.profile-name,.name,[data-name]'
                );


            for (
                var q = 0;
                q < possibleNames.length;
                q++
            ) {

                var candidate =
                    normalize36(
                        possibleNames[q]
                            .textContent ||
                        possibleNames[q]
                            .getAttribute(
                                'data-name'
                            ) ||
                        ''
                    );


                if (
                    candidate === name
                ) {

                    return card;
                }
            }
        }


        return null;
    }


    /* ============================================================
       GROUP CHAT PATCH
       
       THIS IS KEPT CLOSE TO THE WORKING VERSION.
       ============================================================ */

    function patchGroupChats36() {

        var c =
            db36();


        var gid =
            currentGroup36();


        if (
            !c ||
            !gid
        ) {

            return;
        }


        var container =
            document.getElementById(
                'gg-root'
            );


        if (!container) {

            return;
        }


        c
            .from(
                'church_group_members'
            )
            .select(
                'user_id'
            )
            .eq(
                'group_id',
                gid
            )


            .then(function (mr) {

                if (mr.error) {

                    console.error(
                        'GC APP36 group members:',
                        mr.error
                    );

                    return;
                }


                var ids =
                    (mr.data || [])
                        .map(
                            function (x) {
                                return x.user_id;
                            }
                        );


                if (!ids.length) {

                    return;
                }


                profiles36()
                    .then(
                        function (users) {

                            users.forEach(
                                function (u) {

                                    if (
                                        !u ||
                                        ids.indexOf(
                                            u.id
                                        ) === -1
                                    ) {

                                        return;
                                    }


                                    var row =
                                        findMemberRow36(
                                            container,
                                            u
                                        );


                                    if (row) {

                                        addChat36(
                                            row,
                                            u.id
                                        );
                                    }
                                }
                            );
                        }
                    );
            });
    }


    /* ============================================================
       CATEGORY CHAT PATCH
       
       SAME CHAT ENGINE.
       ONLY THE MEMBER LOCATION IS DIFFERENT.
       ============================================================ */

    function patchCategoryChats36() {

        var c =
            db36();


        var cid =
            currentCategory36();


        if (
            !c ||
            !cid
        ) {

            return;
        }


        var container =
            document.getElementById(
                'h32c-members'
            );


        if (!container) {

            return;
        }


        c
            .from(
                'church_group_category_members'
            )
            .select(
                'user_id'
            )
            .eq(
                'category_id',
                cid
            )


            .then(function (mr) {

                if (mr.error) {

                    console.error(
                        'GC APP36 category members:',
                        mr.error
                    );

                    return;
                }


                var ids =
                    (mr.data || [])
                        .map(
                            function (x) {
                                return x.user_id;
                            }
                        );


                if (!ids.length) {

                    return;
                }


                profiles36()
                    .then(
                        function (users) {

                            users.forEach(
                                function (u) {

                                    if (
                                        !u ||
                                        ids.indexOf(
                                            u.id
                                        ) === -1
                                    ) {

                                        return;
                                    }


                                    var row =
                                        findMemberRow36(
                                            container,
                                            u
                                        );


                                    if (row) {

                                        addChat36(
                                            row,
                                            u.id
                                        );
                                    }
                                }
                            );
                        }
                    );
            });
    }


    /* ============================================================
       RUN BOTH
       ============================================================ */

    function patchChats36() {

        /*
         * GROUP FIRST.
         *
         * Do not replace or remove this.
         */

        try {
            patchGroupChats36();
        } catch (e) {
            console.error(
                'GC APP36 group patch:',
                e
            );
        }


        /*
         * CATEGORY SECOND.
         */

        try {
            patchCategoryChats36();
        } catch (e) {
            console.error(
                'GC APP36 category patch:',
                e
            );
        }
    }


    /* ============================================================
       HOOK EXISTING FUNCTIONS
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


            /*
             * Category/Group render asynchronously,
             * so patch several times after rendering.
             */

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
         * REAL CATEGORY RENDERER.
         */

        hookFunction36(
            'h32CatMembers',
            patchCategoryChats36
        );


        /*
         * CATEGORY TAB.
         */

        hookFunction36(
            'h32CatTab',
            patchCategoryChats36
        );


        /*
         * CATEGORY OPEN.
         */

        hookFunction36(
            'ggOpenCategory',
            patchCategoryChats36
        );


        /*
         * WORKING GROUP FUNCTIONS.
         */

        hookFunction36(
            'ggSwitchGroupTab',
            patchGroupChats36
        );


        hookFunction36(
            'ggOpenGroup',
            patchGroupChats36
        );


        /*
         * Additional Group renderer names used
         * by older versions, but only hook them
         * if they actually exist.
         */

        hookFunction36(
            'h29Tab',
            patchGroupChats36
        );


        hookFunction36(
            'h29GroupTab',
            patchGroupChats36
        );


        hookFunction36(
            'h29TabGroup',
            patchGroupChats36
        );


        hookFunction36(
            'ggGroupTab',
            patchGroupChats36
        );
    }


    /* ============================================================
       MUTATION OBSERVER
       ============================================================ */

    function observer36() {

        if (
            !window.MutationObserver
        ) {

            return;
        }


        var timer =
            null;


        var ob =
            new MutationObserver(
                function () {

                    clearTimeout(
                        timer
                    );


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


        if (
            document.body
        ) {

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
         * Bible wrapper.
         */

        installBible36();


        /*
         * Chat hooks.
         */

        hook36();


        /*
         * Initial patch.
         */

        patchChats36();


        /*
         * App may load its functions after app36,
         * therefore retry installation.
         */

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


        /*
         * Watch dynamically-rendered Category/Group members.
         */

        observer36();


        /*
         * Periodic safety pass.
         *
         * This does NOT recreate buttons because
         * addChat36 detects the existing data attribute.
         */

        if (
            window.__gc36Interval
        ) {

            clearInterval(
                window.__gc36Interval
            );
        }


        window.__gc36Interval =
            setInterval(
                function () {

                    installBible36();
                    hook36();
                    patchChats36();

                },
                1800
            );


        console.log(
            'GC APP36: active — working Group Chat preserved; Category Members Chat + Swahili OT fixed; NT untouched'
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
