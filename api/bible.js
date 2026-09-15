// api/bible.js
// GraceConnect Bible API
// English + Swahili Bible support
//
// English:
//   bible-api.com
//
// Swahili:
//   GetBible V2
//   MEGA.Bible fallback
//
// Supports:
//   John 3
//   John 3:16
//   John 3:16-18
//   Yohana 3
//   Yohana 3:16
//   Mwanzo 1
//   Zaburi 23
//   Warumi 8
//   Ufunuo 21

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

const MEGA_BOOKS = [
  "gen",
  "exo",
  "lev",
  "num",
  "deu",
  "jos",
  "jdg",
  "rut",
  "1sa",
  "2sa",
  "1ki",
  "2ki",
  "1ch",
  "2ch",
  "ezr",
  "neh",
  "est",
  "job",
  "psa",
  "pro",
  "ecc",
  "sng",
  "isa",
  "jer",
  "lam",
  "eze",
  "dan",
  "hos",
  "joe",
  "amo",
  "oba",
  "jon",
  "mic",
  "nah",
  "hab",
  "zep",
  "hag",
  "zec",
  "mal",
  "mat",
  "mrk",
  "luk",
  "jhn",
  "act",
  "rom",
  "1co",
  "2co",
  "gal",
  "eph",
  "php",
  "col",
  "1th",
  "2th",
  "1ti",
  "2ti",
  "tit",
  "phm",
  "heb",
  "jas",
  "1pe",
  "2pe",
  "1jn",
  "2jn",
  "3jn",
  "jud",
  "rev"
];

/*
 * Common Swahili Bible book names.
 */
const SWAHILI_BOOKS = {
  "mwanzo": "Genesis",
  "kutoka": "Exodus",
  "mambo ya walawi": "Leviticus",
  "walawi": "Leviticus",
  "hesabu": "Numbers",
  "kumbukumbu la torati": "Deuteronomy",
  "kumbukumbu": "Deuteronomy",
  "yoshua": "Joshua",
  "waamuzi": "Judges",
  "ruthu": "Ruth",
  "1 samweli": "1 Samuel",
  "2 samweli": "2 Samuel",
  "1 wafalme": "1 Kings",
  "2 wafalme": "2 Kings",
  "1 nyakati": "1 Chronicles",
  "2 nyakati": "2 Chronicles",
  "ezra": "Ezra",
  "nehemia": "Nehemiah",
  "esta": "Esther",
  "ayubu": "Job",
  "zaburi": "Psalm",
  "zab": "Psalm",
  "mithali": "Proverbs",
  "mhubiri": "Ecclesiastes",
  "wimbo ulio bora": "Song of Solomon",
  "wimbo wa sulemani": "Song of Solomon",
  "isaya": "Isaiah",
  "yeremia": "Jeremiah",
  "maombolezo": "Lamentations",
  "ezekieli": "Ezekiel",
  "danieli": "Daniel",
  "hosea": "Hosea",
  "yoeli": "Joel",
  "amosi": "Amos",
  "obadia": "Obadiah",
  "yona": "Jonah",
  "mika": "Micah",
  "nahumu": "Nahum",
  "habakuki": "Habakkuk",
  "sefania": "Zephaniah",
  "hagayi": "Haggai",
  "zekaria": "Zechariah",
  "malaki": "Malachi",
  "mathayo": "Matthew",
  "matayo": "Matthew",
  "marko": "Mark",
  "mariko": "Mark",
  "luka": "Luke",
  "yohana": "John",
  "matendo ya mitume": "Acts",
  "matendo": "Acts",
  "warumi": "Romans",
  "1 wakorintho": "1 Corinthians",
  "2 wakorintho": "2 Corinthians",
  "1 wakorinto": "1 Corinthians",
  "2 wakorinto": "2 Corinthians",
  "wagalatia": "Galatians",
  "waefeso": "Ephesians",
  "wafilipi": "Philippians",
  "wakolosai": "Colossians",
  "1 wathesalonike": "1 Thessalonians",
  "2 wathesalonike": "2 Thessalonians",
  "1 timotheo": "1 Timothy",
  "2 timotheo": "2 Timothy",
  "tito": "Titus",
  "filemoni": "Philemon",
  "waebrania": "Hebrews",
  "yakobo": "James",
  "1 petro": "1 Peter",
  "2 petro": "2 Peter",
  "1 yohana": "1 John",
  "2 yohana": "2 John",
  "3 yohana": "3 John",
  "yuda": "Jude",
  "ufunuo": "Revelation",
  "ufunuo wa yohana": "Revelation"
};

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function safeJSON(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();

    if (!text || !text.trim()) {
      return null;
    }

    return JSON.parse(text);

  } catch (error) {
    return null;
  }
}

