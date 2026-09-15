const SUPA = process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_KEY;
const base = () => process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
async function supa(path, opts) {
  opts = opts || {};
  opts.headers = Object.assign({ apikey: SKEY, Authorization: 'Bearer ' + SKEY, 'Content-Type': 'application/json', Prefer: 'return=representation' }, opts.headers);
  const r = await fetch(SUPA + '/rest/v1/' + path, opts);
  return r.json();
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET)
      return res.status(400).json({ error: 'MPESA_CONSUMER_KEY/SECRET not set in Vercel' });
    if (!process.env.MPESA_PASSKEY || process.env.MPESA_PASSKEY === 'undefined')
      return res.status(400).json({ error: 'MPESA_PASSKEY not set in Vercel' });
    if (!process.env.MPESA_SHORTCODE)
      return res.status(400).json({ error: 'MPESA_SHORTCODE not set in Vercel' });

    const { phone, amount, causeId, userId } = req.body || {};
    const amt = Number(amount);
    if (!amt || amt < 1) return res.status(400).json({ error: 'Invalid amount' });
    let p = String(phone || '').replace(/\s+/g, '');
    if (p.startsWith('+')) p = p.slice(1);
    if (p.startsWith('0')) p = '254' + p.slice(1);
    if (!/^254\d{9}$/.test(p)) return res.status(400).json({ error: 'Invalid Safaricom number' });

    const auth = Buffer.from(process.env.MPESA_CONSUMER_KEY + ':' + process.env.MPESA_CONSUMER_SECRET).toString('base64');
    const tr = await fetch(base() + '/oauth/v1/generate?grant_type=client_credentials', { headers: { Authorization: 'Basic ' + auth } });
    const tj = await tr.json();
    if (!tj.access_token)
      return res.status(500).json({ error: 'Daraja auth failed: ' + (tj.errorMessage || tj.errorDescription || 'check consumer key/secret') });

    const ts = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + ts).toString('base64');
    const callbackURL = process.env.MPESA_CALLBACK_URL || ('https://' + req.headers.host + '/api/mpesa-callback');

    const r = await fetch(base() + '/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + tj.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: ts,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amt,
        PartyA: p,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: p,
        CallBackURL: callbackURL,
        AccountReference: String(process.env.MPESA_ACCOUNT_REF || causeId || 'GraceConnect').slice(0, 12),
        TransactionDesc: 'Giving - GraceConnect'
      })
    });
    const d = await r.json();
    if (!d.CheckoutRequestID)
      return res.status(400).json({ error: (d.ErrorMessage || d.errorMessage || d.errorDescription || 'STK push failed') + (d.ErrorCode || d.errorCode ? ' [' + (d.ErrorCode || d.errorCode) + ']' : '') });

    await supa('mpesa_transactions', { method: 'POST', body: JSON.stringify([{ checkout_request_id: d.CheckoutRequestID, cause_id: causeId || null, user_id: userId || null, phone: p, amount: amt, status: 'pending' }]) });
    res.json({ checkoutRequestID: d.CheckoutRequestID, message: d.CustomerMessage || 'Check your phone for the M-Pesa prompt.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
