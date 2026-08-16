const { requireSession } = require('../_lib/requireSession');
const { getTestBackendInfo } = require('../_lib/authData');

// Deliberately-exposed simulated attack surface — see api/test/README.md.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!requireSession(req, res)) return;

  try {
    const rows = await getTestBackendInfo();
    return res.status(200).json({ backend: rows || [] });
  } catch (err) {
    console.error('test/backend-info error:', err.message);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
