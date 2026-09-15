/* ============================================================
   GRACECONNECT — APP36.JS
   FINAL BIBLE + GROUP/CATEGORY MEMBER CHAT PATCH

   FIXES:
   1. Complete Swahili Bible:
      - Old Testament
      - New Testament
      - Chapter
      - Verse
      - Verse ranges
      - English book names
      - Swahili book names

   2. Groups member list:
      - One blue Chat button
      - Uses existing c26OpenChat / h27ChatWith

   3. Categories member list:
      - One blue Chat button
      - Uses existing c26OpenChat / h27ChatWith

   This file is ADDITIVE.
   It does not replace app25/app26/app27/app30/app32/app35.
   ============================================================ */

(function () {

    'use strict';

    console.log('GC APP36: loading...');


    /* ============================================================
       COMMON HELPERS
       ============================================================ */

    function gc36Esc(value) {

        if (typeof window.esc === 'function') {
            return window.esc(value);
        }

        return String(
            value == null ? '' : value
        ).replace(
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


    /* ============================================================
       1. BIBLE
       ============================================================ */

    var GC36_BOOKS = [

        'Genesis',
        'Exodus',
        'Leviticus',
        'Numbers',
        'Deuteronomy',
        'Joshua',
        'Judges',
        'Ruth',
        '1 Samuel',
        '2 Samuel',
        '1 Kings',
        '2 Kings',
        '1 Chronicles',
        '2 Chronicles',
        'Ezra',
        'Nehemiah',
        'Esther',
        'Job',
        'Psalm',
        'Proverbs',
        'Ecclesiastes',
        'Song of Solomon',
        'Isaiah',
        'Jeremiah',
        'Lamentations',
        'Ezekiel',
        'Daniel',
        'Hosea',
        'Joel',
        'Amos',
        'Obadiah',
        'Jonah',
        'Micah',
        'Nahum',
        'Habakkuk',
        'Zephaniah',
        'Haggai',
        'Zechariah',
        'Malachi',
        'Matthew',
        'Mark',
        'Luke',
        'John',
        'Acts',
        'Romans',
        '1 Corinthians',
        '2 Corinthians',
        'Galatians',
        'Ephesians',
        'Philippians',
        'Colossians',
        '1 Thessalonians',
        '2 Thessalonians',
        '1 Timothy',
        '2 Timothy',
        'Titus',
        'Philemon',
        'Hebrews',
        'James',
        '1 Peter',
        '2 Peter',
        '1 John',
        '2 John',
        '3 John',
        'Jude',
        'Revelation'

    ];


    /*
     * MEGA.Bible book slugs.
     */
    var GC36_MEGA = [

        'gen',
        'exo',
        'lev',
        'num',
        'deu',
        'jos',
        'jdg',
        'rut',
        '1sa',
        '2sa',
        '1ki',
        '2ki',
        '1ch',
        '2ch',
        'ezr',
        'neh',
        'est',
        'job',
        'psa',
        'pro',
        'ecc',
        'sng',
        'isa',
        'jer',
        'lam',
        'eze',
        'dan',
        'hos',
        'joe',
        'amo',
        'oba',
        'jon',
        'mic',
        'nah',
        'hab',
        'zep',
        'hag',
        'zec',
        'mal',
        'mat',
        'mrk',
        'luk',
        'jhn',
        'act',
        'rom',
        '1co',
        '2co',
        'gal',
        'eph',
        'php',
        'col',
        '1th',
        '2th',
        '1ti',
        '2ti',
        'tit',
        'phm',
        'heb',
        'jas',
        '1pe',
        '2pe',
        '1jn',
        '2jn',
        '3jn',
        'jud',
        'rev'

    ];


    /*
     * Swahili book names.
     */
    var GC36_SWAHILI = {

        'mwanzo': 'Genesis',
        'kutoka': 'Exodus',
        'mambo ya walawi': 'Leviticus',
        'walawi': 'Leviticus',
        'hesabu': 'Numbers',
        'kumbukumbu la torati': 'Deuteronomy',
        'kumbukumbu': 'Deuteronomy',
        'yoshua': 'Joshua',
        'waamuzi': 'Judges',
        'ruthu': 'Ruth',

        '1 samweli': '1 Samuel',
        '2 samweli': '2 Samuel',

        '1 wafalme': '1 Kings',
        '2 wafalme': '2 Kings',

        '1 nyakati': '1 Chronicles',
        '2 nyakati': '2 Chronicles',

        'ezra': 'Ezra',
        'nehemia': 'Nehemiah',
        'esta': 'Esther',
        'ayubu': 'Job',

        'zaburi': 'Psalm',
        'zab': 'Psalm',

        'mithali': 'Proverbs',
        'mhubiri': 'Ecclesiastes',
        'wimbo ulio bora': 'Song of Solomon',
        'wimbo wa sulemani': 'Song of Solomon',

        'isaya': 'Isaiah',
        'yeremia': 'Jeremiah',
        'maombolezo': 'Lamentations',
        'ezekieli': 'Ezekiel',
        'danieli': 'Daniel',
        'hosea': 'Hosea',
        'yoeli': 'Joel',
        'amosi': 'Amos',
        'obadia': 'Obadiah',
        'yona': 'Jonah',
        'mika': 'Micah',
        'nahumu': 'Nahum',
        'habakuki': 'Habakkuk',
        'sefania': 'Zephaniah',
        'hagayi': 'Haggai',
        'zekaria': 'Zechariah',
        'malaki': 'Malachi',

        'mathayo': 'Matthew',
        'matayo': 'Matthew',
        'marko': 'Mark',
        'mariko': 'Mark',
        'luka': 'Luke',
        'yohana': 'John',

        'matendo': 'Acts',
        'matendo ya mitume': 'Acts',

        'warumi': 'Romans',

        '1 wakorintho': '1 Corinthians',
        '2 wakorintho': '2 Corinthians',
        '1 wakorinto': '1 Corinthians',
        '2 wakorinto': '2 Corinthians',

        'wagalatia': 'Galatians',
        'waefeso': 'Ephesians',
        'wafilipi': 'Philippians',
        'wakolosai': 'Colossians',

        '1 wathesalonike': '1 Thessalonians',
        '2 wathesalonike': '2 Thessalonians',

        '1 timotheo': '1 Timothy',
        '2 timotheo': '2 Timothy',

        'tito': 'Titus',
        'filemoni': 'Philemon',
        'waebrania': 'Hebrews',
        'yakobo': 'James',

        '1 petro': '1 Peter',
        '2 petro': '2 Peter',

        '1 yohana': '1 John',
        '2 yohana': '2 John',
        '3 yohana': '3 John',

        'yuda': 'Jude',

        'ufunuo': 'Revelation',
        'ufunuo wa yohana': 'Revelation'

    };


    function gc36Normalize(value) {

        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');

    }


    function gc36CanonicalBook(book) {

        var value =
            gc36Normalize(book);

        if (!value) {
            return null;
        }

        if (/^\d+$/.test(value)) {

            var number =
                parseInt(value, 10);

            if (
                number >= 1 &&
                number <= 66
            ) {
                return GC36_BOOKS[number - 1];
            }

            return null;
        }


        for (
            var i = 0;
            i < GC36_BOOKS.length;
            i++
        ) {

            if (
                GC36_BOOKS[i].toLowerCase() ===
                value
            ) {
                return GC36_BOOKS[i];
            }

        }


        return (
            GC36_SWAHILI[value] ||
            null
        );

    }


    function gc36BookNumber(book) {

        var canonical =
            gc36CanonicalBook(book);

        if (!canonical) {
            return 0;
        }

        var index =
            GC36_BOOKS.indexOf(
                canonical
            );

        return index >= 0
            ? index + 1
            : 0;

    }


    function gc36ParseReference(ref) {

        var value =
            String(ref || '')
                .trim();

        /*
         * Examples:
         *
         * Genesis
         * Genesis 1
         * Genesis 1:1
         * Genesis 1:1-5
         * Yohana 3:16
         * Mwanzo 1
         * Zaburi 23
         */

        var match =
            value.match(
                /^(.+?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?\s*$/
            );

        if (!match) {

            var onlyBook =
                gc36CanonicalBook(
                    value
                );

            if (onlyBook) {

                return {
                    book: onlyBook,
                    chapter: 1,
                    verseStart: null,
                    verseEnd: null
                };

            }

            return null;

        }


        var book =
            gc36CanonicalBook(
                match[1]
            );

        if (!book) {
            return null;
        }


        return {

            book: book,

            chapter:
                parseInt(
                    match[2],
                    10
                ),

            verseStart:
                match[3]
                    ? parseInt(
                        match[3],
                        10
                    )
                    : null,

            verseEnd:
                match[4]
                    ? parseInt(
                        match[4],
                        10
                    )
                    : (
                        match[3]
                            ? parseInt(
                                match[3],
                                10
                            )
                            : null
                    )

        };

    }


    function gc36JSON(url) {

        return fetch(
            url,
            {
                headers: {
                    'Accept':
                        'application/json'
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


    /*
     * MEGA.Bible JSON parser.
     *
     * MEGA's public API is:
     *
     * /sw/biblia-takatifu/{book}/{chapter}.json
     *
     * This is the source used for the COMPLETE
     * Swahili Biblia Takatifu, including OT.
     */
    function gc36MegaVerses(data) {

        if (!data) {
            return [];
        }


        var source = null;


        if (
            data.chapter &&
            Array.isArray(
                data.chapter.content
            )
        ) {

            source =
                data.chapter.content;

        }


        if (
            !source &&
            Array.isArray(
                data.content
            )
        ) {

            source =
                data.content;

        }


        if (
            !source &&
            Array.isArray(
                data.verses
            )
        ) {

            source =
                data.verses;

        }


        if (
            !source &&
            data.chapter &&
            Array.isArray(
                data.chapter.verses
            )
        ) {

            source =
                data.chapter.verses;

        }


        if (!source) {
            return [];
        }


        return source
            .map(
                function (item) {

                    if (!item) {
                        return null;
                    }


                    var number =
                        item.number != null
                            ? item.number
                            : item.verse;


                    var text =
                        item.text ||
                        item.value ||
                        item.content ||
                        '';


                    number =
                        parseInt(
                            number,
                            10
                        );


                    text =
                        String(text || '')
                            .replace(
                                /\s+/g,
                                ' '
                            )
                            .trim();


                    if (
                        !number ||
                        !text
                    ) {
                        return null;
                    }


                    return {

                        verse: number,

                        text: text

                    };

                }
            )
            .filter(
                function (item) {
                    return !!item;
                }
            );

    }


    function gc36FilterVerses(
        verses,
        start,
        end
    ) {

        if (
            start == null
        ) {
            return verses;
        }


        start =
            parseInt(
                start,
                10
            );


        end =
            end == null
                ? start
                : parseInt(
                    end,
                    10
                );


        if (
            !Number.isFinite(start) ||
            !Number.isFinite(end)
        ) {
            return [];
        }


        if (end < start) {

            var temp =
                start;

            start =
                end;

            end =
                temp;

        }


        return verses.filter(
            function (verse) {

                var n =
                    parseInt(
                        verse.verse,
                        10
                    );

                return (
                    n >= start &&
                    n <= end
                );

            }
        );

    }


    /*
     * FINAL Swahili loader.
     *
     * IMPORTANT:
     * Do NOT use GetBible as the primary Swahili source.
     *
     * MEGA.Bible Biblia Takatifu contains the OT.
     */
    window.gc36LoadSwahili =
        function (
            book,
            chapter,
            verseStart,
            verseEnd
        ) {

            var number =
                gc36BookNumber(
                    book
                );

            if (!number) {

                return Promise.reject(
                    new Error(
                        'Invalid Swahili book'
                    )
                );

            }


            var mega =
                GC36_MEGA[
                    number - 1
                ];

            if (!mega) {

                return Promise.reject(
                    new Error(
                        'Missing MEGA book mapping'
                    )
                );

            }


            /*
             * PRIMARY
             *
             * /sw/biblia-takatifu/gen/1.json
             */
            var url =
                'https://mega.bible/sw/biblia-takatifu/' +
                mega +
                '/' +
                chapter +
                '.json';


            return gc36JSON(url)
                .then(
                    function (data) {

                        var verses =
                            gc36MegaVerses(
                                data
                            );


                        if (!verses.length) {

                            throw new Error(
                                'No Swahili verses returned'
                            );

                        }


                        verses =
                            gc36FilterVerses(
                                verses,
                                verseStart,
                                verseEnd
                            );


                        if (!verses.length) {

                            throw new Error(
                                'Verse not found'
                            );

                        }


                        return {

                            reference:
                                book +
                                ' ' +
                                chapter,

                            verses:
                                verses

                        };

                    }
                );

        };


    /*
     * Override the existing Bible loader.
     */
    window.loadBibleChapter =
        function () {

            var transEl =
                document.getElementById(
                    'readerTrans'
                );

            var refEl =
                document.getElementById(
                    'readerRef'
                );

            var out =
                document.getElementById(
                    'readerOut'
                );


            if (!out) {
                return;
            }


            var translation =
                (
                    transEl &&
                    transEl.value
                ) ||
                'KJV';


            var reference =
                (
                    refEl &&
                    refEl.value
                ) ||
                'Genesis 1';


            reference =
                reference.trim();


            var parsed =
                gc36ParseReference(
                    reference
                );


            if (!parsed) {

                out.innerHTML =
                    '<div style="color:#991B1B">' +
                    'Invalid Bible reference.<br>' +
                    'Examples: John 3, John 3:16, ' +
                    'Mwanzo 1, Yohana 3:16, Zaburi 23.' +
                    '</div>';

                return;
            }


            out.innerHTML =
                '<div style="color:#94A3B8">' +
                'Loading ' +
                gc36Esc(
                    translation
                ) +
                '…</div>';


            var isSwahili =
                String(
                    translation
                ).toLowerCase() ===
                'swahili';


            /*
             * ====================================================
             * SWAHILI
             * ====================================================
             */
            if (isSwahili) {

                var cacheKey =
                    'gc36_bible_sw_' +
                    gc36BookNumber(
                        parsed.book
                    ) +
                    '_' +
                    parsed.chapter +
                    '_' +
                    (
                        parsed.verseStart ||
                        'all'
                    ) +
                    '_' +
                    (
                        parsed.verseEnd ||
                        'all'
                    );


                gc36LoadSwahili(
                    parsed.book,
                    parsed.chapter,
                    parsed.verseStart,
                    parsed.verseEnd
                )
                .then(
                    function (data) {

                        try {

                            localStorage.setItem(
                                cacheKey,
                                JSON.stringify(
                                    data
                                )
                            );

                        } catch (e) {}


                        gc36PaintBible(
                            out,
                            data,
                            false
                        );

                    }
                )
                .catch(
                    function () {

                        var cached =
                            null;

                        try {

                            cached =
                                JSON.parse(
                                    localStorage.getItem(
                                        cacheKey
                                    ) ||
                                    'null'
                                );

                        } catch (e) {}


                        if (
                            cached &&
                            cached.verses &&
                            cached.verses.length
                        ) {

                            gc36PaintBible(
                                out,
                                cached,
                                true
                            );

                            return;
                        }


                        out.innerHTML =
                            '<div style="color:#991B1B">' +
                            'Could not load Swahili ' +
                            gc36Esc(
                                parsed.book +
                                ' ' +
                                parsed.chapter
                            ) +
                            '.<br>' +
                            '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="loadBibleChapter()">' +
                            '<i class="fas fa-rotate-right"></i> Retry' +
                            '</button>' +
                            '</div>';

                    }
                );


                return;
            }


            /*
             * ====================================================
             * ENGLISH
             * ====================================================
             */

            var code =
                ({
                    KJV: 'kjv',
                    NKJV: 'kjv',
                    NIV: 'web',
                    WEB: 'web',
                    ASV: 'asv',
                    YLT: 'ylt',
                    DARBY: 'darby',
                    DRA: 'dra'
                })[
                    translation
                ] || 'kjv';


            /*
             * Use GraceConnect API first.
             */
            var apiUrl =
                '/api/bible' +
                '?translation=' +
                encodeURIComponent(
                    code
                ) +
                '&book=' +
                encodeURIComponent(
                    parsed.book
                ) +
                '&chapter=' +
                encodeURIComponent(
                    parsed.chapter
                );


            gc36JSON(apiUrl)
            .then(
                function (data) {

                    var verses =
                        Array.isArray(
                            data.verses
                        )
                            ? data.verses
                            : [];


                    if (!verses.length) {

                        throw new Error(
                            'No verses'
                        );

                    }


                    verses =
                        gc36FilterVerses(
                            verses,
                            parsed.verseStart,
                            parsed.verseEnd
                        );


                    if (!verses.length) {

                        throw new Error(
                            'Verse not found'
                        );

                    }


                    return {

                        reference:
                            parsed.book +
                            ' ' +
                            parsed.chapter,

                        verses:
                            verses

                    };

                }
            )
            .catch(
                function () {

                    return gc36JSON(
                        'https://bible-api.com/' +
                        encodeURIComponent(
                            parsed.book +
                            ' ' +
                            parsed.chapter
                        ) +
                        '?translation=' +
                        code
                    )
                    .then(
                        function (data) {

                            var verses =
                                Array.isArray(
                                    data.verses
                                )
                                    ? data.verses
                                    : [];


                            verses =
                                gc36FilterVerses(
                                    verses,
                                    parsed.verseStart,
                                    parsed.verseEnd
                                );


                            if (!verses.length) {

                                throw new Error(
                                    'Verse not found'
                                );

                            }


                            return {

                                reference:
                                    parsed.book +
                                    ' ' +
                                    parsed.chapter,

                                verses:
                                    verses

                            };

                        }
                    );

                }
            )
            .then(
                function (data) {

                    gc36PaintBible(
                        out,
                        data,
                        false
                    );

                }
            )
            .catch(
                function () {

                    out.innerHTML =
                        '<div style="color:#991B1B">' +
                        'Could not load ' +
                        gc36Esc(
                            translation +
                            ' ' +
                            reference
                        ) +
                        '.<br>' +
                        '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="loadBibleChapter()">' +
                        '<i class="fas fa-rotate-right"></i> Retry' +
                        '</button>' +
                        '</div>';

                }
            );

        };


    function gc36PaintBible(
        out,
        data,
        offline
    ) {

        window._bibleVerses =
            data.verses || [];

        window._selectedVerses =
            [];


        var html =
            '<div style="font-weight:700;color:#92400E;margin-bottom:8px">' +
            gc36Esc(
                data.reference
            ) +
            (
                offline
                    ? ' <span class="chip chip-green">offline copy</span>'
                    : ''
            ) +
            '</div>';


        (data.verses || [])
            .forEach(
                function (verse) {

                    html +=
                        '<div ' +
                        'data-v="' +
                        gc36Esc(
                            verse.verse
                        ) +
                        '" ' +
                        'onclick="toggleVerseHighlight(this,' +
                        Number(
                            verse.verse
                        ) +
                        ')" ' +
                        'style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px">' +

                        '<sup>' +
                        gc36Esc(
                            verse.verse
                        ) +
                        '</sup> ' +

                        gc36Esc(
                            verse.text
                        ) +

                        '</div>';

                }
            );


        html +=

            '<div style="display:flex;gap:8px;margin-top:10px">' +

            '<button class="btn btn-primary btn-sm" onclick="saveSelectedVerses()">' +
            '<i class="fas fa-bookmark"></i> Save' +
            '</button>' +

            '<button class="btn btn-chat btn-sm" onclick="openShareVerses()">' +
            '<i class="fas fa-share"></i> Share' +
            '</button>' +

            '</div>';


        out.innerHTML =
            html;

    }


    /* ============================================================
       2. CHAT ENGINE
       ============================================================ */

    function gc36OpenChat(uid) {

        if (!uid) {
            return false;
        }


        /*
         * Primary existing GraceConnect chat engine.
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


        /*
         * Secondary existing chat engine.
         */
        if (
            typeof window.h27ChatWith ===
            'function'
        ) {

            window.h27ChatWith(
                uid
            );

            return false;
        }


        /*
         * Last known fallback.
         */
        if (
            typeof window.openChatWith ===
            'function'
        ) {

            window.openChatWith(
                uid
            );

            return false;
        }


        alert(
            'Chat is not available.'
        );

        return false;

    }


    window.gc36OpenChat =
        gc36OpenChat;


    /* ============================================================
       3. CHAT BUTTON CREATION
       ============================================================ */

    function gc36GetUserId(card) {

        if (!card) {
            return null;
        }


        var attributes = [

            'data-user-id',
            'data-userid',
            'data-uid',
            'data-member-id',
            'data-member-id',
            'data-id'

        ];


        for (
            var i = 0;
            i < attributes.length;
            i++
        ) {

            var value =
                card.getAttribute(
                    attributes[i]
                );

            if (value) {
                return value;
            }

        }


        /*
         * Check buttons/links inside the card for
         * an existing uid.
         */
        var clickable =
            card.querySelectorAll(
                '[data-user-id],[data-userid],[data-uid],[data-member-id]'
            );


        for (
            var j = 0;
            j < clickable.length;
            j++
        ) {

            var node =
                clickable[j];


            for (
                var k = 0;
                k < attributes.length;
                k++
            ) {

                var v =
                    node.getAttribute(
                        attributes[k]
                    );

                if (v) {
                    return v;
                }

            }

        }


        /*
         * Existing Chat/Inbox buttons may contain
         * the uid in their onclick.
         */
        var buttons =
            card.querySelectorAll(
                'button,[role="button"],a'
            );


        for (
            var b = 0;
            b < buttons.length;
            b++
        ) {

            var onclick =
                buttons[b].getAttribute(
                    'onclick'
                ) ||
                '';


            var match =
                onclick.match(
                    /(?:c26OpenChat|h27ChatWith|openChatWith|h32CategoryChat)\s*\(\s*['"]([^'"]+)['"]/
                );


            if (
                match &&
                match[1]
            ) {

                return match[1];

            }

        }


        return null;

    }


    function gc36LooksLikeChatButton(button) {

        if (!button) {
            return false;
        }


        var text =
            String(
                button.textContent ||
                ''
            )
            .trim()
            .toLowerCase();


        var onclick =
            button.getAttribute(
                'onclick'
            ) ||
            '';


        return (

            /chat/.test(text) ||

            /inbox/.test(text) ||

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

        );

    }


    function gc36RemoveDuplicateChatButtons(
        card,
        keep
    ) {

        var buttons =
            card.querySelectorAll(
                'button,a,[role="button"]'
            );


        for (
            var i = 0;
            i < buttons.length;
            i++
        ) {

            var button =
                buttons[i];


            if (
                button === keep
            ) {
                continue;
            }


            if (
                gc36LooksLikeChatButton(
                    button
                )
            ) {

                /*
                 * Only remove buttons that are clearly
                 * Chat/Inbox controls.
                 */
                button.remove();

            }

        }

    }


    function gc36CreateChatButton(
        uid
    ) {

        var button =
            document.createElement(
                'button'
            );


        button.type =
            'button';


        button.className =
            'btn btn-primary btn-sm gc36-chat-btn';


        button.style.whiteSpace =
            'nowrap';


        button.innerHTML =
            '<i class="fas fa-comment-dots"></i> Chat';


        button.onclick =
            function (event) {

                if (event) {

                    event.preventDefault();

                    event.stopPropagation();

                }


                gc36OpenChat(
                    uid
                );

                return false;

            };


        button.setAttribute(
            'data-gc36-chat',
            'true'
        );


        button.setAttribute(
            'data-chat-user-id',
            uid
        );


        return button;

    }


    /* ============================================================
       4. MEMBER CARD DETECTION
       ============================================================ */

    function gc36MemberCards(
        container
    ) {

        if (!container) {
            return [];
        }


        var selectors = [

            '[data-user-id]',
            '[data-userid]',
            '[data-uid]',
            '[data-member-id]',

            '.member-card',
            '.member-item',
            '.user-card',
            '.user-item',

            '.gc32-member',
            '.gc32-member-card',
            '.h32-member',

            'tr'

        ];


        var found = [];


        for (
            var i = 0;
            i < selectors.length;
            i++
        ) {

            var nodes =
                container.querySelectorAll(
                    selectors[i]
                );


            for (
                var j = 0;
                j < nodes.length;
                j++
            ) {

                if (
                    found.indexOf(
                        nodes[j]
                    ) === -1
                ) {

                    found.push(
                        nodes[j]
                    );

                }

            }

        }


        return found;

    }


    /*
     * Find the nearest useful action container
     * inside a member card.
     */
    function gc36ActionHost(
        card
    ) {

        var host =
            card.querySelector(
                '.member-actions'
            ) ||
            card.querySelector(
                '.user-actions'
            ) ||
            card.querySelector(
                '.actions'
            ) ||
            card.querySelector(
                '.gc32-actions'
            ) ||
            card.querySelector(
                '.h32-actions'
            );


        if (host) {
            return host;
        }


        /*
         * For table rows append to the final cell.
         */
        if (
            card.tagName &&
            card.tagName.toLowerCase() ===
            'tr'
        ) {

            var cells =
                card.querySelectorAll(
                    'td'
                );


            if (cells.length) {
                return cells[
                    cells.length - 1
                ];
            }

        }


        return card;

    }


    /* ============================================================
       5. PATCH ONE MEMBER CARD
       ============================================================ */

    function gc36PatchMemberCard(
        card
    ) {

        if (!card) {
            return;
        }


        /*
         * Do not touch cards that are clearly unrelated.
         */
        var uid =
            gc36GetUserId(
                card
            );


        if (!uid) {
            return;
        }


        /*
         * Do not put Chat beside the logged-in user's own
         * member card.
         */
        var currentUserId =
            window.currentUserId ||
            window.currentUser?.id ||
            null;


        if (
            currentUserId &&
            String(uid) ===
            String(currentUserId)
        ) {
            return;
        }


        var host =
            gc36ActionHost(
                card
            );


        if (!host) {
            return;
        }


        /*
         * If APP36 already inserted it, do nothing.
         */
        var existing =
            host.querySelector(
                '[data-gc36-chat="true"]'
            );


        if (existing) {

            existing.setAttribute(
                'data-chat-user-id',
                uid
            );

            gc36RemoveDuplicateChatButtons(
                card,
                existing
            );

            return;

        }


        /*
         * Reuse an existing Chat/Inbox button
         * if one exists, instead of creating a second.
         */
        var existingChat =
            host.querySelector(
                'button,a,[role="button"]'
            );


        var reusable =
            null;


        if (existingChat) {

            var all =
                host.querySelectorAll(
                    'button,a,[role="button"]'
                );


            for (
                var i = 0;
                i < all.length;
                i++
            ) {

                if (
                    gc36LooksLikeChatButton(
                        all[i]
                    )
                ) {

                    reusable =
                        all[i];

                    break;

                }

            }

        }


        if (reusable) {

            reusable.innerHTML =
                '<i class="fas fa-comment-dots"></i> Chat';


            reusable.classList.add(
                'btn',
                'btn-primary',
                'btn-sm'
            );


            reusable.style.whiteSpace =
                'nowrap';


            reusable.type =
                'button';


            reusable.setAttribute(
                'data-gc36-chat',
                'true'
            );


            reusable.setAttribute(
                'data-chat-user-id',
                uid
            );


            /*
             * Replace the onclick cleanly.
             */
            reusable.onclick =
                function (event) {

                    if (event) {

                        event.preventDefault();
                        event.stopPropagation();

                    }

                    gc36OpenChat(
                        uid
                    );

                    return false;

                };


            gc36RemoveDuplicateChatButtons(
                card,
                reusable
            );


            return;

        }


        /*
         * No existing Chat button.
         * Create exactly one.
         */
        var chatButton =
            gc36CreateChatButton(
                uid
            );


        host.appendChild(
            chatButton
        );


        gc36RemoveDuplicateChatButtons(
            card,
            chatButton
        );

    }


    /* ============================================================
       6. GROUP MEMBER LIST
       ============================================================ */

    function gc36PatchGroups() {

        var containers = [

            document.getElementById(
                'groupMembers'
            ),

            document.getElementById(
                'group-members'
            ),

            document.getElementById(
                'groupMemberList'
            ),

            document.getElementById(
                'ggGroupMembers'
            )

        ];


        /*
         * Attribute-based Group containers.
         */
        var attrContainers =
            document.querySelectorAll(
                '[data-group-members]'
            );


        for (
            var a = 0;
            a < attrContainers.length;
            a++
        ) {

            containers.push(
                attrContainers[a]
            );

        }


        for (
            var i = 0;
            i < containers.length;
            i++
        ) {

            var container =
                containers[i];


            if (!container) {
                continue;
            }


            var cards =
                gc36MemberCards(
                    container
                );


            for (
                var j = 0;
                j < cards.length;
                j++
            ) {

                gc36PatchMemberCard(
                    cards[j]
                );

            }

        }

    }


    /* ============================================================
       7. CATEGORY MEMBER LIST
       ============================================================ */

    function gc36PatchCategories() {

        var containers = [

            document.getElementById(
                'h32c-members'
            ),

            document.getElementById(
                'categoryMembers'
            ),

            document.getElementById(
                'category-members'
            ),

            document.getElementById(
                'categoryMemberList'
            ),

            document.getElementById(
                'ggCategoryMembers'
            )

        ];


        var attrContainers =
            document.querySelectorAll(
                '[data-category-members]'
            );


        for (
            var a = 0;
            a < attrContainers.length;
            a++
        ) {

            containers.push(
                attrContainers[a]
            );

        }


        for (
            var i = 0;
            i < containers.length;
            i++
        ) {

            var container =
                containers[i];


            if (!container) {
                continue;
            }


            var cards =
                gc36MemberCards(
                    container
                );


            for (
                var j = 0;
                j < cards.length;
                j++
            ) {

                gc36PatchMemberCard(
                    cards[j]
                );

            }

        }

    }


    /* ============================================================
       8. ALL MEMBER LISTS
       ============================================================ */

    function gc36PatchAll() {

        try {
            gc36PatchGroups();
        } catch (e) {
            console.warn(
                'GC36 groups patch:',
                e
            );
        }


        try {
            gc36PatchCategories();
        } catch (e) {
            console.warn(
                'GC36 categories patch:',
                e
            );
        }

    }


    /* ============================================================
       9. DOM OBSERVER
       ============================================================ */

    var gc36Observer = null;


    function gc36StartObserver() {

        if (
            gc36Observer ||
            !window.MutationObserver
        ) {
            return;
        }


        gc36Observer =
            new MutationObserver(
                function (mutations) {

                    var relevant =
                        false;


                    for (
                        var i = 0;
                        i < mutations.length;
                        i++
                    ) {

                        if (
                            mutations[i].addedNodes &&
                            mutations[i].addedNodes.length
                        ) {

                            relevant =
                                true;

                            break;

                        }

                    }


                    if (!relevant) {
                        return;
                    }


                    /*
                     * Delay slightly so the existing
                     * member renderer finishes first.
                     */
                    clearTimeout(
                        window.gc36PatchTimer
                    );


                    window.gc36PatchTimer =
                        setTimeout(
                            function () {

                                gc36PatchAll();

                            },
                            80
                        );

                }
            );


        gc36Observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

    }


    /* ============================================================
       10. HOOK EXISTING MEMBER RENDERERS
       ============================================================ */

    function gc36HookFunction(
        name
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


        function wrapped() {

            var result;


            try {

                result =
                    original.apply(
                        this,
                        arguments
                    );

            } catch (e) {

                throw e;

            }


            /*
             * Patch after the existing renderer
             * has finished.
             */
            setTimeout(
                function () {

                    gc36PatchAll();

                },
                50
            );


            setTimeout(
                function () {

                    gc36PatchAll();

                },
                300
            );


            return result;

        }


        wrapped.__gc36Wrapped =
            true;


        window[name] =
            wrapped;

    }


    function gc36HookRenderers() {

        gc36HookFunction(
            'h32CatMembers'
        );

        gc36HookFunction(
            'renderGroupMembers'
        );

        gc36HookFunction(
            'loadGroupMembers'
        );

        gc36HookFunction(
            'loadCategoryMembers'
        );

        gc36HookFunction(
            'renderCategoryMembers'
        );

    }


    /* ============================================================
       11. START
       ============================================================ */

    function gc36Start() {

        gc36HookRenderers();

        gc36PatchAll();

        gc36StartObserver();


        /*
         * Repeat after the rest of the application
         * finishes initialising.
         */
        setTimeout(
            gc36PatchAll,
            500
        );


        setTimeout(
            gc36PatchAll,
            1200
        );


        setTimeout(
            gc36PatchAll,
            2500
        );


        setTimeout(
            gc36PatchAll,
            5000
        );


        console.log(
            'GC APP36: active — Bible + Group/Category Chat'
        );

    }


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            gc36Start
        );

    } else {

        gc36Start();

    }


})();
