export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { to, name, token } = req.body || {};
  if (!to || !token) return res.status(400).json({ error: 'Missing fields' });

  const key = process.env.BREVO_API_KEY;
  if (!key) return res.status(500).json({ error: 'Brevo key not set in Vercel env' });

  const app = process.env.APP_URL || 'https://graceconnect-eight.vercel.app';
  const sender = process.env.SENDER_EMAIL || 'no-reply@brevo.com';
  const link = app + '/api/verify?token=' + encodeURIComponent(token);

  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: sender, name: 'GraceConnect' },
        to: [{ email: to, name: name || 'Friend' }],
        subject: '✅ Verify your email — GraceConnect',
        htmlContent:
          '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">' +
          '<div style="background:linear-gradient(135deg,#4F46E5,#A855F7);padding:24px;text-align:center;color:#fff"><h2 style="margin:0">✝️ GraceConnect</h2></div>' +
          '<div style="padding:28px"><h3 style="margin:0 0 8px">Welcome, ' + (name || 'Friend') + '!</h3>' +
          '<p style="color:#555">Tap the button below to verify your email address and activate your account.</p>' +
          '<p style="text-align:center;margin:24px 0"><a href="' + link + '" style="background:#4F46E5;color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:bold">Verify My Email</a></p>' +
          '<p style="color:#999;font-size:12px">If the button doesn\'t work, paste this link in your browser:<br>' + link + '</p></div></div>'
      })
    });
    if (!r.ok) { const t = await r.text(); return res.status(500).json({ error: t }); }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
