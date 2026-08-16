function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

// Vercel terminates TLS at the edge and forwards plain HTTP internally, so
// req itself is never "https" — the only signal is this forwarded header.
function isHttps(req) {
  return req.headers['x-forwarded-proto'] === 'https';
}

function serializeCookie(name, value, opts) {
  opts = opts || {};
  let str = name + '=' + encodeURIComponent(value);
  if (opts.maxAge != null) str += '; Max-Age=' + opts.maxAge;
  str += '; Path=' + (opts.path || '/');
  if (opts.httpOnly) str += '; HttpOnly';
  if (opts.secure) str += '; Secure';
  str += '; SameSite=' + (opts.sameSite || 'Strict');
  return str;
}

module.exports = { parseCookies, isHttps, serializeCookie };
