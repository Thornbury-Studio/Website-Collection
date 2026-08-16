const { verifyPassword, createSessionToken, hashIp } = require('./_lib/crypto');
const { getPasswordRecord, recordAttempt, countRecentAttempts } = require('./_lib/authData');
const { serializeCookie, isHttps } = require('./_lib/cookies');
const { parseJsonBody } = require('./_lib/requestBody');

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PASSWORD_LEN = 200;

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');
  const SESSION_SECRET = process.env.SESSION_SECRET;
  if (!SESSION_SECRET) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  const parsed = parseJsonBody(req);
  if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });

  try {
    const password = typeof parsed.body.password === 'string' ? parsed.body.password : '';

    // Cheapest possible reject first — no DB call, no scrypt — before any
    // real work happens on a request shaped to waste it.
    if (password.length > MAX_PASSWORD_LEN) {
      return res.status(400).json({ error: 'Incorrect password.' });
    }

    const ipHash = hashIp(clientIp(req), SESSION_SECRET);
    const since = new Date(Date.now() - WINDOW_MS).toISOString();

    // Rate limit BEFORE touching the password check — a blocked caller
    // never even reaches verifyPassword, so throttling can't be timed out.
    const recent = await countRecentAttempts(ipHash, since);
    if (recent >= MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }

    const record = await getPasswordRecord();
    const ok = !!record && !!password && verifyPassword(password, record.salt, record.hash);

    await recordAttempt(ipHash, ok);

    if (!ok) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = createSessionToken(SESSION_SECRET, SESSION_TTL_MS);
    res.setHeader('Set-Cookie', serializeCookie('wc_session', token, {
      httpOnly: true,
      secure: isHttps(req),
      sameSite: 'Strict',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    }));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('unlock error:', err.message);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
