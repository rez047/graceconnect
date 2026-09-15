// ============================================================
// GRACECONNECT — api/bible.js
// Bible chapter API
//
// FIX:
// - Swahili Old Testament now comes from the complete
//   Swahili Agano la Kale dataset.
// - Swahili New Testament uses the complete Agano Jipya
//   dataset.
// - Existing KJV/other translation behaviour is preserved.
// - Handles several possible JSON structures safely.
// - CDN/server cache enabled.
// ============================================================

const BOOKS = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalm",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation"
];

/* ============================================================
   SWAHILI DATASETS
   ============================================================ */

const SWAHILI_OT =
  "https://cdn.jsdelivr.net/gh/" +
  "shemmjunior/swahili-bible-edition@main/" +
  "json/split_version/agano-kale-edition.json";

const SWAHILI_NT =
  "https://cdn.jsdelivr.net/gh/" +
  "shemmjunior/swahili-bible-edition@main/" +
  "json/split_version/agano-jipya-edition.json";

/* ============================================================
   GENERIC SAFE JSON
   ============================================================ */

async function safeJSON(url) {
  try {
    const r = await fetch(url, {
      headers: {
        accept: "application/json"
      }
    });

    if (!r.ok) {
      return null;
    }

    const text = await r.text();
    const body = (text || "").trim();

    if (
      !body ||
      (body[0] !== "{" && body[0] !== "[")
    ) {
      return null;
    }

    return JSON.parse(body);

  } catch (e) {
    return null;
  }
}

/* ============================================================
   NORMALIZATION HELPERS
   ============================================================ */

function cleanBookName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBookName(name) {

  const n = cleanBookName(name);

  const aliases = {
    "psalms": "Psalm",
    "zaburi": "Psalm",

    "song of songs": "Song of Solomon",
    "song of solomon": "Song of Solomon",
    "wimbo wa sulomoni": "Song of Solomon",

    "matthew": "Matthew",
    "mathayo": "Matthew",

    "mark": "Mark",
    "marko": "Mark",

    "luke": "Luke",
    "luka": "Luke",

    "john": "John",
    "yohana": "John",

    "acts": "Acts",
    "matendo": "Acts",

    "revelation": "Revelation",
    "ufunuo": "Revelation"
  };

  return aliases[n] || name;
}

/* ============================================================
   FIND BOOK IN UNKNOWN JSON STRUCTURE
   ============================================================ */

function findBook(data, bookName, bookNumber) {

  if (!data) {
    return null;
  }

  const wanted = cleanBookName(
    normalizeBookName(bookName)
  );

  /* ----------------------------------------------------------
     Direct object lookup
     ---------------------------------------------------------- */

  if (
    typeof data === "object" &&
    !Array.isArray(data)
  ) {

    const keys = Object.keys(data);

    for (const key of keys) {

      const normalized =
        cleanBookName(
          normalizeBookName(key)
        );

      if (
        normalized === wanted ||
        normalized === cleanBookName(bookName)
      ) {
        return data[key];
      }
    }

    /* Numeric book keys */
    if (
      data[String(bookNumber)] &&
      typeof data[String(bookNumber)] === "object"
    ) {
      return data[String(bookNumber)];
    }

    /* Common wrappers */
    const wrappers = [
      "books",
      "book",
      "data",
      "bible",
      "scripture",
      "verses"
    ];

    for (const wrapper of wrappers) {

      if (
        data[wrapper] &&
        typeof data[wrapper] === "object"
      ) {

        const found = findBook(
          data[wrapper],
          bookName,
          bookNumber
        );

        if (found) {
          return found;
        }
      }
    }
  }

  /* ----------------------------------------------------------
     Array of books
     ---------------------------------------------------------- */

  if (Array.isArray(data)) {

    for (const item of data) {

      if (!item || typeof item !== "object") {
        continue;
      }

      const name =
        item.name ||
        item.book ||
        item.title ||
        item.book_name ||
        item.bookName;

      if (
        name &&
        (
          cleanBookName(name) === wanted ||
          cleanBookName(name) ===
            cleanBookName(bookName)
        )
      ) {
        return item;
      }

      if (
        String(
          item.id ||
          item.number ||
          item.book_number ||
          ""
        ) === String(bookNumber)
      ) {
        return item;
      }
    }
  }

  return null;
}

