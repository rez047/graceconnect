const SUPA = process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_KEY;
const AT_USER = process.env.AFRICASTALKING_USERNAME;
const AT_KEY = process.env.AFRICASTALKING_API_KEY;
const DOMAIN = process.env.SMS_DOMAIN || 'sms.elduconnect.app';

async function supa(path, opts) {
  opts = opts || {};
  opts.headers = Object.assign({ apikey: SKEY, Authorization: 'Bearer ' + SKEY, 'Content-Type': 'application/json', Prefer: 'return=representation' }, opts.headers);
  const r = await fetch(SUPA + '/rest/v1/' + path, opts);
  return r.json();
}
function norm(p) { p = String(p || '').replace(/\s+/g, ''); if (p.startsWith('+')) p = p.slice(1); if (p.startsWith('0')) p = '254' + p.slice(1); return p; }

async function sendSms(phone, msg) {
  const body = new URLSearchParams();
  body.set('username', AT_USER); body.set('to', phone); body.set('message', msg);
  if (process.env.AT_SENDER_ID) body.set('from', process.env.AT_SENDER_ID);
  const r = await fetch('https://api.africastalking.com/version1/messaging', { method: 'POST', headers: { apiKey: AT_KEY, Accept: 'application/json' }, body });
  const j = await r.json().catch(() => null);
  const rec = j && j.SMSMessageData && j.SMSMessageData.Recipients && j.SMSMessageData.Recipients[0];
  return !!(rec && (rec.statusCode === 101 || rec.statusCode === 102));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { action, phone, code, password, name } = req.body || {};
  const p = norm(phone);
  if (!/^254\d{9}$/.test(p)) return res.status(400).json({ error: 'Invalid phone number' });

  if (action === 'send') {
    const c = String(Math.floor(100000 + Math.random() * 900000));
    const exp = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await supa('sms_otps?phone=eq.' + encodeURIComponent(p), { method: 'DELETE' });
    await supa('sms_otps', { method: 'POST', body: JSON.stringify([{ phone: p, code: c, expires_at: exp }]) });
    const ok = await sendSms(p, 'ElduConnect verification code: ' + c + ' (valid 10 minutes). Do not share it.');
    if (!ok) return res.status(500).json({ error: 'SMS could not be sent. Check Africa\'s Talking credentials.' });
    return res.json({ ok: true });
  }

  if (action === 'register') {
    if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const rows = await supa('sms_otps?phone=eq.' + encodeURIComponent(p) + '&used=eq.false&order=created_at.desc&limit=1');
    const otp = Array.isArray(rows) ? rows[0] : null;
    if (!otp) return res.status(400).json({ error: 'No code sent. Tap Send Code first.' });
    if (new Date(otp.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Code expired. Tap Send Code again.' });
    if (Number(otp.attempts || 0) >= 5) return res.status(400).json({ error: 'Too many tries. Request a new code.' });
    if (String(code || '').trim() !== String(otp.code)) {
      await supa('sms_otps?id=eq.' + otp.id, { method: 'PATCH', body: JSON.stringify({ attempts: Number(otp.attempts || 0) + 1 }) });
      return res.status(400).json({ error: 'Wrong code. Check the SMS and try again.' });
    }
    const email = p + '@' + DOMAIN;
    const existing = await supa('profiles?phone=eq.' + encodeURIComponent(p) + '&select=id');
    if (Array.isArray(existing) && existing.length) return res.status(400).json({ error: 'This phone number is already registered. Please log in.' });
    const cr = await fetch(SUPA + '/auth/v1/admin/users', {
      method: 'POST',
      headers: { apikey: SKEY, Authorization: 'Bearer ' + SKEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, email_confirm: true, phone: p, user_metadata: { name: name || 'Member', phone: p, auth_method: 'sms' } })
    });
    const cu = await cr.json().catch(() => null);
    if (!cr.ok || !cu || !cu.id) return res.status(500).json({ error: 'Could not create account: ' + ((cu && (cu.msg || cu.error_description || cu.message)) || 'unknown') });
    await supa('sms_otps?id=eq.' + otp.id, { method: 'PATCH', body: JSON.stringify({ used: true }) });
    await supa('profiles?id=eq.' + cu.id, { method: 'PATCH', body: JSON.stringify({ phone: p, name: name || 'Member' }) });
    return res.json({ ok: true, email });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
