const { serializeCookie, isHttps } = require('./_lib/cookies');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', serializeCookie('wc_session', '', {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: 'Strict',
    maxAge: 0,
  }));
  return res.status(200).json({ ok: true });
};
