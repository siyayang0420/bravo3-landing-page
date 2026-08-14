/*
 * The HTTP layer of the waitlist API, with the database passed in.
 *
 * Split from waitlist.mjs so the request handling — methods, content types,
 * body limits, validation, status codes — can be tested without credentials or
 * a live Neon connection. waitlist.mjs supplies the real implementation.
 */
import http from 'node:http';
import { normalizeEmail } from './email.mjs';

/* A signup body is one short field. 1 KB is far more than any real request and
   small enough that a flood of oversized posts is cheap to reject. */
export const MAX_BODY_BYTES = 1024;

/* Fixed window per client IP. Trustworthy because this runs as ONE long-lived
   process — in a serverless deployment each instance would keep its own counter
   and the effective limit would be limit x instances. */
export const RATE_LIMIT = { windowMs: 60_000, max: 10 };

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(payload);
}

/*
 * Read the body with a hard ceiling, giving up as soon as it is exceeded rather
 * than buffering the whole thing to find out how big it was.
 *
 * Note it stops *collecting* but does not destroy the socket: tearing the
 * connection down here means the 413 is never written and the caller sees a
 * transport error instead of a status it can act on. The handler drains the
 * remainder and closes the connection after replying.
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let over = false;
    const chunks = [];
    req.on('data', (chunk) => {
      if (over) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        over = true;
        chunks.length = 0;
        reject(Object.assign(new Error('payload too large'), { code: 'TOO_LARGE' }));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => { if (!over) resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}

/* nginx sets X-Forwarded-For; the first entry is the original client. Trusted
   only because nothing but nginx can reach this port (it binds to loopback). */
function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

/**
 * @param {object} deps
 * @param {(email: string, source: string) => Promise<'created'|'duplicate'>} deps.insert
 * @param {boolean} [deps.rateLimit] disabled in tests so cases don't interfere
 */
export function createApp({ insert, rateLimit = true }) {
  /*
   * The IP is held in memory only for the length of a window, never written to
   * the database and never logged. It is the only signal that distinguishes one
   * submitter from another, so rate limiting is impossible without it.
   */
  const hits = new Map();

  const limited = (ip) => {
    if (!rateLimit) return false;
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || now >= entry.reset) {
      hits.set(ip, { count: 1, reset: now + RATE_LIMIT.windowMs });
      return false;
    }
    entry.count += 1;
    return entry.count > RATE_LIMIT.max;
  };

  /* Drop expired windows so the map cannot grow without bound. */
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) if (now >= entry.reset) hits.delete(ip);
  }, RATE_LIMIT.windowMs);
  sweeper.unref();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    /* Liveness for systemd/nginx. Deliberately says nothing about the database. */
    if (url.pathname === '/api/health') {
      if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
      return send(res, 200, { ok: true });
    }

    if (url.pathname !== '/api/waitlist') return send(res, 404, { error: 'not_found' });

    /* Strict method: this endpoint only ever creates. */
    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST');
      return send(res, 405, { error: 'method_not_allowed' });
    }

    const type = String(req.headers['content-type'] ?? '');
    if (!type.toLowerCase().startsWith('application/json')) {
      return send(res, 415, { error: 'unsupported_media_type' });
    }

    if (limited(clientIp(req))) {
      res.setHeader('retry-after', String(RATE_LIMIT.windowMs / 1000));
      return send(res, 429, { error: 'rate_limited' });
    }

    let raw;
    try {
      raw = await readBody(req);
    } catch (err) {
      if (err.code === 'TOO_LARGE') {
        /* Discard whatever is still arriving so the reply can flush, and close
           the connection rather than leaving a half-read request on it. */
        req.resume();
        res.setHeader('connection', 'close');
        return send(res, 413, { error: 'payload_too_large' });
      }
      return send(res, 400, { error: 'bad_request' });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return send(res, 400, { error: 'invalid_json' });
    }

    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return send(res, 400, { error: 'invalid_body' });
    }

    const result = normalizeEmail(body.email);
    if (!result.ok) {
      /* One shape of reply for every rejection: the client shows one message,
         and nothing here hints at which addresses already exist. */
      return send(res, 400, { error: 'invalid_email' });
    }

    /* `source` is server-controlled. Accepting it from the body would let
       anyone write arbitrary text into the column. */
    try {
      const status = await insert(result.email, 'bravoapp.ai');
      return send(res, status === 'created' ? 201 : 200, { status });
    } catch (err) {
      /* Full detail to the server log, nothing but a generic code to the
         browser: Postgres messages carry schema and constraint names. */
      console.error('[waitlist] insert failed:', err.message);
      return send(res, 500, { error: 'server_error' });
    }
  });

  /* Slow-loris protection: cap how long a client may take to send its headers. */
  server.headersTimeout = 10_000;
  server.requestTimeout = 15_000;
  server.on('close', () => clearInterval(sweeper));

  return server;
}
