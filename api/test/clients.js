const { requireSession } = require('../_lib/requireSession');
const { getTestClients } = require('../_lib/authData');

// Deliberately-exposed simulated attack surface — see api/test/README.md.
// Protected the same way any real protected route would be: requireSession
// runs first and writes its own 401 if the caller has no valid cookie.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!requireSession(req, res)) return;

  try {
    const rows = await getTestClients();
    return res.status(200).json({ clients: rows || [] });
  } catch (err) {
    console.error('test/clients error:', err.message);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
