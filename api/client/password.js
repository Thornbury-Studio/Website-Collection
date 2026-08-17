const { requireSession } = require('../_lib/requireSession');
const { hashPassword } = require('../_lib/crypto');
const { setClientPasswordRecord } = require('../_lib/authData');
const { parseJsonBody } = require('../_lib/requestBody');

// Admin-only, same as admin/password.js — a client session must never be
// able to change the password that gates Client Preview, or every other
// client's link stops working the moment one client's session does this.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!requireSession(req, res)) return;

  const parsed = parseJsonBody(req);
  if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });

  try {
    const newPassword = typeof parsed.body.newPassword === 'string' ? parsed.body.newPassword : '';
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Use at least 4 characters.' });
    }
    if (newPassword.length > 200) {
      return res.status(400).json({ error: 'Use fewer than 200 characters.' });
    }
    const { hash, salt } = hashPassword(newPassword);
    await setClientPasswordRecord(hash, salt);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('client/password error:', err.message);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
