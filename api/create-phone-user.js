const SUPA = process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_KEY;
const DOMAIN = process.env.SMS_DOMAIN || 'sms.elduconnect.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!SUPA || !SKEY) return res.status(500).json({ error: 'Server config missing' });

  const { phone, name, password } = req.body || {};
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password required' });
  }

  // Password strength validation
  const hasMinLength = String(password).length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasMinLength || !hasNumber || !hasSpecial) {
    return res.status(400).json({ 
      error: 'Password must be 8+ characters with a number and special character' 
    });
  }

  // Check if phone already exists
  const existing = await fetch(SUPA + '/rest/v1/profiles?phone=eq.' + encodeURIComponent(phone) + '&select=id', {
    headers: { apikey: SKEY, Authorization: 'Bearer ' + SKEY }
  });
  const existingData = await existing.json().catch(() => []);
  if (Array.isArray(existingData) && existingData.length > 0) {
    return res.status(400).json({ error: 'This phone number is already registered' });
  }

  const email = phone + '@' + DOMAIN;

  // Create user via Supabase Admin API
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
      user_metadata: { name: name || 'Member', phone: phone, auth_method: 'phone' } 
    })
  });
  
  const cu = await cr.json().catch(() => null);
  if (!cr.ok || !cu || !cu.id) {
    const errMsg = (cu && cu.message) || 'unknown';
    if (errMsg.includes('already registered')) {
      return res.status(400).json({ error: 'This phone number is already registered' });
    }
    return res.status(500).json({ error: 'Could not create account: ' + errMsg });
  }

  // Update profile table
  const profileUpdate = await fetch(SUPA + '/rest/v1/profiles?id=eq.' + cu.id, {
    method: 'PATCH',
    headers: { 
      apikey: SKEY, 
      Authorization: 'Bearer ' + SKEY, 
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ phone: phone, name: name || 'Member' })
  });

  if (!profileUpdate.ok) {
    // If phone uniqueness fails at profile level
    if (profileUpdate.status === 409) {
      await fetch(SUPA + '/auth/v1/admin/users/' + cu.id, {
        method: 'DELETE',
        headers: { apikey: SKEY, Authorization: 'Bearer ' + SKEY }
      });
      return res.status(400).json({ error: 'This phone number is already registered' });
    }
  }

  return res.json({ ok: true, email });
}
