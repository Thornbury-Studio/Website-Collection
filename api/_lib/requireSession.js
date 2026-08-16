const { verifySessionToken } = require('./crypto');
const { parseCookies } = require('./cookies');

// Shared gate for every protected route. Reads the httpOnly session cookie,
// verifies its HMAC signature and expiry, and writes the 401 itself on
// failure so each handler only has to check the boolean it gets back.
function requireSession(req, res) {
  const SESSION_SECRET = process.env.SESSION_SECRET;
  const cookies = parseCookies(req);
  const ok = !!SESSION_SECRET && verifySessionToken(cookies.wc_session, SESSION_SECRET);
  if (!ok) {
    res.status(401).json({ error: 'Not authenticated.' });
    return false;
  }
  return true;
}

module.exports = { requireSession };
