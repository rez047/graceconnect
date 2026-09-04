// api/bible.js — bulletproof: multiple sources, 7-day edge cache, JSON-only
const BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

async function safeJSON(url) {
  try {
    const r = await fetch(url, { headers: { accept: 'application/json' } });
    if (!r.ok) return null;
    const t = await r.text();
    const s = (t || '').trim();
    if (!s || (s[0] !== '{' && s[0] !== '[')) return null; // rejects HTML 404s
    return JSON.parse(s);
  } catch (e) { return null; }
}

export default async function handler(req, res) {
  const q = req.query || {};
  const translation = String(q.translation || 'kjv').toLowerCase();
  const book = String(q.book || '').trim();
  const chapter = parseInt(q.chapter || '1', 10);
  if (!book || !chapter) return res.status(400).json({ error: 'Missing book/chapter' });

  let nr = parseInt(book, 10);
  if (isNaN(nr)) nr = BOOKS.findIndex(b => b.toLowerCase() === book.toLowerCase()) + 1;
  if (!nr || nr < 1 || nr > 66) return res.status(400).json({ error: 'Bad book' });

  // Bible text never changes → cache at CDN edge for 7 days (1M users, near-zero function invocations)
  res.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=604800');

  let data = null;

  if (['swahili', 'swa', 'swv'].includes(translation)) {
    // 3 Swahili sources in order of reliability
    data = data || await safeJSON('https://api.getbible.net/v2/swahili/' + nr + '/' + chapter + '.json');
    data = data || await safeJSON('https://getbible.net/v2/swahili/' + nr + '/' + chapter + '.json');
    data = data || await safeJSON('https://cdn.jsdelivr.net/gh/nickvdyck/getbible-swahili@main/data/' + nr + '/' + chapter + '.json');
    if (data) return res.status(200).json({
      reference: (data.name || BOOKS[nr - 1] + ' ' + chapter) + ' (Swahili)',
      verses: (data.verses || []).map(v => ({ verse: v.verse, text: v.text }))
    });
  } else {
    // For everything else (KJV, NIV, YLT, etc.)
    const code = { kjv: 'kjv', nkjv: 'kjv', niv: 'web', web: 'web', asv: 'asv', ylt: 'ylt', darby: 'darby', dra: 'dra', esv: 'web', nlt: 'web' }[translation] || 'kjv';
    const ref = encodeURIComponent(BOOKS[nr - 1] + ' ' + chapter);
    data = data || await safeJSON('https://bible-api.com/' + ref + '?translation=' + code);
    data = data || await safeJSON('https://bible-api.com/' + ref); // fallback without translation
    if (data) return res.status(200).json({
      reference: data.reference || BOOKS[nr - 1] + ' ' + chapter,
      verses: (data.verses || []).map(v => ({ verse: v.verse, text: v.text }))
    });
  }

  return res.status(502).json({ error: 'All sources unavailable — try again' });
}
