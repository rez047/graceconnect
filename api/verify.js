export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token') || '';
  const U = process.env.SUPABASE_URL || '';
  const S = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const H = { apikey: S, Authorization: 'Bearer ' + S, 'Content-Type': 'application/json' };

  const page = (ok, msg) => '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verification</title></head>' +
    '<body style="margin:0;font-family:Arial,sans-serif;background:#F8FAFC;display:flex;align-items:center;justify-content:center;min-height:100vh">' +
    '<div style="max-width:420px;width:100%;background:#fff;border-radius:16px;padding:40px 24px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,.08)">' +
    '<div style="font-size:3rem">' + (ok ? '✅' : '❌') + '</div>' +
    '<h2 style="margin:12px 0 6px;color:#1E293B">' + (ok ? 'Email Verified!' : 'Verification Failed') + '</h2>' +
    '<p style="color:#64748B;font-size:.9rem">' + msg + '</p></div></body></html>';

  res.setHeader('Content-Type', 'text/html');
  if (!token) return res.status(400).send(page(false, 'No verification token provided.'));
  if (!U || !S) return res.status(500).send(page(false, 'Server not configured.'));

  try {
    const f = await fetch(U + '/rest/v1/verification_tokens?token=eq.' + encodeURIComponent(token) + '&used=eq.false&select=*', { headers: H });
    const rows = await f.json();
    if (!Array.isArray(rows) || !rows.length) return res.status(400).send(page(false, 'This link is invalid or already used.'));
    const tok = rows[0];
    await fetch(U + '/rest/v1/verification_tokens?id=eq.' + tok.id, { method: 'PATCH', headers: H, body: JSON.stringify({ used: true }) });
    await fetch(U + '/rest/v1/profiles?id=eq.' + tok.user_id, { method: 'PATCH', headers: H, body: JSON.stringify({ verified: true }) });
    return res.status(200).send(page(true, 'Your email is verified. You can now log in and use GraceConnect.'));
  } catch (e) {
    return res.status(500).send(page(false, 'Something went wrong. Try again.'));
  }
}
