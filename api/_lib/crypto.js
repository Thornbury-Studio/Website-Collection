// Password hashing (scrypt, Node's built-in KDF — no external dependency)
// and session-token signing (HMAC-SHA256). Nothing here ever leaves the
// server: these functions only run inside /api/* handlers.

const crypto = require('node:crypto');

const SCRYPT_KEYLEN = 64;

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, salt, hash) {
  try {
    const candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    const stored = Buffer.from(hash, 'hex');
    if (candidate.length !== stored.length) return false;
    return crypto.timingSafeEqual(candidate, stored);
  } catch {
    return false;
  }
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function createSessionToken(secret, ttlMs) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + ttlMs })).toString('base64url');
  return payload + '.' + sign(payload, secret);
}

// Rejects anything that isn't exactly "<payload>.<hmac>" with a valid,
// unexpired signature — a tampered or expired cookie fails closed.
function verifySessionToken(token, secret) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

// IPs are hashed (never stored raw) before they touch Supabase — the rate
// limiter only needs to recognise "same caller again", not who they are.
function hashIp(ip, secret) {
  return crypto.createHmac('sha256', secret).update(ip || 'unknown').digest('hex');
}

module.exports = { hashPassword, verifyPassword, createSessionToken, verifySessionToken, hashIp };
