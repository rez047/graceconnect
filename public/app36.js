/* ============================================================
   GRACECONNECT — APP36.JS
   FINAL BIBLE + GROUP/CATEGORY CHAT PATCH

   FIXES:
   1. Keeps existing English/other Bible translations untouched.
   2. Swahili New Testament remains working.
   3. Swahili Old Testament uses MEGA.Bible correctly.
   4. Handles multiple MEGA JSON verse structures.
   5. Adds ONE Chat button per Group/Category member.
   6. Chat button uses the EXISTING h27ChatWith/c26OpenChat engine.
   7. Uses event delegation so dynamically rendered members work.
   8. Does not create another chat system.
   ============================================================ */

(function () {
    'use strict';

    console.log('GC APP36 FINAL: loading');

    /* ============================================================
       BASIC HELPERS
       ============================================================ */

    function SB36() {
        try {
            if (typeof window.sb === 'function') {
                var c = window.sb();
                if (c && typeof c.from === 'function') return c;
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
            console.error('APP36 SB:', e);
        }

        return null;
    }


    function esc36(value) {
        if (typeof window.esc === 'function') {
            return window.esc(value);
        }

        return String(value == null ? '' : value).replace(
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


    function norm36(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }


    /* ============================================================
       SWAHILI BOOK MAP
       ============================================================ */

    var SW_BOOKS36 = {

        /* ---------- OLD TESTAMENT ---------- */

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

        /* ---------- NEW TESTAMENT ---------- */

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


    var EN_BOOKS36 = {

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

    function parseBible36(ref) {

        var text = String(ref || '')
            .trim();

        var match = text.match(
            /^(.+?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?$/
        );

        if (!match) {
            return null;
        }

        var name = norm36(match[1]);

        var book =
            SW_BOOKS36[name] ||
            EN_BOOKS36[name];

        if (!book) {
            return null;
        }

        return {
            name: book[0],
            slug: book[1],
            chapter: parseInt(match[2], 10),
            start: match[3]
                ? parseInt(match[3], 10)
                : null,
            end: match[4]
                ? parseInt(match[4], 10)
                : (
                    match[3]
                        ? parseInt(match[3], 10)
                        : null
                )
        };
    }


    /* ============================================================
       GENERIC MEGA VERSE EXTRACTOR
       ============================================================ */

    function collectVerses36(
        value,
        output,
        seen
    ) {

        if (
            value === null ||
            value === undefined
        ) {
            return;
        }

        if (!output) {
            output = [];
        }

        if (!seen) {
            seen = [];
        }

        if (
            typeof value === 'object' &&
            seen.indexOf(value) !== -1
        ) {
            return;
        }

        if (
            typeof value === 'object'
        ) {
            seen.push(value);
        }


        /* Array */

        if (Array.isArray(value)) {

            value.forEach(function (item) {
                collectVerses36(
                    item,
                    output,
                    seen
                );
            });

            return;
        }


        /* String */

        if (typeof value === 'string') {

            var lines =
                value.split(/\n+/);

            lines.forEach(function (line) {

                var m =
                    line.trim().match(
                        /^(\d+)\s+(.+)$/
                    );

                if (m) {

                    output.push({
                        verse:
                            parseInt(
                                m[1],
                                10
                            ),

                        text:
                            m[2]
                                .replace(
                                    /\s+/g,
                                    ' '
                                )
                                .trim()
                    });
                }
            });

            return;
        }


        if (
            typeof value !== 'object'
        ) {
            return;
        }


        /* --------------------------------------------
           Direct verse number fields
           -------------------------------------------- */

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
                    : value.content != null &&
                      typeof value.content === 'string'
                        ? value.content
                        : value.verseText != null
                            ? value.verseText
                            : null;


        if (
            number != null &&
            text != null &&
            String(text).trim()
        ) {

            var parsedNumber =
                parseInt(
                    String(number)
                        .replace(/[^\d]/g, ''),
                    10
                );

            if (
                !isNaN(parsedNumber) &&
                parsedNumber > 0
            ) {

                output.push({
                    verse: parsedNumber,
                    text:
                        String(text)
                            .replace(
                                /\s+/g,
                                ' '
                            )
                            .trim()
                });
            }
        }


        /* --------------------------------------------
           Common alternate MEGA structures
           -------------------------------------------- */

        if (
            value.verses &&
            typeof value.verses === 'object'
        ) {

            collectVerses36(
                value.verses,
                output,
                seen
            );
        }


        if (
            value.data &&
            typeof value.data === 'object'
        ) {

            collectVerses36(
                value.data,
                output,
                seen
            );
        }


        if (
            value.chapter &&
            typeof value.chapter === 'object'
        ) {

            collectVerses36(
                value.chapter,
                output,
                seen
            );
        }


        /*
         * Walk everything else.
         */

        Object.keys(value).forEach(
            function (key) {

                if (
                    key === 'crossReferences' ||
                    key === 'references' ||
                    key === 'topics' ||
                    key === 'people' ||
                    key === 'places' ||
                    key === 'events'
                ) {
                    return;
                }

                var child =
                    value[key];

                if (
                    child &&
                    typeof child === 'object'
                ) {

                    collectVerses36(
                        child,
                        output,
                        seen
                    );
                }
            }
        );
    }


    function uniqueVerses36(
        verses
    ) {

        var map = {};

        (verses || []).forEach(
            function (verse) {

                if (
                    !verse ||
                    !verse.verse ||
                    !verse.text
                ) {
                    return;
                }

                var n =
                    parseInt(
                        verse.verse,
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
                        text:
                            String(
                                verse.text
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
            .map(function (key) {
                return map[key];
            })
            .sort(function (a, b) {
                return a.verse - b.verse;
            });
    }


    /* ============================================================
       FETCH JSON
       ============================================================ */

    function fetch36(
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
        ).then(
            function (response) {

                if (!response.ok) {
                    throw new Error(
                        'HTTP ' +
                        response.status
                    );
                }

                return response.json();
            }
        );
    }


    /* ============================================================
       SWAHILI BIBLE LOADER
       ============================================================ */

    function loadSwahili36(
        parsed
    ) {

        var cacheKey =
            'gc36_swahili_' +
            parsed.slug +
            '_' +
            parsed.chapter;


        /*
         * IMPORTANT:
         *
         * The correct MEGA API structure is:
         *
         * /sw/biblia-takatifu/{book}/{chapter}.json
         *
         * This covers Old AND New Testament.
         */

        var url =
            'https://mega.bible/sw/' +
            'biblia-takatifu/' +
            parsed.slug +
            '/' +
            parsed.chapter +
            '.json';


        console.log(
            'APP36 Swahili request:',
            url
        );


        return fetch36(url)

            .then(
                function (data) {

                    var found = [];

                    collectVerses36(
                        data,
                        found
                    );

                    var verses =
                        uniqueVerses36(
                            found
                        );


                    if (
                        !verses.length
                    ) {

                        console.warn(
                            'APP36 MEGA returned data but no verses',
                            data
                        );

                        throw new Error(
                            'No verses parsed from MEGA'
                        );
                    }


                    try {
                        localStorage.setItem(
                            cacheKey,
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


                    /*
                     * Existing GraceConnect API.
                     */

                    return fetch36(
                        '/api/bible' +
                        '?translation=swahili' +
                        '&book=' +
                        encodeURIComponent(
                            parsed.name
                        ) +
                        '&chapter=' +
                        encodeURIComponent(
                            parsed.chapter
                        )
                    )

                        .then(
                            function (data) {

                                var found = [];

                                collectVerses36(
                                    data,
                                    found
                                );

                                var verses =
                                    uniqueVerses36(
                                        found
                                    );

                                if (
                                    !verses.length
                                ) {

                                    throw new Error(
                                        'No verses from GraceConnect Bible API'
                                    );
                                }

                                try {
                                    localStorage.setItem(
                                        cacheKey,
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
                                    'APP36 Bible API failed:',
                                    apiError
                                );


                                /*
                                 * Local cached copy.
                                 */

                                try {

                                    var cached =
                                        JSON.parse(
                                            localStorage.getItem(
                                                cacheKey
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


    /* ============================================================
       RENDER SWAHILI BIBLE
       ============================================================ */

    function renderSwahili36(
        parsed,
        verses
    ) {

        var output =
            document.getElementById(
                'readerOut'
            );

        if (!output) {
            return;
        }


        var visible =
            verses || [];


        if (
            parsed.start != null
        ) {

            visible =
                visible.filter(
                    function (v) {

                        return (
                            v.verse >=
                                parsed.start &&
                            v.verse <=
                                (
                                    parsed.end != null
                                        ? parsed.end
                                        : parsed.start
                                )
                        );
                    }
                );
        }


        if (!visible.length) {

            output.innerHTML =
                '<div style="color:#991B1B">' +
                'The requested verse could not be found.' +
                '</div>';

            return;
        }


        window._bibleVerses =
            visible;


        var html =
            '<div style="' +
            'font-weight:800;' +
            'color:#92400E;' +
            'margin-bottom:10px' +
            '">' +

            esc36(
                parsed.name +
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

            '</div>';


        visible.forEach(
            function (verse) {

                html +=
                    '<p ' +
                    'data-v="' +
                    verse.verse +
                    '" ' +

                    'onclick="' +
                    'if(typeof toggleVerseHighlight===\\'function\\')' +
                    'toggleVerseHighlight(this,' +
                    verse.verse +
                    ')" ' +

                    'style="' +
                    'padding:6px 7px;' +
                    'margin:0 0 3px;' +
                    'border-radius:7px;' +
                    'cursor:pointer' +
                    '">' +

                    '<sup style="' +
                    'font-weight:800;' +
                    'margin-right:4px' +
                    '">' +

                    verse.verse +

                    '</sup>' +

                    esc36(
                        verse.text
                    ) +

                    '</p>';
            }
        );


        output.innerHTML =
            html;
    }


    /* ============================================================
       WRAP EXISTING BIBLE LOADER
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


        function wrappedBible36() {

            var translation =
                document.getElementById(
                    'readerTrans'
                );

            var reference =
                document.getElementById(
                    'readerRef'
                );


            /*
             * Preserve ALL existing loaders except Swahili.
             */

            var translationValue =
                translation
                    ? norm36(
                        translation.value
                    )
                    : '';


            if (
                translationValue !==
                'swahili'
            ) {

                return original.apply(
                    this,
                    arguments
                );
            }


            var parsed =
                parseBible36(
                    reference
                        ? reference.value
                        : ''
                );


            var output =
                document.getElementById(
                    'readerOut'
                );


            if (!parsed) {

                if (output) {

                    output.innerHTML =
                        '<div style="color:#991B1B">' +
                        'Invalid Bible reference. Example: Mwanzo 1, Kutoka 1, Marko 3 or Yohana 3:16.' +
                        '</div>';
                }

                return;
            }


            if (output) {

                output.innerHTML =
                    '<div style="color:#64748B">' +
                    '<i class="fas fa-spinner fa-spin"></i> ' +
                    'Loading Swahili ' +
                    esc36(
                        parsed.name +
                        ' ' +
                        parsed.chapter
                    ) +
                    '…' +
                    '</div>';
            }


            loadSwahili36(
                parsed
            )

                .then(
                    function (verses) {

                        renderSwahili36(
                            parsed,
                            verses
                        );
                    }
                )

                .catch(
                    function (error) {

                        console.error(
                            'APP36 Swahili Bible:',
                            error
                        );


                        if (output) {

                            output.innerHTML =
                                '<div style="' +
                                'color:#991B1B;' +
                                'padding:10px' +
                                '">' +

                                '<strong>' +
                                'Could not load ' +
                                esc36(
                                    parsed.name +
                                    ' ' +
                                    parsed.chapter
                                ) +
                                '.</strong>' +

                                '<br>' +

                                '<small>' +
                                'Please check your internet connection and try again.' +
                                '</small>' +

                                '<br><br>' +

                                '<button ' +
                                'type="button" ' +
                                'class="btn btn-primary btn-sm" ' +
                                'onclick="loadBibleChapter()"' +
                                '>' +

                                '<i class="fas fa-rotate-right"></i> ' +
                                'Retry' +

                                '</button>' +

                                '</div>';
                        }
                    }
                );
        }


        wrappedBible36.__gc36Wrapped =
            true;


        window.loadBibleChapter =
            wrappedBible36;


        console.log(
            'APP36: Swahili Bible wrapper installed'
        );
    }


    /* ============================================================
       CHAT
       ============================================================ */

    function openExistingChat36(
        uid
    ) {

        if (!uid) {
            console.warn(
                'APP36: missing chat user id'
            );

            return false;
        }


        /*
         * DO NOT create another chat engine.
         *
         * app26/app27 already provides:
         *
         * c26OpenChat(uid)
         *       ↓
         * h27ChatWith(uid)
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

            } catch (error) {

                console.error(
                    'APP36 c26OpenChat error:',
                    error
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

            } catch (error) {

                console.error(
                    'APP36 h27ChatWith error:',
                    error
                );
            }
        }


        alert(
            'Chat is not ready yet. Please refresh the page and try again.'
        );

        return false;
    }


    window.gc36OpenChat =
        openExistingChat36;


    /* ============================================================
       CHAT BUTTON
       ============================================================ */

    function createChatButton36(
        uid
    ) {

        var button =
            document.createElement(
                'button'
            );


        button.type =
            'button';


        button.className =
            'gc32-btn gc32-btn-primary gc36-chat-button';


        button.setAttribute(
            'data-gc36-chat',
            'true'
        );


        button.setAttribute(
            'data-chat-user',
            uid
        );


        button.style.cssText =
            'display:inline-flex;' +
            'align-items:center;' +
            'justify-content:center;' +
            'gap:6px;' +
            'white-space:nowrap;' +
            'cursor:pointer;' +
            'position:relative;' +
            'z-index:50;';


        button.innerHTML =
            '<i class="fas fa-comment-dots"></i> Chat';


        /*
         * Direct event listener.
         */

        button.addEventListener(
            'click',
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                if (
                    event.stopImmediatePropagation
                ) {
                    event.stopImmediatePropagation();
                }


                openExistingChat36(
                    button.getAttribute(
                        'data-chat-user'
                    )
                );


                return false;
            },
            true
        );


        return button;
    }


    /* ============================================================
       REMOVE DUPLICATE CHAT BUTTONS
       ============================================================ */

    function cleanChatButtons36(
        row,
        keep
    ) {

        if (!row) return;


        var controls =
            row.querySelectorAll(
                'button,a,[role="button"]'
            );


        Array.prototype.forEach.call(
            controls,
            function (control) {

                if (
                    control === keep
                ) {
                    return;
                }


                var text =
                    norm36(
                        control.textContent ||
                        ''
                    );


                var onclick =
                    control.getAttribute(
                        'onclick'
                    ) ||
                    '';


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
                    );


                if (
                    isChat
                ) {
                    control.remove();
                }
            }
        );
    }


    /* ============================================================
       ADD CHAT BUTTON TO ROW
       ============================================================ */

    function addChatToRow36(
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
         * Never add Chat to yourself.
         */

        if (
            window.user &&
            window.user.id === uid
        ) {
            return;
        }


        var existing =
            row.querySelector(
                '[data-gc36-chat="true"]'
            );


        if (existing) {

            existing.setAttribute(
                'data-chat-user',
                uid
            );


            /*
             * Rebind the actual click every time.
             */

            existing.onclick =
                null;


            existing.onpointerdown =
                null;


            cleanChatButtons36(
                row,
                existing
            );


            return;
        }


        /*
         * Reuse an existing Chat/Inbox button
         * if app35/app27 already inserted one.
         */

        var controls =
            row.querySelectorAll(
                'button,a,[role="button"]'
            );


        var oldChat =
            null;


        Array.prototype.some.call(
            controls,
            function (control) {

                var text =
                    norm36(
                        control.textContent ||
                        ''
                    );


                var onclick =
                    control.getAttribute(
                        'onclick'
                    ) ||
                    '';


                if (
                    text === 'chat' ||
                    text === 'inbox' ||
                    /c26openchat/i.test(
                        onclick
                    ) ||
                    /h27chatwith/i.test(
                        onclick
                    )
                ) {

                    oldChat =
                        control;

                    return true;
                }


                return false;
            }
        );


        if (oldChat) {

            oldChat.innerHTML =
                '<i class="fas fa-comment-dots"></i> Chat';


            oldChat.classList.add(
                'gc36-chat-button'
            );


            oldChat.setAttribute(
                'data-gc36-chat',
                'true'
            );


            oldChat.setAttribute(
                'data-chat-user',
                uid
            );


            oldChat.style.position =
                'relative';


            oldChat.style.zIndex =
                '50';


            /*
             * Remove old inline handler.
             */

            oldChat.removeAttribute(
                'onclick'
            );


            /*
             * Replace with reliable direct handler.
             */

            oldChat.addEventListener(
                'click',
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    if (
                        event.stopImmediatePropagation
                    ) {
                        event.stopImmediatePropagation();
                    }


                    openExistingChat36(
                        uid
                    );

                    return false;
                },
                true
            );


            cleanChatButtons36(
                row,
                oldChat
            );


            return;
        }


        /*
         * Create new button.
         */

        var button =
            createChatButton36(
                uid
            );


        /*
         * Put it into the existing action
         * area where possible.
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

            /*
             * Existing app rows frequently use
             * a flex container. Append directly
             * to the row.
             */

            row.appendChild(
                button
            );
        }


        cleanChatButtons36(
            row,
            button
        );
    }


    /* ============================================================
       GROUP MEMBER IDENTIFICATION
       ============================================================ */

    function currentGroupId36() {

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


    function currentCategoryId36() {

        if (
            window._gg &&
            window._gg.currentCategoryId
        ) {

            return (
                window._gg.currentCategoryId
            );
        }


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
       GET PROFILE DATA
       ============================================================ */

    function getProfiles36(
        ids
    ) {

        var client =
            SB36();


        if (
            !client ||
            !ids ||
            !ids.length
        ) {

            return Promise.resolve(
                []
            );
        }


        return client
            .from('profiles')
            .select(
                'id,name,profile_pic,email,role'
            )
            .in(
                'id',
                ids
            )
            .then(
                function (result) {

                    if (
                        result.error
                    ) {

                        console.error(
                            'APP36 profiles:',
                            result.error
                        );

                        return [];
                    }


                    return (
                        result.data ||
                        []
                    );
                }
            );
    }


    /* ============================================================
       PATCH GROUP CHAT BUTTONS
       ============================================================ */

    function patchGroupChats36() {

        var client =
            SB36();


        var groupId =
            currentGroupId36();


        if (
            !client ||
            !groupId
        ) {

            return;
        }


        /*
         * THE REAL TABLE USED BY app22:
         *
         * church_group_members
         *
         * group_id
         * user_id
         */

        client
            .from(
                'church_group_members'
            )
            .select(
                'user_id'
            )
            .eq(
                'group_id',
                groupId
            )
            .then(
                function (membershipResult) {

                    if (
                        membershipResult.error
                    ) {

                        console.error(
                            'APP36 group members:',
                            membershipResult.error
                        );

                        return;
                    }


                    var ids =
                        (
                            membershipResult.data ||
                            []
                        )
                            .map(
                                function (member) {
                                    return member.user_id;
                                }
                            )
                            .filter(Boolean);


                    if (
                        !ids.length
                    ) {
                        return;
                    }


                    getProfiles36(
                        ids
                    )
                        .then(
                            function (profiles) {

                                var root =
                                    document.getElementById(
                                        'gg-root'
                                    );


                                if (!root) {
                                    return;
                                }


                                profiles.forEach(
                                    function (profile) {

                                        /*
                                         * Find the member by name,
                                         * but also look through
                                         * data-user-id attributes.
                                         */

                                        var row =
                                            findMemberRow36(
                                                root,
                                                profile
                                            );


                                        if (
                                            row
                                        ) {

                                            row.setAttribute(
                                                'data-gc36-member-id',
                                                profile.id
                                            );


                                            addChatToRow36(
                                                row,
                                                profile.id
                                            );
                                        }
                                    }
                                );
                            }
                        );
                }
            );
    }


    /* ============================================================
       PATCH CATEGORY CHAT BUTTONS
       ============================================================ */

    function patchCategoryChats36() {

        var client =
            SB36();


        var categoryId =
            currentCategoryId36();


        if (
            !client ||
            !categoryId
        ) {

            return;
        }


        client
            .from(
                'church_group_category_members'
            )
            .select(
                'user_id'
            )
            .eq(
                'category_id',
                categoryId
            )
            .then(
                function (membershipResult) {

                    if (
                        membershipResult.error
                    ) {

                        console.error(
                            'APP36 category members:',
                            membershipResult.error
                        );

                        return;
                    }


                    var ids =
                        (
                            membershipResult.data ||
                            []
                        )
                            .map(
                                function (member) {
                                    return member.user_id;
                                }
                            )
                            .filter(Boolean);


                    if (
                        !ids.length
                    ) {
                        return;
                    }


                    getProfiles36(
                        ids
                    )
                        .then(
                            function (profiles) {

                                var root =
                                    document.getElementById(
                                        'h32c-members'
                                    );


                                if (!root) {
                                    return;
                                }


                                profiles.forEach(
                                    function (profile) {

                                        var row =
                                            findMemberRow36(
                                                root,
                                                profile
                                            );


                                        if (
                                            row
                                        ) {

                                            row.setAttribute(
                                                'data-gc36-member-id',
                                                profile.id
                                            );


                                            addChatToRow36(
                                                row,
                                                profile.id
                                            );
                                        }
                                    }
                                );
                            }
                        );
                }
            );
    }


    /* ============================================================
       FIND MEMBER ROW
       ============================================================ */

    function findMemberRow36(
        container,
        profile
    ) {

        if (
            !container ||
            !profile
        ) {

            return null;
        }


        /*
         * First: exact data user ID.
         */

        var byId =
            container.querySelector(
                '[data-user-id="' +
                profile.id +
                '"]'
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


        var byMemberId =
            container.querySelector(
                '[data-member-id="' +
                profile.id +
                '"]'
            );


        if (byMemberId) {

            return (
                byMemberId.closest(
                    '.card,.member-card,.list-item,li,tr'
                ) ||
                byMemberId.parentElement ||
                byMemberId
            );
        }


        /*
         * Second: exact displayed name.
         */

        var target =
            norm36(
                profile.name
            );


        if (!target) {
            return null;
        }


        var elements =
            container.querySelectorAll(
                'div,li,tr,article,.card,.member-card,.list-item'
            );


        var candidate =
            null;


        Array.prototype.some.call(
            elements,
            function (element) {

                var text =
                    norm36(
                        element.textContent ||
                        ''
                    );


                if (
                    text === target
                ) {

                    candidate =
                        element;

                    return true;
                }


                return false;
            }
        );


        if (!candidate) {

            /*
             * Some member cards contain:
             * name + role + buttons.
             */

            Array.prototype.some.call(
                elements,
                function (element) {

                    var text =
                        norm36(
                            element.textContent ||
                            ''
                        );


                    if (
                        text.indexOf(
                            target
                        ) !== -1 &&
                        text.length <
                            target.length + 150
                    ) {

                        candidate =
                            element;

                        return true;
                    }


                    return false;
                }
            );
        }


        if (!candidate) {
            return null;
        }


        /*
         * Walk up to the useful row.
         */

        var row =
            candidate;


        for (
            var i = 0;
            i < 5 &&
            row;
            i++
        ) {

            if (
                row.querySelector &&
                (
                    row.querySelector(
                        'button'
                    ) ||
                    row.querySelector(
                        '[role="button"]'
                    ) ||
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


            row =
                row.parentElement;
        }


        return (
            candidate.parentElement ||
            candidate
        );
    }


    /* ============================================================
       CHAT EVENT DELEGATION
       ============================================================ */

    function installChatDelegation36() {

        if (
            document.documentElement
                .dataset
                .gc36ChatDelegation
        ) {

            return;
        }


        document.documentElement
            .dataset
            .gc36ChatDelegation =
                '1';


        /*
         * CAPTURE phase.
         *
         * This is important because Group member cards can
         * themselves have click handlers.
         */

        document.addEventListener(
            'click',
            function (event) {

                var target =
                    event.target;


                if (!target) {
                    return;
                }


                var button =
                    target.closest
                        ? target.closest(
                            '[data-gc36-chat="true"]'
                        )
                        : null;


                if (!button) {
                    return;
                }


                var uid =
                    button.getAttribute(
                        'data-chat-user'
                    );


                if (!uid) {
                    return;
                }


                event.preventDefault();

                event.stopPropagation();

                if (
                    event.stopImmediatePropagation
                ) {

                    event.stopImmediatePropagation();
                }


                openExistingChat36(
                    uid
                );

            },
            true
        );


        /*
         * Also handle touch/pointer interaction.
         */

        document.addEventListener(
            'pointerup',
            function (event) {

                var target =
                    event.target;


                if (!target) {
                    return;
                }


                var button =
                    target.closest
                        ? target.closest(
                            '[data-gc36-chat="true"]'
                        )
                        : null;


                if (!button) {
                    return;
                }


                /*
                 * Click normally follows pointerup,
                 * so do not call chat twice here.
                 *
                 * This handler simply prevents the
                 * parent member-card interaction.
                 */

                event.stopPropagation();

            },
            true
        );
    }


    /* ============================================================
       HOOK EXISTING GROUP/CATEGORY FUNCTIONS
       ============================================================ */

    function hookFunction36(
        name,
        after
    ) {

        var original =
            window[name];


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


        function wrapped36() {

            var result;


            try {

                result =
                    original.apply(
                        this,
                        arguments
                    );

            } finally {

                setTimeout(
                    after,
                    80
                );

                setTimeout(
                    after,
                    300
                );

                setTimeout(
                    after,
                    700
                );

                setTimeout(
                    after,
                    1500
                );
            }


            return result;
        }


        wrapped36.__gc36Wrapped =
            true;


        window[name] =
            wrapped36;
    }


    function hookExistingFunctions36() {

        hookFunction36(
            'ggOpenGroup',
            patchGroupChats36
        );


        hookFunction36(
            'ggSwitchGroupTab',
            patchGroupChats36
        );


        hookFunction36(
            'h32CatMembers',
            patchCategoryChats36
        );


        hookFunction36(
            'h32CatTab',
            patchCategoryChats36
        );


        hookFunction36(
            'ggOpenCategory',
            patchCategoryChats36
        );
    }


    /* ============================================================
       MUTATION OBSERVER
       ============================================================ */

    function installObserver36() {

        if (
            !window.MutationObserver
        ) {

            return;
        }


        if (
            document.documentElement
                .dataset
                .gc36Observer
        ) {

            return;
        }


        document.documentElement
            .dataset
            .gc36Observer =
                '1';


        var timer =
            null;


        var observer =
            new MutationObserver(
                function () {

                    clearTimeout(
                        timer
                    );


                    timer =
                        setTimeout(
                            function () {

                                hookExistingFunctions36();

                                patchGroupChats36();

                                patchCategoryChats36();

                            },
                            180
                        );
                }
            );


        if (
            document.body
        ) {

            observer.observe(
                document.body,
                {
                    childList: true,
                    subtree: true
                }
            );
        }
    }


    /* ============================================================
       REPEATED PATCH
       ============================================================ */

    function run36() {

        installBible36();

        installChatDelegation36();

        hookExistingFunctions36();

        patchGroupChats36();

        patchCategoryChats36();
    }


    /* ============================================================
       START
       ============================================================ */

    function start36() {

        run36();

        setTimeout(
            run36,
            250
        );

        setTimeout(
            run36,
            700
        );

        setTimeout(
            run36,
            1500
        );

        setTimeout(
            run36,
            3000
        );

        installObserver36();


        console.log(
            'GC APP36 FINAL: Bible + Group/Category Chat active'
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
