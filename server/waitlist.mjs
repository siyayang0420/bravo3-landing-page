/*
 * Waitlist API — the only thing that ever holds the Neon credentials.
 *
 * Why a small long-lived Node process rather than a serverless function: this
 * site is a static Vite build served by nginx on a single Ubuntu box (see
 * README "Deployment" and deploy/nginx-redirects.conf). There is no serverless
 * platform to deploy a function to, so the smallest thing that gives the browser
 * a same-origin POST /api/waitlist is a service on that same box, with nginx
 * reverse-proxying to it — see deploy/waitlist.service and
 * deploy/nginx-waitlist.conf.
 *
 * Because it is one long-lived process rather than N cold instances, two things
 * that are unreliable in serverless are correct here: a real connection pool,
 * and the in-memory rate limiter in lib/app.mjs.
 *
 * This file is only the wiring; the request handling lives in lib/app.mjs so it
 * can be tested without credentials.
 */
import pg from 'pg';
import { createApp } from './lib/app.mjs';

const PORT = Number(process.env.WAITLIST_PORT ?? 8787);
/* Loopback only: nginx is the sole way in from the internet. */
const HOST = process.env.WAITLIST_HOST ?? '127.0.0.1';
const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error(
    '[waitlist] DATABASE_URL is not set. Refusing to start.\n' +
    '           Copy .env.example to .env and paste the Neon pooled connection string.',
  );
  process.exit(1);
}

/*
 * Neon terminates TLS, and a plain TCP pool is the right client for a
 * persistent process — @neondatabase/serverless exists to work around
 * environments that cannot hold a socket open or reuse a connection, neither of
 * which applies here.
 */
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 4,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

/* A pool error must not take the process down (Neon idles connections out). */
pool.on('error', (err) => console.error('[waitlist] idle client error:', err.message));

/**
 * Insert, or do nothing if the address is already present.
 *
 * ON CONFLICT DO NOTHING makes a duplicate a non-event: no exception to catch,
 * one round trip, and no way for a Postgres constraint message to travel toward
 * the browser. An empty rowCount is how a repeat is recognised. The value is
 * bound as a parameter — never interpolated into SQL.
 *
 * @returns {Promise<'created' | 'duplicate'>}
 */
async function insertSignup(email, source) {
  const { rowCount } = await pool.query(
    `insert into waitlist_signups (email, source)
     values ($1, $2)
     on conflict (email) do nothing`,
    [email, source],
  );
  return rowCount === 1 ? 'created' : 'duplicate';
}

const server = createApp({ insert: insertSignup });

server.listen(PORT, HOST, () => {
  console.log(`[waitlist] listening on http://${HOST}:${PORT}`);
});

/* systemd sends SIGTERM on restart/stop; finish in-flight work, then release. */
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[waitlist] ${signal} — shutting down`);
    server.close(() => pool.end().then(() => process.exit(0)));
    /* Don't hang forever if a connection refuses to drain. */
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
