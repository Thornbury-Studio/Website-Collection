// Talks to Supabase's auto-generated REST API (PostgREST) directly over
// fetch, using the service_role key. Deliberately no @supabase/supabase-js
// dependency — this project has no build step, and the REST surface is
// small enough that plain fetch keeps it that way. This file is never
// imported by anything the browser loads; it only runs inside /api/*.

const TIMEOUT_MS = 8000;

async function sbFetch(path, options) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
  }

  // A hung upstream shouldn't be able to hold a Vercel function open for its
  // full execution budget — cap every Supabase call explicitly rather than
  // relying on the platform timeout as the only bound.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(SUPABASE_URL + '/rest/v1' + path, {
      ...options,
      signal: controller.signal,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        ...(options && options.headers),
      },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Supabase request failed (' + res.status + '): ' + text);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

module.exports = { sbFetch };
