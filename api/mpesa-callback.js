const SUPA = process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_KEY;
async function supa(path, opts) {
  opts = opts || {};
  opts.headers = Object.assign({ apikey: SKEY, Authorization: 'Bearer ' + SKEY, 'Content-Type': 'application/json', Prefer: 'return=representation' }, opts.headers);
  const r = await fetch(SUPA + '/rest/v1/' + path, opts);
  return r.json();
}
export default async function handler(req, res) {
  try {
    const body = (req.body && req.body.Body) ? req.body.Body : req.body;
    const cb = body && body.stkCallback ? body.stkCallback : null;
    if (cb) {
      const cr = cb.CheckoutRequestID, code = cb.ResultCode, desc = cb.ResultDesc || '';
      let receipt = null;
      if (code === 0 && cb.CallbackMetadata && cb.CallbackMetadata.Item) {
        const it = cb.CallbackMetadata.Item.find(x => x.Name === 'MpesaReceiptNumber');
        if (it) receipt = it.Value;
      }
      const rows = await supa('mpesa_transactions?checkout_request_id=eq.' + encodeURIComponent(cr));
      const tx = Array.isArray(rows) ? rows[0] : null;
      if (tx) {
        await supa('mpesa_transactions?id=eq.' + tx.id, { method: 'PATCH', body: JSON.stringify({ status: code === 0 ? 'completed' : 'failed', result_code: code, result_desc: desc, mpesa_receipt: receipt, updated_at: new Date().toISOString() }) });
        if (code === 0 && tx.cause_id) {
          await supa('contributions', { method: 'POST', body: JSON.stringify([{ cause_id: tx.cause_id, user_id: tx.user_id, amount: Number(tx.amount), recorded_by: tx.user_id }]) });
          const c = await supa('giving_causes?id=eq.' + tx.cause_id);
          const cause = Array.isArray(c) ? c[0] : null;
          if (cause) await supa('giving_causes?id=eq.' + cause.id, { method: 'PATCH', body: JSON.stringify({ raised_amount: Number(cause.raised_amount || 0) + Number(tx.amount) }) });
        }
      }
    }
  } catch (e) { /* always accept callback */ }
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
