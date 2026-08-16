const MAX_JSON_BODY_BYTES = 4096;

function hasJsonContentType(req) {
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  return !contentType || contentType.includes('application/json');
}

function byteLength(value) {
  return Buffer.byteLength(String(value || ''), 'utf8');
}

function parseJsonBody(req) {
  if (!hasJsonContentType(req)) {
    return { ok: false, status: 415, error: 'Unsupported content type.' };
  }

  const rawBody = req.body;
  if (rawBody == null || rawBody === '') return { ok: true, body: {} };

  if (Buffer.isBuffer(rawBody)) {
    if (rawBody.length > MAX_JSON_BODY_BYTES) {
      return { ok: false, status: 413, error: 'Request body too large.' };
    }
    try {
      const parsed = JSON.parse(rawBody.toString('utf8'));
      return parsed && typeof parsed === 'object'
        ? { ok: true, body: parsed }
        : { ok: false, status: 400, error: 'Invalid request body.' };
    } catch {
      return { ok: false, status: 400, error: 'Invalid request body.' };
    }
  }

  if (typeof rawBody === 'string') {
    if (byteLength(rawBody) > MAX_JSON_BODY_BYTES) {
      return { ok: false, status: 413, error: 'Request body too large.' };
    }
    try {
      const parsed = JSON.parse(rawBody || '{}');
      return parsed && typeof parsed === 'object'
        ? { ok: true, body: parsed }
        : { ok: false, status: 400, error: 'Invalid request body.' };
    } catch {
      return { ok: false, status: 400, error: 'Invalid request body.' };
    }
  }

  if (typeof rawBody === 'object') return { ok: true, body: rawBody };

  return { ok: false, status: 400, error: 'Invalid request body.' };
}

module.exports = { parseJsonBody };
