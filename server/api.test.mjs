/*
 * Endpoint behaviour, with a stand-in for the database so every case can run
 * without credentials or a live Neon connection. The stand-in mimics the one
 * property that matters: an address already present is not inserted twice.
 *
 * signup() is called directly rather than over HTTP. The rules are the whole
 * subject here, and the transport around them now belongs to Vercel — testing
 * through a socket would only be testing the platform.
 *
 *   npm run test:waitlist
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { signup } from './lib/signup.mjs';

/* Fake store with the same contract as the real insert: 'created' the first
   time an address is seen, 'duplicate' afterwards. */
function fakeDb() {
  const rows = [];
  return {
    rows,
    insert: async (email, source) => {
      if (rows.some((r) => r.email === email)) return 'duplicate';
      rows.push({ email, source, created_at: new Date() });
      return 'created';
    },
  };
}

/* A well-formed POST, so each test only states the part it is about. */
const post = (body, init = {}) =>
  signup({
    method: 'POST',
    contentType: 'application/json',
    body,
    ...init,
  });

test('1. a valid new email is stored and reported as created', async () => {
  const db = fakeDb();
  const res = await post({ email: 'sam@example.com' }, { insert: db.insert });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { status: 'created' });
  assert.equal(db.rows.length, 1);
  assert.equal(db.rows[0].email, 'sam@example.com');
  /* source is server-controlled, not taken from the request */
  assert.equal(db.rows[0].source, 'bravoapp.ai');
});

test('2. casing and whitespace are normalised before storage', async () => {
  const db = fakeDb();
  const res = await post({ email: '   Sam@Example.COM  ' }, { insert: db.insert });
  assert.equal(res.status, 201);
  assert.equal(db.rows[0].email, 'sam@example.com');
});

test('3. a duplicate does not add a row and reads as benign', async () => {
  const db = fakeDb();
  await post({ email: 'sam@example.com' }, { insert: db.insert });
  /* different casing/padding — must collapse onto the same row */
  const res = await post({ email: ' SAM@example.com ' }, { insert: db.insert });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'duplicate' });
  assert.equal(db.rows.length, 1, 'no second row');
});

test('4. an invalid email is refused and never reaches the database', async () => {
  const db = fakeDb();
  for (const email of ['nope', 'a@b', '@example.com', 'a b@example.com']) {
    const res = await post({ email }, { insert: db.insert });
    assert.equal(res.status, 400, email);
    assert.deepEqual(res.body, { error: 'invalid_email' });
  }
  assert.equal(db.rows.length, 0);
});

test('5. an empty or missing email is refused', async () => {
  const db = fakeDb();
  for (const body of [{ email: '' }, { email: '   ' }, {}, { email: null }]) {
    assert.equal((await post(body, { insert: db.insert })).status, 400);
  }
  assert.equal(db.rows.length, 0);
});

test('6. an over-long address is refused before it reaches the database', async () => {
  const db = fakeDb();
  const long = `${'a'.repeat(600)}@example.com`;
  const res = await post({ email: long }, { insert: db.insert });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: 'invalid_email' });
  assert.equal(db.rows.length, 0);
});

test('7. malformed requests are refused with a generic error', async () => {
  const db = fakeDb();
  const insert = db.insert;

  /* JSON, but not an object — including the string Vercel hands over when the
     body could not be parsed as JSON at all */
  for (const body of ['this is not json', 'sam@example.com', [1, 2, 3], null, undefined]) {
    const res = await post(body, { insert });
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.deepEqual(res.body, { error: 'invalid_body' });
  }

  /* wrong content type */
  const wrongType = await signup({
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    body: { email: 'sam@example.com' },
    insert,
  });
  assert.equal(wrongType.status, 415);

  /* missing content type */
  const noType = await signup({ method: 'POST', body: { email: 'a@b.com' }, insert });
  assert.equal(noType.status, 415);

  /* wrong method — and the browser is told which one is right */
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const res = await signup({ method, contentType: 'application/json', insert });
    assert.equal(res.status, 405, method);
    assert.equal(res.headers.allow, 'POST');
  }

  assert.equal(db.rows.length, 0);
});

test('8. repeated identical submissions still yield exactly one row', async () => {
  const db = fakeDb();
  /* fired together, as a double-click would */
  const results = await Promise.all(
    Array.from({ length: 5 }, () => post({ email: 'sam@example.com' }, { insert: db.insert })),
  );
  const codes = results.map((r) => r.status);
  assert.equal(db.rows.length, 1, 'exactly one row');
  assert.ok(codes.includes(201), 'one create');
  assert.equal(codes.filter((c) => c === 200).length, 4, 'the rest are duplicates');
});

test('9. a database failure returns a generic 500, leaking nothing', async () => {
  const insert = async () => {
    throw new Error('connect ECONNREFUSED 10.0.0.5:5432 — relation "waitlist_signups"');
  };
  const res = await post({ email: 'sam@example.com' }, { insert });
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { error: 'server_error' });
  /* nothing about the host, port, driver or schema escapes */
  const text = JSON.stringify(res.body);
  for (const leak of ['ECONNREFUSED', '5432', 'relation', 'waitlist_signups', '10.0.0.5']) {
    assert.ok(!text.includes(leak), `leaked ${leak}`);
  }
});
