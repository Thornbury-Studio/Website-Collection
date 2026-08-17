const { verifyLinkToken, createSessionToken } = require('../_lib/crypto');
const { serializeCookie, isHttps } = require('../_lib/cookies');
const { CLIENT_PREVIEW_SLUGS } = require('../_lib/clientPreview');

// Matches the link's own lifetime (see api/client/generate-link.js) — the
// point is "the link keeps working", not "the session outlives the link".
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

// The public half of a per-client signed link: no password, no session
// needed to call this. A GET with a valid token sets a wc_session cookie
// scoped to exactly one Client Preview slug (role:'client-scoped') and sends
// the browser straight to the real page — see middleware.js for how that
// scoping is then enforced on every request to it.
//
// A GET with a side effect (setting a cookie) is unusual, but this is the
// same tradeoff every emailed magic link makes — the alternative is an extra
// click that adds nothing for a link only the intended client has.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');

  const SESSION_SECRET = process.env.SESSION_SECRET;
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  const token = typeof req.query.t === 'string' ? req.query.t : '';
  const dest = CLIENT_PREVIEW_SLUGS[slug];

  const valid = SESSION_SECRET && dest && token && verifyLinkToken(token, SESSION_SECRET, slug);
  if (!valid) {
    res.writeHead(302, { Location: '/?preview=invalid' });
    return res.end();
  }

  const session = createSessionToken(SESSION_SECRET, SESSION_TTL_MS, { role: 'client-scoped', slug });
  res.setHeader('Set-Cookie', serializeCookie('wc_session', session, {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: 'Strict',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  }));
  res.writeHead(302, { Location: dest });
  return res.end();
};
