// api/bible.js — REPLACE ENTIRE FILE
const BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephania","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

// per-instance stale cache (serverless warm instances)
const MEM = new Map();

async function getJSON(url){
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const t = await r.text();
  const s = (t || '').trim();
  if (!s || (s[0] !== '{' && s[0] !== '[')) throw new Error('Upstream returned HTML');
  return JSON.parse(s); // throws if broken -> caught below
}

export default async function handler(req, res){
  const q = req.query || {};
  const translation = String(q.translation || 'kjv').toLowerCase();
  const book = String(q.book || '');
  const chapter = parseInt(q.chapter || '1', 10);
  if (!book || !chapter) return res.status(400).json({ error: 'Missing book/chapter' });
  let nr = parseInt(book, 10);
  if (isNaN(nr)) nr = BOOKS.findIndex(b => b.toLowerCase() === book.toLowerCase()) + 1;
  if (!nr || nr < 1 || nr > 66) return res.status(400).json({ error: 'Bad book' });

  // Bible text never changes -> cache at the CDN edge for 7 days.
  // With 1M users, repeated chapters are served by Vercel edge WITHOUT running this function.
  res.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=604800');

  const key = translation + ':' + nr + ':' + chapter;
  const urls = [];
  if (['swahili','swa','swv'].includes(translation)) {
    urls.push('https://api.getbible.net/v2/swahili/' + nr + '/' + chapter + '.json');
    urls.push('https://getbible.net/v2/swahili/' + nr + '/' + chapter + '.json');
  } else {
    const code = { kjv:'kjv', nkjv:'kjv', niv:'web', web:'web', asv:'asv', ylt:'ylt', darby:'darby', dra:'dra', esv:'web', nlt:'web' }[translation] || 'kjv';
    urls.push('https://bible-api.com/' + encodeURIComponent(BOOKS[nr-1] + ' ' + chapter) + '?translation=' + code);
  }

  for (const url of urls) {
    try {
      const d = await getJSON(url);
      const verses = (d.verses || []).map(v => ({ verse: v.verse, text: v.text })).filter(v => v.text);
      if (verses.length) {
        const out = { reference: (d.reference || d.name || BOOKS[nr-1] + ' ' + chapter) + (translation.startsWith('sw') ? ' (Swahili)' : ''), verses };
        MEM.set(key, out);
        return res.status(200).json(out);
      }
    } catch (e) { /* try next source */ }
  }

  const stale = MEM.get(key);
  if (stale) return res.status(200).json(stale); // better than an error
  return res.status(502).json({ error: 'Bible source unavailable' }); // ALWAYS JSON, never HTML
}
