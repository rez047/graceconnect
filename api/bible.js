const BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
export default async function handler(req, res) {
  const q = req.query || {};
  const translation = String(q.translation || 'kjv').toLowerCase();
  const book = String(q.book || ''); const chapter = parseInt(q.chapter || '1', 10);
  if (!book || !chapter) return res.status(400).json({ error: 'Missing book/chapter' });
  let nr = parseInt(book, 10);
  if (isNaN(nr)) nr = BOOKS.findIndex(b => b.toLowerCase() === book.toLowerCase()) + 1;
  if (!nr || nr < 1 || nr > 66) return res.status(400).json({ error: 'Bad book' });
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  if (translation === 'swahili' || translation === 'swa' || translation === 'swv') {
    try {
      const r = await fetch('https://api.getbible.net/v2/swahili/' + nr + '/' + chapter + '.json');
      if (r.ok) { const d = await r.json(); return res.status(200).json({ reference: (d.name || book + ' ' + chapter) + ' (Swahili)', verses: (d.verses || []).map(v => ({ verse: v.verse, text: v.text })) }); }
    } catch (e) {}
    return res.status(502).json({ error: 'Swahili source unavailable' });
  }
  const code = { kjv:'kjv', nkjv:'kjv', niv:'web', web:'web', asv:'asv', ylt:'ylt', darby:'darby', dra:'dra', esv:'web', nlt:'web' }[translation] || 'kjv';
  try {
    const r = await fetch('https://bible-api.com/' + encodeURIComponent(book + ' ' + chapter) + '?translation=' + code);
    if (r.ok) { const d = await r.json(); return res.status(200).json({ reference: d.reference, verses: (d.verses || []).map(v => ({ verse: v.verse, text: v.text })) }); }
    return res.status(r.status).json({ error: 'Upstream ' + r.status });
  } catch (e) { return res.status(502).json({ error: String(e) }); }
}
