// api/bible.js
// GraceConnect Bible API
// Swahili uses MEGA.Bible Biblia Takatifu.
// Other translations continue using bible-api.com.

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

    return await response.json();

  } catch (error) {
    return null;
  }
}

function getBookNumber(book) {

  const value = String(book || "").trim();

  const numeric = parseInt(value, 10);

  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const index = BOOKS.findIndex(function (name) {
    return name.toLowerCase() === value.toLowerCase();
  });

  return index + 1;
}


/* ============================================================
   SWAHILI — MEGA.BIBLE
   ============================================================ */

function extractSwahiliVerses(data) {

  if (!data) {
    return [];
  }

  /*
   MEGA.Bible simplified chapter format:

   data.chapter.content = [
     {
       type: "verse",
       number: 1,
       text: "..."
     }
   ]

   Keep the parser slightly tolerant so a format change does
   not break the reader.
  */

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

  if (!content) {
    return [];
  }

  return content
    .filter(function (item) {

      if (!item) {
        return false;
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
    .map(function (item) {

      return {
        verse: Number(
          item.number != null
            ? item.number
            : item.verse
        ),

        text: String(
          item.text ||
          item.value ||
          ""
        ).trim()
      };

    })
    .filter(function (item) {

      return (
        item.verse > 0 &&
        item.text
      );

    });
}


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
   First use the simplified endpoint.
   MEGA.Bible documents this endpoint specifically for
   plain chapter text.
  */

  const simpleUrl =
    "https://mega.bible/sw/biblia-takatifu/" +
    megaBook +
    "/" +
    chapter +
    ".simple.json";


  let data =
    await safeJSON(simpleUrl);


  /*
   If simplified JSON is unavailable, try the normal
   chapter JSON endpoint.
  */

  if (!data) {

    const standardUrl =
      "https://mega.bible/sw/biblia-takatifu/" +
      megaBook +
      "/" +
      chapter +
      ".json";

    data =
      await safeJSON(standardUrl);
  }


  if (!data) {
    return null;
  }


  const verses =
    extractSwahiliVerses(data);


  if (!verses.length) {
    return null;
  }


  return {

    reference:
      BOOKS[bookNumber - 1] +
      " " +
      chapter,

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

  const query =
    req.query || {};


  const translation =
    String(
      query.translation || "kjv"
    ).toLowerCase();


  const book =
    String(
      query.book || ""
    ).trim();


  const chapter =
    parseInt(
      query.chapter || "1",
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
      error: "Invalid Bible book"
    });

  }


  res.setHeader(
    "Cache-Control",
    "public, s-maxage=604800, stale-while-revalidate=604800"
  );


  /* ==========================================================
     SWAHILI
     ========================================================== */

  if (
    translation === "swahili" ||
    translation === "swa" ||
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
          "Could not load Swahili Bible chapter"
      });

    }


    return res
      .status(200)
      .json(result);
  }


  /* ==========================================================
     OTHER TRANSLATIONS
     ========================================================== */

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
            .map(function (verse) {

              return {
                verse: verse.verse,
                text: verse.text
              };

            })

      });

  }


  return res.status(502).json({
    error:
      "Bible source unavailable"
  });
}
