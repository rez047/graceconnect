const SUPA = process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_KEY;
export default async function handler(req, res) {
  const cr = req.query.cr;
  if (!cr) return res.status(400).json({ error: 'cr required' });
  const r = await fetch(SUPA + '/rest/v1/mpesa_transactions?checkout_request_id=eq.' + encodeURIComponent(cr), { headers: { apikey: SKEY, Authorization: 'Bearer ' + SKEY } });
  const rows = await r.json();
  const tx = Array.isArray(rows) ? rows[0] : null;
  if (!tx) return res.json({ status: 'unknown' });
  res.json({ status: tx.status, receipt: tx.mpesa_receipt, desc: tx.result_desc });
}