/* ============================================================
   FIND CHAPTER IN BOOK
   ============================================================ */

function findChapter(book, chapterNumber) {

  if (!book) {
    return null;
  }

  const ch = String(chapterNumber);

  /* Direct chapter-keyed object */

  if (
    typeof book === "object" &&
    !Array.isArray(book)
  ) {

    const directKeys = [
      ch,
      "chapter_" + ch,
      "chapter" + ch
    ];

    for (const key of directKeys) {

      if (
        Object.prototype.hasOwnProperty.call(
          book,
          key
        )
      ) {
        return book[key];
      }
    }

    const chapterWrappers = [
      "chapters",
      "chapter",
      "data",
      "verses"
    ];

    for (const wrapper of chapterWrappers) {

      if (
        book[wrapper] &&
        typeof book[wrapper] === "object"
      ) {

        const found =
          findChapter(
            book[wrapper],
            chapterNumber
          );

        if (found) {
          return found;
        }
      }
    }
  }

  /* Array of chapters */

  if (Array.isArray(book)) {

    for (const item of book) {

      if (
        item &&
        typeof item === "object"
      ) {

        const number =
          item.chapter ||
          item.chapter_number ||
          item.chapterNumber ||
          item.number;

        if (
          String(number || "") === ch
        ) {
          return item;
        }
      }
    }

    /* Sometimes the array itself is verses
       for one chapter. */
    if (
      book.length &&
      book.some(function (v) {
        return (
          v &&
          typeof v === "object" &&
          (
            v.verse ||
            v.verse_number ||
            v.verseNumber
          )
        );
      })
    ) {
      return book;
    }
  }

  return null;
}

/* ============================================================
   EXTRACT VERSES
   ============================================================ */

function extractVerses(chapter) {

  if (!chapter) {
    return [];
  }

  let source = chapter;

  /* Common wrappers */

  if (
    source &&
    typeof source === "object" &&
    !Array.isArray(source)
  ) {

    const wrappers = [
      "verses",
      "verse",
      "data"
    ];

    for (const key of wrappers) {

      if (Array.isArray(source[key])) {
        source = source[key];
        break;
      }
    }
  }

  /* ----------------------------------------------------------
     Array format
     ---------------------------------------------------------- */

  if (Array.isArray(source)) {

    return source
      .map(function (v, index) {

        if (
          typeof v === "string"
        ) {
          return {
            verse: index + 1,
            text: v.trim()
          };
        }

        if (!v || typeof v !== "object") {
          return null;
        }

        const number =
          v.verse ||
          v.verse_number ||
          v.verseNumber ||
          v.number ||
          (index + 1);

        const text =
          v.text ||
          v.verse_text ||
          v.verseText ||
          v.content ||
          v.value ||
          "";

        return {
          verse: parseInt(number, 10) || index + 1,
          text: String(text || "").trim()
        };

      })
      .filter(function (v) {
        return v && v.text;
      });
  }

  /* ----------------------------------------------------------
     Object format:
     {
       "1": "text",
       "2": "text"
     }
     ---------------------------------------------------------- */

  if (
    typeof source === "object"
  ) {

    return Object.keys(source)
      .map(function (key) {

        const value =
          source[key];

        if (
          typeof value === "string"
        ) {
          return {
            verse:
              parseInt(key, 10) || 0,
            text:
              value.trim()
          };
        }

        if (
          value &&
          typeof value === "object"
        ) {

          const number =
            value.verse ||
            value.verse_number ||
            value.verseNumber ||
            parseInt(key, 10) ||
            0;

          const text =
            value.text ||
            value.content ||
            value.value ||
            "";

          return {
            verse:
              parseInt(number, 10) || 0,
            text:
              String(text || "").trim()
          };
        }

        return null;

      })
      .filter(function (v) {
        return (
          v &&
          v.text
        );
      })
      .sort(function (a, b) {
        return a.verse - b.verse;
      });
  }

  return [];
}

/* ============================================================
   LOAD SWAHILI CHAPTER
   ============================================================ */

