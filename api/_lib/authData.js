const { sbFetch } = require('./supabaseRest');

async function getPasswordRecord() {
  const rows = await sbFetch('/site_auth?id=eq.1&select=hash,salt');
  return rows && rows[0] ? rows[0] : null;
}

async function setPasswordRecord(hash, salt) {
  await sbFetch('/site_auth?id=eq.1', {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ hash, salt, updated_at: new Date().toISOString() }),
  });
}

async function recordAttempt(ipHash, success) {
  await sbFetch('/login_attempts', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ ip_hash: ipHash, success }),
  });
}

async function countRecentAttempts(ipHash, sinceIso) {
  const rows = await sbFetch(
    '/login_attempts?ip_hash=eq.' + encodeURIComponent(ipHash) +
    '&attempted_at=gte.' + encodeURIComponent(sinceIso) +
    '&select=id'
  );
  return rows ? rows.length : 0;
}

async function getTestClients() {
  return sbFetch('/test_clients?select=name,email,phone,notes&order=id.asc');
}

async function getTestBackendInfo() {
  return sbFetch('/test_backend_info?select=service_name,internal_note&order=id.asc');
}

module.exports = {
  getPasswordRecord,
  setPasswordRecord,
  recordAttempt,
  countRecentAttempts,
  getTestClients,
  getTestBackendInfo,
};
