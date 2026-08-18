/* =============================================================================
   Edge Middleware — the actual boundary between the public gallery and the
   private side.

   Why this file exists: everything in this repo deploys as static files, so a
   request for /portfolio/index.html is answered straight from Vercel's CDN and
   never reaches an /api/* handler. requireSession() therefore never ran for
   them, and the "lock" was only a CSS class hiding a card in the hub — the
   pages themselves returned 200 to anyone who typed the URL. Middleware runs
   before static assets are served, which is the one place a static deployment
   can be gated.

   It reuses the session the unlock flow already issues: the httpOnly wc_session
   cookie, "<base64url payload>.<base64url HMAC-SHA256>", signed with
   SESSION_SECRET. Nothing about logging in changes.

   Three session roles now exist (see api/_lib/crypto.js's createSessionToken):
     - 'admin'         — /api/unlock. Opens /portfolio and every client-preview
                          slug below.
     - 'client'        — /api/unlock-client. Opens every client-preview slug,
                          never /portfolio. This is the shared password an
                          agent types in while physically walking a client
                          through Client Preview — not something handed to a
                          client to use unsupervised.
     - 'client-scoped'  — /api/preview/redeem, from a per-client signed link.
                          Opens exactly the one slug the link was minted for,
                          nothing else — a client with their own link can't
                          browse to another client's staged build.

   The one constraint: middleware runs on the Edge Runtime, which has no
   node:crypto — so api/_lib/crypto.js cannot be imported here. The verify
   below is a deliberate line-for-line reimplementation of verifySessionToken()
   on Web Crypto. If the token format there ever changes, this must change with
   it, or the two will silently disagree and lock everyone out.
   ============================================================================= */

// Every template folder currently staged for client review. Adding one here
// requires also adding it to `matcher` below — the matcher decides which
// requests reach this file at all; this list decides who's let through once
// they do.
const CLIENT_PREVIEW_SLUGS = ['professor-brawn', 'timestealer-cafe', 'zz-pipeline-test'];

export const config = {
  // Both the bare path and everything beneath it — the bare form does not match
  // the :path* pattern on its own, and missing it would leave the index page of
  // each protected area open while its assets were gated.
  matcher: [
    '/portfolio',
    '/portfolio/:path*',
    '/templates/professor-brawn',
    '/templates/professor-brawn/:path*',
    '/templates/timestealer-cafe',
    '/templates/timestealer-cafe/:path*',
    '/templates/zz-pipeline-test',
    '/templates/zz-pipeline-test/:path*',
  ],
};

const encoder = new TextEncoder();

function base64UrlToBinary(value) {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  return atob(b64 + padding);
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* Node signs with .digest('base64url'), so compare in that same encoding
   rather than against raw bytes. */
async function signBase64Url(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

/* Stands in for timingSafeEqual, which the Edge Runtime does not provide.
   Compares every character even after a mismatch so the loop's duration does
   not leak how much of the signature was correct. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Returns the verified claims object (role, slug, exp) on success, or null
// on any failure — tampered signature, expired token, malformed payload.
// Mirrors verifySessionToken() in api/_lib/crypto.js exactly.
async function readSession(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expected = await signBase64Url(payload, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const data = JSON.parse(base64UrlToBinary(payload));
    if (typeof data.exp !== 'number' || data.exp <= Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function isPortfolioPath(pathname) {
  return pathname === '/portfolio' || pathname.startsWith('/portfolio/');
}

// Returns the matching slug ('professor-brawn', etc.) if pathname falls
// under a gated client-preview folder, else null.
function clientSlugFor(pathname) {
  for (const slug of CLIENT_PREVIEW_SLUGS) {
    if (pathname === '/templates/' + slug || pathname.startsWith('/templates/' + slug + '/')) {
      return slug;
    }
  }
  return null;
}

// A session may pass a given request for more than one reason (an admin can
// open anything gated below; a client-scoped link only opens its own slug) —
// this is the single place that decision is made, so middleware() itself
// stays a plain "allowed? return : redirect".
function sessionAllows(session, pathname) {
  if (!session) return false;
  if (isPortfolioPath(pathname)) return session.role === 'admin';
  const slug = clientSlugFor(pathname);
  if (!slug) return false;
  if (session.role === 'admin' || session.role === 'client') return true;
  return session.role === 'client-scoped' && session.slug === slug;
}

/* Read the cookie off the raw header rather than a framework helper, so this
   behaves the same whatever runtime shim is in front of it. */
function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    if (pair.slice(0, idx).trim() === name) {
      return decodeURIComponent(pair.slice(idx + 1).trim());
    }
  }
  return null;
}

export default async function middleware(request) {
  const secret = process.env.SESSION_SECRET;
  const token = readCookie(request, 'wc_session');
  const url = new URL(request.url);

  // Fails closed on purpose: a missing SESSION_SECRET is a misconfigured
  // deployment, and the safe reading of that is "nobody gets in", not
  // "everybody does".
  const session = secret ? await readSession(token, secret) : null;
  if (sessionAllows(session, url.pathname)) return;

  const home = new URL('/', url);
  home.searchParams.set('locked', url.pathname);

  // 302, not 301: a browser that cached a permanent redirect would keep
  // bouncing the owner away even after they unlocked.
  return Response.redirect(home, 302);
}