async function getSwahiliChapter(
  bookName,
  bookNumber,
  chapterNumber
) {

  const source =
    bookNumber <= 39
      ? SWAHILI_OT
      : SWAHILI_NT;

  const data =
    await safeJSON(source);

  if (!data) {
    return null;
  }

  const book =
    findBook(
      data,
      bookName,
      bookNumber
    );

  if (!book) {
    return null;
  }

  const chapter =
    findChapter(
      book,
      chapterNumber
    );

  if (!chapter) {
    return null;
  }

  const verses =
    extractVerses(chapter);

  if (!verses.length) {
    return null;
  }

  return {
    reference:
      bookName +
      " " +
      chapterNumber +
      " (Swahili)",

    verses: verses
  };
}

/* ============================================================
   MAIN HANDLER
   ============================================================ */

export default async function handler(
  req,
  res
) {

  const q =
    req.query || {};

  const translation =
    String(
      q.translation || "kjv"
    ).toLowerCase()
     .trim();

  const book =
    String(
      q.book || ""
    ).trim();

  const chapter =
    parseInt(
      q.chapter || "1",
      10
    );

  if (
    !book ||
    !chapter ||
    chapter < 1
  ) {

    return res.status(400).json({
      error:
        "Missing book/chapter"
    });
  }

  /* ----------------------------------------------------------
     Resolve book number
     ---------------------------------------------------------- */

  let nr =
    parseInt(
      book,
      10
    );

  if (isNaN(nr)) {

    nr =
      BOOKS.findIndex(
        function (b) {
          return (
            cleanBookName(b) ===
            cleanBookName(book)
          );
        }
      ) + 1;
  }

  if (
    !nr ||
    nr < 1 ||
    nr > 66
  ) {

    return res.status(400).json({
      error:
        "Bad book"
    });
  }

  const bookName =
    BOOKS[nr - 1];

  /* ----------------------------------------------------------
     Cache
     ---------------------------------------------------------- */

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=604800, stale-while-revalidate=604800"
  );

  /* ==========================================================
     SWAHILI
     ========================================================== */

  if (
    [
      "swahili",
      "swa",
      "swv"
    ].includes(translation)
  ) {

    const swahili =
      await getSwahiliChapter(
        bookName,
        nr,
        chapter
      );

    if (swahili) {
      return res
        .status(200)
        .json(swahili);
    }

    /*
     * Last fallback:
     * GetBible's Swahili endpoint.
     *
     * This remains here only as a fallback.
     * The complete Agano datasets above are tried first.
     */

    let data =
      await safeJSON(
        "https://api.getbible.net/v2/swahili/" +
        nr +
        "/" +
        chapter +
        ".json"
      );

    if (!data) {

      data =
        await safeJSON(
          "https://getbible.net/v2/swahili/" +
          nr +
          "/" +
          chapter +
          ".json"
        );
    }

    if (data) {

      return res
        .status(200)
        .json({
          reference:
            data.name ||
            bookName +
            " " +
            chapter +
            " (Swahili)",

          verses:
            (data.verses || [])
              .map(function (v) {
                return {
                  verse:
                    v.verse,
                  text:
                    v.text
                };
              })
              .filter(function (v) {
                return v.text;
              })
        });
    }

    return res
      .status(502)
      .json({
        error:
          "Swahili Bible source unavailable"
      });
  }

  /* ==========================================================
     OTHER TRANSLATIONS
     ========================================================== */

  const code = {
    kjv: "kjv",
    nkjv: "kjv",
    niv: "web",
    web: "web",
    asv: "asv",
    ylt: "ylt",
    darby: "darby",
    dra: "dra",
    esv: "web",
    nlt: "web"
  }[translation] || "kjv";

  const reference =
    encodeURIComponent(
      bookName +
      " " +
      chapter
    );

  let data =
    await safeJSON(
      "https://bible-api.com/" +
      reference +
      "?translation=" +
      code
    );

  if (!data) {

    data =
      await safeJSON(
        "https://bible-api.com/" +
        reference
      );
  }

  if (data) {

    return res
      .status(200)
      .json({
        reference:
          data.reference ||
          bookName +
          " " +
          chapter,

        verses:
          (data.verses || [])
            .map(function (v) {
              return {
                verse:
                  v.verse,
                text:
                  v.text
              };
            })
            .filter(function (v) {
              return v.text;
            })
      });
  }

  return res
    .status(502)
    .json({
      error:
        "All Bible sources unavailable — try again"
    });
}