function resolveBookName(book) {

  const value = normalize(book);

  if (!value) {
    return null;
  }

  if (/^\d+$/.test(value)) {

    const number = parseInt(value, 10);

    if (number >= 1 && number <= 66) {
      return BOOKS[number - 1];
    }

    return null;
  }

  for (let i = 0; i < BOOKS.length; i++) {

    if (normalize(BOOKS[i]) === value) {
      return BOOKS[i];
    }
  }

  if (SWAHILI_BOOKS[value]) {
    return SWAHILI_BOOKS[value];
  }

  return null;
}

function getBookNumber(book) {

  const resolved = resolveBookName(book);

  if (!resolved) {
    return 0;
  }

  return BOOKS.indexOf(resolved) + 1;
}

function normalizeVerse(item) {

  if (!item) {
    return null;
  }

  let number =
    item.verse != null
      ? item.verse
      : item.number != null
        ? item.number
        : item.verseNumber != null
          ? item.verseNumber
          : null;

  let text =
    item.text != null
      ? item.text
      : item.value != null
        ? item.value
        : item.content != null
          ? item.content
          : "";

  number = Number(number);

  text = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (
    !Number.isFinite(number) ||
    number <= 0 ||
    !text
  ) {
    return null;
  }

  return {
    verse: number,
    text: text
  };
}

function normalizeVerses(items) {

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map(normalizeVerse)
    .filter(function (verse) {
      return !!verse;
    });
}

/*
 * GetBible V2 response parser.
 */
function extractGetBibleVerses(data) {

  if (!data) {
    return [];
  }

  const candidates = [];

  if (Array.isArray(data.verses)) {
    candidates.push(data.verses);
  }

  if (
    data.chapter &&
    Array.isArray(data.chapter.verses)
  ) {
    candidates.push(data.chapter.verses);
  }

  if (
    data.data &&
    Array.isArray(data.data.verses)
  ) {
    candidates.push(data.data.verses);
  }

  if (
    data.data &&
    data.data.chapter &&
    Array.isArray(data.data.chapter.verses)
  ) {
    candidates.push(
      data.data.chapter.verses
    );
  }

  for (let i = 0; i < candidates.length; i++) {

    const verses =
      normalizeVerses(candidates[i]);

    if (verses.length) {
      return verses;
    }
  }

  return [];
}

/*
 * MEGA.Bible parser.
 */
function extractMegaVerses(data) {

  if (!data) {
    return [];
  }

  let content = null;

  if (
    data.chapter &&
    Array.isArray(data.chapter.content)
  ) {
    content = data.chapter.content;
  }

  if (
    !content &&
    Array.isArray(data.content)
  ) {
    content = data.content;
  }

  if (
    !content &&
    Array.isArray(data.verses)
  ) {
    content = data.verses;
  }

  if (
    !content &&
    data.chapter &&
    Array.isArray(data.chapter.verses)
  ) {
    content = data.chapter.verses;
  }

  if (!content) {
    return [];
  }

  return content
    .filter(function (item, index) {

      if (!item) {
        return false;
      }

      if (typeof item === 'string') {
        return item.trim().length > 0;
      }

      if (
        item.type &&
        String(item.type).toLowerCase() !== "verse"
      ) {
        return false;
      }

      return (
        item.number != null ||
        item.verse != null
      );
    })
    .map(function (item, index) {
      if (typeof item === 'string') {
        return normalizeVerse({
          verse: index + 1,
          text: item
        });
      }
      return normalizeVerse({
        verse:
          item.number != null
            ? item.number
            : item.verse != null
            ? item.verse
            : index + 1,
        text: item.text || item.value || item.content || ""
      });
    })
    .filter(function (verse) {
      return !!verse;
    });
}

