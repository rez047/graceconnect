const SUPA = process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_KEY;
const DOMAIN = process.env.SMS_DOMAIN || 'sms.elduconnect.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!SUPA || !SKEY) return res.status(500).json({ error: 'Server config missing' });

  const { phone, name, password } = req.body || {};
  if (!phone || !password || String(password).length < 6) {
    return res.status(400).json({ error: 'Valid phone and password (6+ chars) required' });
  }

  const email = phone + '@' + DOMAIN;

  // Create user via Supabase Admin API (securely on the server)
  const cr = await fetch(SUPA + '/auth/v1/admin/users', {
    method: 'POST',
    headers: { 
      apikey: SKEY, 
      Authorization: 'Bearer ' + SKEY, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ 
      email, 
      password, 
      email_confirm: true, 
      phone: phone, 
      user_metadata: { name: name || 'Member', phone: phone, auth_method: 'firebase_phone' } 
    })
  });
  
  const cu = await cr.json().catch(() => null);
  if (!cr.ok || !cu || !cu.id) {
    return res.status(500).json({ error: 'Could not create account: ' + ((cu && cu.message) || 'unknown') });
  }

  // Update profile table
  await fetch(SUPA + '/rest/v1/profiles?id=eq.' + cu.id, {
    method: 'PATCH',
    headers: { 
      apikey: SKEY, 
      Authorization: 'Bearer ' + SKEY, 
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ phone: phone, name: name || 'Member' })
  });

  return res.json({ ok: true, email });
}
