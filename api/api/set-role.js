export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { userId, ushirikaId, role } = req.body || {};
  if (!userId || !ushirikaId || !role) return res.status(400).json({ error: 'Missing fields' });
  const U = process.env.SUPABASE_URL || '', S = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!U || !S) return res.status(500).json({ error: 'Server not configured' });
  const H = { apikey: S, Authorization: 'Bearer ' + S, 'Content-Type': 'application/json' };

  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
  const me = await fetch(U + '/auth/v1/user', { headers: { apikey: S, Authorization: auth } }).then(r => r.json()).catch(() => null);
  if (!me || !me.id) return res.status(401).json({ error: 'Login required' });

  const prof = await fetch(U + '/rest/v1/profiles?id=eq.' + me.id + '&select=role', { headers: H }).then(r => r.json());
  let allowed = !!(prof && prof[0] && ['admin', 'superadmin'].includes(prof[0].role));
  if (!allowed) {
    const off = await fetch(U + '/rest/v1/ushirika_officials?user_id=eq.' + me.id + '&ushirika_id=eq.' + ushirikaId + '&select=id', { headers: H }).then(r => r.json());
    if (off && off.length) allowed = true;
  }
  if (!allowed) {
    const mem = await fetch(U + '/rest/v1/ushirika_members?user_id=eq.' + me.id + '&ushirika_id=eq.' + ushirikaId + '&select=role', { headers: H }).then(r => r.json());
    if (mem && mem.some(m => String(m.role || '').toLowerCase().includes('leader'))) allowed = true;
  }
  if (!allowed) return res.status(403).json({ error: 'Not permitted' });

  await fetch(U + '/rest/v1/ushirika_members?user_id=eq.' + encodeURIComponent(userId) + '&ushirika_id=eq.' + encodeURIComponent(ushirikaId), { method: 'DELETE', headers: H });
  const ins = await fetch(U + '/rest/v1/ushirika_members', { method: 'POST', headers: Object.assign({}, H, { Prefer: 'return=representation' }), body: JSON.stringify([{ user_id: userId, ushirika_id: ushirikaId, role: role }]) }).then(r => r.json());
  if (!Array.isArray(ins) || !ins.length) return res.status(500).json({ error: 'Insert failed' });
  return res.status(200).json({ ok: true, row: ins[0] });
}
