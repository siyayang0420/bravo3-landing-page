/*
 * The waitlist signup rules, with no runtime attached.
 *
 * Everything here is a decision about the request — method, content type, body
 * shape, email validity, which status code and which JSON body to answer with.
 * Nothing here knows about node:http, Vercel, sockets or Postgres: the caller
 * supplies the already-parsed request and an `insert` function, and gets back a
 * status and a body to send.
 *
 * That split is what lets the whole endpoint be tested with no credentials, no
 * live Neon connection and no server — see api.test.mjs.
 */
import { normalizeEmail } from './email.mjs';

/* Written into every row. Server-controlled on purpose: accepting it from the
   request body would let anyone write arbitrary text into the column. */
export const SOURCE = 'bravoapp.ai';

/**
 * @param {object} req
 * @param {string} [req.method]
 * @param {string} [req.contentType]
 * @param {unknown} [req.body] already parsed — the platform does that for us
 * @param {(email: string, source: string) => Promise<'created'|'duplicate'>} req.insert
 * @returns {Promise<{ status: number, body: object, headers?: Record<string,string> }>}
 */
export async function signup({ method, contentType, body, insert }) {
  /* Strict method: this endpoint only ever creates. */
  if (method !== 'POST') {
    return { status: 405, body: { error: 'method_not_allowed' }, headers: { allow: 'POST' } };
  }

  if (!String(contentType ?? '').toLowerCase().startsWith('application/json')) {
    return { status: 415, body: { error: 'unsupported_media_type' } };
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { status: 400, body: { error: 'invalid_body' } };
  }

  const result = normalizeEmail(body.email);
  if (!result.ok) {
    /* One shape of reply for every rejection: the client shows one message, and
       nothing here hints at which addresses already exist. */
    return { status: 400, body: { error: 'invalid_email' } };
  }

  try {
    const status = await insert(result.email, SOURCE);
    return { status: status === 'created' ? 201 : 200, body: { status } };
  } catch (err) {
    /* Full detail to the function log, nothing but a generic code to the
       browser: Postgres messages carry schema and constraint names. */
    console.error('[waitlist] insert failed:', err.message);
    return { status: 500, body: { error: 'server_error' } };
  }
}