function filterVerses(
  verses,
  verse,
  startVerse,
  endVerse
) {

  if (!verses.length) {
    return [];
  }

  let start = null;
  let end = null;

  if (
    verse != null &&
    Number.isFinite(Number(verse))
  ) {

    start = Number(verse);
    end = Number(verse);

  } else {

    if (
      startVerse != null &&
      Number.isFinite(Number(startVerse))
    ) {
      start = Number(startVerse);
    }

    if (
      endVerse != null &&
      Number.isFinite(Number(endVerse))
    ) {
      end = Number(endVerse);
    }
  }

  if (start == null && end == null) {
    return verses;
  }

  if (start == null) {
    start = end;
  }

  if (end == null) {
    end = start;
  }

  if (end < start) {
    const temp = start;
    start = end;
    end = temp;
  }

  return verses.filter(function (item) {

    const n = Number(item.verse);

    return n >= start && n <= end;
  });
}

function makeResult(
  bookNumber,
  chapter,
  verses,
  verse,
  startVerse,
  endVerse
) {

  const filtered =
    filterVerses(
      verses,
      verse,
      startVerse,
      endVerse
    );

  if (!filtered.length) {
    return null;
  }

  let reference =
    BOOKS[bookNumber - 1] +
    " " +
    chapter;

  let first = null;
  let last = null;

  if (
    verse != null &&
    Number.isFinite(Number(verse))
  ) {

    first = Number(verse);
    last = first;

  } else {

    if (
      startVerse != null &&
      Number.isFinite(Number(startVerse))
    ) {
      first = Number(startVerse);
    }

    if (
      endVerse != null &&
      Number.isFinite(Number(endVerse))
    ) {
      last = Number(endVerse);
    }
  }

  if (first != null) {

    reference += ":" + first;

    if (
      last != null &&
      last !== first
    ) {
      reference += "-" + last;
    }
  }

  return {
    reference: reference,
    verses: filtered
  };
}

/*
 * ============================================================
 * SWAHILI
 * ============================================================
 */
async function getSwahiliChapter(
  bookNumber,
  chapter
) {

  const megaBook =
    MEGA_BOOKS[bookNumber - 1];

  if (!megaBook) {
    return null;
  }

  /*
   * Primary Swahili source:
   * GetBible V2.
   */
  const getBibleUrl =
    "https://api.getbible.net/v2/swahili/" +
    bookNumber +
    "/" +
    chapter +
    ".json";

  const getBibleData =
    await safeJSON(getBibleUrl);

  if (getBibleData) {

    const verses =
      extractGetBibleVerses(
        getBibleData
      );

    if (verses.length) {

      return {
        reference:
          BOOKS[bookNumber - 1] +
          " " +
          chapter,

        verses: verses
      };
    }
  }

  /*
   * First MEGA fallback.
   */
  const simpleUrl =
    "https://mega.bible/sw/biblia-takatifu/" +
    megaBook +
    "/" +
    chapter +
    ".simple.json";

  const simpleData =
    await safeJSON(simpleUrl);

  if (simpleData) {

    const verses =
      extractMegaVerses(
        simpleData
      );

    if (verses.length) {

      return {
        reference:
          BOOKS[bookNumber - 1] +
          " " +
          chapter,

        verses: verses
      };
    }
  }

  /*
   * Second MEGA fallback.
   */
  const standardUrl =
    "https://mega.bible/sw/biblia-takatifu/" +
    megaBook +
    "/" +
    chapter +
    ".json";

  const standardData =
    await safeJSON(standardUrl);

  if (standardData) {

    const verses =
      extractMegaVerses(
        standardData
      );

    if (verses.length) {

      return {
        reference:
          BOOKS[bookNumber - 1] +
          " " +
          chapter,

        verses: verses
      };
    }
  }

  return null;
}

