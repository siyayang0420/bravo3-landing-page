/*
 * POST /api/waitlist — a Vercel Function.
 *
 * Vercel routes every file under api/ at the project root, so this file IS the
 * URL. The page posts to the same origin it was served from; the connection
 * string lives only in the function's environment, and the browser never learns
 * that a database exists.
 *
 * Deliberately thin: the rules live in server/lib/signup.mjs so they can be
 * tested without a request, and this file is only the adapter between Vercel's
 * req/res and that function.
 */
import { neon } from '@neondatabase/serverless';
import { signup } from '../server/lib/signup.mjs';

/*
 * The HTTP driver, not pg.Pool. A function instance handles one request and may
 * be frozen or discarded immediately afterwards, so a connection pool has no
 * lifetime to amortise — it would open sockets that nothing closes. neon() is a
 * single round trip over HTTPS, which is exactly the shape of one insert.
 *
 * Built on first use and kept for the life of a warm instance. Deferred rather
 * than created at import time so a missing DATABASE_URL surfaces as a logged
 * 500 from inside the handler, where signup()'s error path names it, instead of
 * as a module-load crash with no context.
 */
let sql;
function db() {
  if (!sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set on this deployment');
    /* It holds no socket, so caching it costs nothing. */
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

/* Tagged-template values are bind parameters, not string interpolation — the
   address is never concatenated into SQL.

   `on conflict do nothing` returns no row for an address already present, which
   is how a duplicate is told apart from a create without a second query and
   without ever revealing to the caller which one it was. */
async function insertSignup(email, source) {
  const rows = await db()`
    insert into waitlist_signups (email, source)
    values (${email}, ${source})
    on conflict (email) do nothing
    returning id`;
  return rows.length === 1 ? 'created' : 'duplicate';
}

export default async function handler(req, res) {
  const { status, body, headers } = await signup({
    method: req.method,
    contentType: req.headers['content-type'],
    /* Vercel parses application/json for us. A malformed body arrives as a
       string, which signup() rejects as invalid_body. */
    body: req.body,
    insert: insertSignup,
  });

  for (const [key, value] of Object.entries(headers ?? {})) res.setHeader(key, value);
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  res.status(status).json(body);
}
