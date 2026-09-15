// api/bible.js
// GraceConnect Bible chapter proxy
// Swahili uses a complete-Bible source instead of GetBible's NT-only Swahili.

const BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy",
  "Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings",
  "2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah",
  "Esther","Job","Psalm","Proverbs","Ecclesiastes",
  "Song of Solomon","Isaiah","Jeremiah","Lamentations",
  "Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah",
  "Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai",
  "Zechariah","Malachi","Matthew","Mark","Luke","John","Acts",
  "Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians",
  "Philippians","Colossians","1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James",
  "1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
];

async function safeJSON(url) {
  try {
    const r = await fetch(url, {
      headers: {
        accept: "application/json"
      }
    });

    if (!r.ok) return null;

    const text = await r.text();
    const clean = String(text || "").trim();

    if (!clean) return null;

    if (
      clean[0] !== "{" &&
      clean[0] !== "["
    ) {
      return null;
    }

    return JSON.parse(clean);

  } catch (e) {
    return null;
  }
}

function getBookNumber(book) {

  let number = parseInt(book, 10);

  if (!isNaN(number)) {
    return number;
  }

  const index = BOOKS.findIndex(
    b =>
      b.toLowerCase() ===
      String(book || "").trim().toLowerCase()
  );

  return index + 1;
}


/*
============================================================
SWAHILI
============================================================

Prayer Pulse exposes multiple Bible translations and specifically
lists Swahili among its supported languages.

We discover the actual Swahili translation code from its public
metadata instead of hard-coding an unverified code.
*/

let swahiliTranslationPromise = null;

async function getSwahiliTranslationCode() {

  if (swahiliTranslationPromise) {
    return swahiliTranslationPromise;
  }

  swahiliTranslationPromise = (async function () {

    const data = await safeJSON(
      "https://api.prayerpulse.io/bible/get-languages/"
    );

    if (!data) {
      return null;
    }

    const languages =
      Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : [];

    let swahili = null;

    for (const language of languages) {

      const name = String(
        language.language ||
        language.name ||
        ""
      ).toLowerCase();

      if (
        name.includes("swahili") ||
        name.includes("kiswahili")
      ) {
        swahili = language;
        break;
      }
    }

    if (!swahili) {
      return null;
    }

    const translations =
      Array.isArray(swahili.translations)
        ? swahili.translations
        : [];

    if (!translations.length) {
      return null;
    }

    /*
      Prefer a complete/full Swahili Bible.
      Otherwise use the first available Swahili translation.
    */

    const preferred =
      translations.find(t => {

        const text = (
          String(t.short_name || "") +
          " " +
          String(t.full_name || "")
        ).toLowerCase();

        return (
          text.includes("swahili") ||
          text.includes("kiswahili") ||
          text.includes("union") ||
          text.includes("neno")
        );

      }) || translations[0];

    return (
      preferred.short_name ||
      preferred.code ||
      preferred.id ||
      null
    );

  })();

  return swahiliTranslationPromise;
}


async function getSwahiliChapter(bookNumber, chapter) {

  const code =
    await getSwahiliTranslationCode();

  if (!code) {
    return null;
  }

  const url =
    "https://api.prayerpulse.io/bible/get-text/" +
    encodeURIComponent(code) +
    "/" +
    bookNumber +
    "/" +
    chapter +
    "/?clean=true";

  const data = await safeJSON(url);

  if (!data) {
    return null;
  }

  const rows =
    Array.isArray(data)
      ? data
      : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.verses)
          ? data.verses
          : [];

  if (!rows.length) {
    return null;
  }

  const verses = rows
    .map(function (v) {

      return {
        verse:
          Number(
            v.verse ||
            v.verse_number ||
            v.number ||
            0
          ),

        text:
          String(
            v.text ||
            v.value ||
            ""
          )
      };

    })
    .filter(function (v) {
      return v.verse > 0 && v.text;
    });

  if (!verses.length) {
    return null;
  }

  return {
    reference:
      BOOKS[bookNumber - 1] +
      " " +
      chapter +
      " (Swahili)",

    verses: verses
  };
}


/*
============================================================
MAIN HANDLER
============================================================
*/

export default async function handler(req, res) {

  const q = req.query || {};

  const translation =
    String(
      q.translation || "kjv"
    ).toLowerCase();

  const book =
    String(
      q.book || ""
    ).trim();

  const chapter =
    parseInt(
      q.chapter || "1",
      10
    );

  if (!book || !chapter) {

    return res.status(400).json({
      error: "Missing book/chapter"
    });

  }

  const bookNumber =
    getBookNumber(book);

  if (
    !bookNumber ||
    bookNumber < 1 ||
    bookNumber > 66
  ) {

    return res.status(400).json({
      error: "Bad book"
    });

  }

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=604800, stale-while-revalidate=604800"
  );


  /*
  ============================================================
  SWAHILI — COMPLETE BIBLE
  ============================================================
  */

  if (
    translation === "swahili" ||
    translation === "swa" ||
    translation === "swv"
  ) {

    const data =
      await getSwahiliChapter(
        bookNumber,
        chapter
      );

    if (data) {

      return res
        .status(200)
        .json(data);

    }

    return res.status(502).json({
      error:
        "Swahili Bible source unavailable"
    });
  }


  /*
  ============================================================
  OTHER TRANSLATIONS
  ============================================================
  */

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
      BOOKS[bookNumber - 1] +
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
          BOOKS[bookNumber - 1] +
          " " +
          chapter,

        verses:
          (data.verses || [])
            .map(function (v) {

              return {
                verse: v.verse,
                text: v.text
              };

            })

      });

  }


  return res.status(502).json({
    error:
      "Bible source unavailable"
  });
}