/*
 * ============================================================
 * ENGLISH / OTHER TRANSLATIONS
 * ============================================================
 */
async function getEnglishChapter(
  bookNumber,
  chapter,
  translation
) {

  const translationCode = {

    kjv: "kjv",
    nkjv: "kjv",
    web: "web",
    niv: "web",
    asv: "asv",
    ylt: "ylt",
    darby: "darby",
    dra: "dra",
    esv: "web",
    nlt: "web"

  }[translation] || "kjv";

  const reference =
    encodeURIComponent(
      BOOKS[bookNumber - 1] +
      " " +
      chapter
    );

  let data =
    await safeJSON(
      "https://bible-api.com/" +
      reference +
      "?translation=" +
      translationCode
    );

  if (!data) {

    data =
      await safeJSON(
        "https://bible-api.com/" +
        reference
      );
  }

  if (!data) {
    return null;
  }

  const verses =
    normalizeVerses(
      data.verses || []
    );

  if (!verses.length) {
    return null;
  }

  return {
    reference:
      data.reference ||
      BOOKS[bookNumber - 1] +
      " " +
      chapter,

    verses: verses
  };
}

/*
 * ============================================================
 * MAIN HANDLER
 * ============================================================
 */
export default async function handler(
  req,
  res
) {

  const query =
    req.query || {};

  const translation =
    String(
      query.translation || "kjv"
    )
      .trim()
      .toLowerCase();

  const requestedBook =
    String(
      query.book || ""
    ).trim();

  const chapter =
    parseInt(
      query.chapter || "1",
      10
    );

  const verse =
    query.verse != null
      ? parseInt(query.verse, 10)
      : null;

  const startVerse =
    query.startVerse != null
      ? parseInt(query.startVerse, 10)
      : null;

  const endVerse =
    query.endVerse != null
      ? parseInt(query.endVerse, 10)
      : null;

  if (
    !requestedBook ||
    !Number.isFinite(chapter) ||
    chapter < 1
  ) {

    return res.status(400).json({
      error:
        "Missing or invalid book/chapter"
    });
  }

  const resolvedBook =
    resolveBookName(
      requestedBook
    );

  if (!resolvedBook) {

    return res.status(400).json({
      error:
        "Invalid Bible book",
      book:
        requestedBook
    });
  }

  const bookNumber =
    BOOKS.indexOf(
      resolvedBook
    ) + 1;

  if (
    bookNumber < 1 ||
    bookNumber > 66
  ) {

    return res.status(400).json({
      error:
        "Invalid Bible book"
    });
  }

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=604800, stale-while-revalidate=604800"
  );

  /*
   * SWAHILI
   */
  if (
    translation === "swahili" ||
    translation === "swa" ||
    translation === "sw" ||
    translation === "swv"
  ) {

    const result =
      await getSwahiliChapter(
        bookNumber,
        chapter
      );

    if (!result) {

      return res.status(502).json({
        error:
          "Could not load Swahili Bible chapter",
        reference:
          resolvedBook +
          " " +
          chapter
      });
    }

    const finalResult =
      makeResult(
        bookNumber,
        chapter,
        result.verses,
        verse,
        startVerse,
        endVerse
      );

    if (!finalResult) {

      return res.status(404).json({
        error:
          "Requested Swahili verse was not found",
        reference:
          resolvedBook +
          " " +
          chapter
      });
    }

    return res
      .status(200)
      .json(finalResult);
  }

  /*
   * ENGLISH / OTHER TRANSLATIONS
   */
  const result =
    await getEnglishChapter(
      bookNumber,
      chapter,
      translation
    );

  if (!result) {

    return res.status(502).json({
      error:
        "Bible source unavailable",
      reference:
        resolvedBook +
        " " +
        chapter
    });
  }

  const finalResult =
    makeResult(
      bookNumber,
      chapter,
      result.verses,
      verse,
      startVerse,
      endVerse
    );

  if (!finalResult) {

    return res.status(404).json({
      error:
        "Requested verse was not found",
      reference:
        resolvedBook +
        " " +
        chapter
    });
  }

  return res
    .status(200)
    .json(finalResult);
}
