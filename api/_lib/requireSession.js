const { verifySessionToken } = require('./crypto');
const { parseCookies } = require('./cookies');

// Shared gate for every protected route. Reads the httpOnly session cookie,
// verifies its HMAC signature and expiry, and writes the 401 itself on
// failure so each handler only has to check the boolean it gets back.
//
// Defaults to requiring role:'admin' — every existing protected endpoint
// (admin/password, test/*) is admin-only by design, so a 'client' or
// 'client-scoped' session cookie must NOT satisfy them. Pass an explicit
// `role` (or an array of acceptable roles) for endpoints that should also
// accept a client session.
function requireSession(req, res, role) {
  const allowedRoles = Array.isArray(role) ? role : [role || 'admin'];
  const SESSION_SECRET = process.env.SESSION_SECRET;
  const cookies = parseCookies(req);
  const claims = SESSION_SECRET && verifySessionToken(cookies.wc_session, SESSION_SECRET);
  const ok = !!claims && allowedRoles.includes(claims.role);
  if (!ok) {
    res.status(401).json({ error: 'Not authenticated.' });
    return false;
  }
  return true;
}

module.exports = { requireSession };
