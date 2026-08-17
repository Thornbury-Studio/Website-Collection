const { requireSession } = require('../_lib/requireSession');
const { createLinkToken } = require('../_lib/crypto');
const { parseJsonBody } = require('../_lib/requestBody');
const { CLIENT_PREVIEW_SLUGS } = require('../_lib/clientPreview');

// How long a client's own link keeps working without them needing a new
// one. Generous on purpose — this is a review link sent once, not a
// short-lived auth flow, and Client Access > Change Password (or rotating
// SESSION_SECRET) is the way to invalidate every outstanding link at once.
const LINK_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

// Admin-only: mints a signed, per-project link that opens exactly one
// Client Preview slug and nothing else — see api/preview/redeem.js for the
// other half, and middleware.js for how the resulting session is scoped.
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
    const slug = typeof parsed.body.slug === 'string' ? parsed.body.slug : '';
    if (!Object.prototype.hasOwnProperty.call(CLIENT_PREVIEW_SLUGS, slug)) {
      return res.status(400).json({ error: 'Unknown project.' });
    }

    const SESSION_SECRET = process.env.SESSION_SECRET;
    if (!SESSION_SECRET) {
      return res.status(500).json({ error: 'Server not configured.' });
    }

    const token = createLinkToken(SESSION_SECRET, LINK_TTL_MS, slug);
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const origin = proto + '://' + req.headers.host;
    const url = origin + '/api/preview/redeem?slug=' + encodeURIComponent(slug) + '&t=' + encodeURIComponent(token);
    return res.status(200).json({ ok: true, url });
  } catch (err) {
    console.error('client/generate-link error:', err.message);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
