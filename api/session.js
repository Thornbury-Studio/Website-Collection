const { verifySessionToken } = require('./_lib/crypto');
const { parseCookies } = require('./_lib/cookies');

// Read-only status check the client polls on load to paint Locked/Unlocked
// state. Returning the role here (or null) decides nothing on its own —
// every protected route re-verifies the cookie itself.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  const SESSION_SECRET = process.env.SESSION_SECRET;
  const cookies = parseCookies(req);
  const claims = SESSION_SECRET && verifySessionToken(cookies.wc_session, SESSION_SECRET);
  return res.status(200).json({ role: claims ? claims.role : null });
};
