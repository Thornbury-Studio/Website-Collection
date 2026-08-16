const { requireSession } = require('../_lib/requireSession');
const { hashPassword } = require('../_lib/crypto');
const { setPasswordRecord } = require('../_lib/authData');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!requireSession(req, res)) return;

  let body;
  try {
    body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  try {
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Use at least 4 characters.' });
    }
    if (newPassword.length > 200) {
      return res.status(400).json({ error: 'Use fewer than 200 characters.' });
    }
    const { hash, salt } = hashPassword(newPassword);
    await setPasswordRecord(hash, salt);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('admin/password error:', err.message);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
