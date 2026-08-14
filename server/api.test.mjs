/*
 * Endpoint behaviour, with a stand-in for the database so every case can run
 * without credentials or a live Neon connection. The stand-in mimics the one
 * property that matters: an address already present is not inserted twice.
 *
 *   npm run test:waitlist
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp, MAX_BODY_BYTES } from './lib/app.mjs';

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

/* Boot the app on an ephemeral port for the duration of one test. */
async function withServer(deps, run) {
  const server = createApp({ rateLimit: false, ...deps });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const call = (body, init = {}) =>
    fetch(`http://127.0.0.1:${port}${init.path ?? '/api/waitlist'}`, {
      method: init.method ?? 'POST',
      headers: init.headers ?? { 'content-type': 'application/json' },
      body: body === undefined ? undefined : body,
    });
  try {
    await run(call);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const json = (obj) => JSON.stringify(obj);

test('1. a valid new email is stored and reported as created', async () => {
  const db = fakeDb();
  await withServer({ insert: db.insert }, async (call) => {
    const res = await call(json({ email: 'sam@example.com' }));
    assert.equal(res.status, 201);
    assert.deepEqual(await res.json(), { status: 'created' });
    assert.equal(db.rows.length, 1);
    assert.equal(db.rows[0].email, 'sam@example.com');
    /* source is server-controlled, not taken from the request */
    assert.equal(db.rows[0].source, 'bravoapp.ai');
  });
});

test('2. casing and whitespace are normalised before storage', async () => {
  const db = fakeDb();
  await withServer({ insert: db.insert }, async (call) => {
    const res = await call(json({ email: '   Sam@Example.COM  ' }));
    assert.equal(res.status, 201);
    assert.equal(db.rows[0].email, 'sam@example.com');
  });
});

test('3. a duplicate does not add a row and reads as benign', async () => {
  const db = fakeDb();
  await withServer({ insert: db.insert }, async (call) => {
    await call(json({ email: 'sam@example.com' }));
    /* different casing/padding — must collapse onto the same row */
    const res = await call(json({ email: ' SAM@example.com ' }));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'duplicate' });
    assert.equal(db.rows.length, 1, 'no second row');
  });
});

test('4. an invalid email is refused and never reaches the database', async () => {
  const db = fakeDb();
  await withServer({ insert: db.insert }, async (call) => {
    for (const email of ['nope', 'a@b', '@example.com', 'a b@example.com']) {
      const res = await call(json({ email }));
      assert.equal(res.status, 400, email);
      assert.deepEqual(await res.json(), { error: 'invalid_email' });
    }
    assert.equal(db.rows.length, 0);
  });
});

test('5. an empty or missing email is refused', async () => {
  const db = fakeDb();
  await withServer({ insert: db.insert }, async (call) => {
    for (const body of [{ email: '' }, { email: '   ' }, {}, { email: null }]) {
      const res = await call(json(body));
      assert.equal(res.status, 400);
    }
    assert.equal(db.rows.length, 0);
  });
});

test('6. oversized input is rejected — by length, then by body size', async () => {
  const db = fakeDb();
  await withServer({ insert: db.insert }, async (call) => {
    /* long but within the body cap: refused on email length */
    const long = `${'a'.repeat(600)}@example.com`;
    assert.ok(json({ email: long }).length < MAX_BODY_BYTES);
    assert.equal((await call(json({ email: long }))).status, 400);

    /* beyond the body cap: refused before parsing */
    const huge = `${'a'.repeat(MAX_BODY_BYTES * 4)}@example.com`;
    const res = await call(json({ email: huge }));
    assert.equal(res.status, 413);
    assert.deepEqual(await res.json(), { error: 'payload_too_large' });

    assert.equal(db.rows.length, 0);
  });
});

test('7. malformed requests are refused with a generic error', async () => {
  const db = fakeDb();
  await withServer({ insert: db.insert }, async (call) => {
    /* not JSON */
    assert.equal((await call('this is not json')).status, 400);
    /* JSON, but not an object */
    assert.equal((await call(json('sam@example.com'))).status, 400);
    assert.equal((await call(json([1, 2, 3]))).status, 400);
    assert.equal((await call(json(null))).status, 400);
    /* wrong content type */
    const wrongType = await call('email=sam@example.com', {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    assert.equal(wrongType.status, 415);
    /* wrong method */
    const wrongMethod = await call(undefined, { method: 'GET' });
    assert.equal(wrongMethod.status, 405);
    assert.equal(wrongMethod.headers.get('allow'), 'POST');
    /* unknown path */
    assert.equal((await call(json({ email: 'a@b.com' }), { path: '/api/nope' })).status, 404);

    assert.equal(db.rows.length, 0);
  });
});

test('8. repeated identical submissions still yield exactly one row', async () => {
  const db = fakeDb();
  await withServer({ insert: db.insert }, async (call) => {
    /* fired together, as a double-click would */
    const results = await Promise.all(
      Array.from({ length: 5 }, () => call(json({ email: 'sam@example.com' }))),
    );
    const codes = results.map((r) => r.status).sort();
    assert.equal(db.rows.length, 1, 'exactly one row');
    assert.ok(codes.includes(201), 'one create');
    assert.equal(codes.filter((c) => c === 200).length, 4, 'the rest are duplicates');
  });
});

test('9. a database failure returns a generic 500, leaking nothing', async () => {
  const insert = async () => {
    throw new Error('connect ECONNREFUSED 10.0.0.5:5432 — relation "waitlist_signups"');
  };
  await withServer({ insert }, async (call) => {
    const res = await call(json({ email: 'sam@example.com' }));
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.deepEqual(body, { error: 'server_error' });
    /* nothing about the host, port, driver or schema escapes */
    const text = JSON.stringify(body);
    for (const leak of ['ECONNREFUSED', '5432', 'relation', 'waitlist_signups', '10.0.0.5']) {
      assert.ok(!text.includes(leak), `leaked ${leak}`);
    }
  });
});

test('10. rate limiting refuses a flood once enabled', async () => {
  const db = fakeDb();
  /* rateLimit defaults to on; other tests disable it so they don't interfere */
  await withServer({ insert: db.insert, rateLimit: true }, async (call) => {
    const codes = [];
    for (let i = 0; i < 14; i += 1) {
      codes.push((await call(json({ email: `p${i}@example.com` }))).status);
    }
    assert.ok(codes.includes(429), 'the flood is cut off');
    assert.equal(codes.filter((c) => c === 429).length, 4, '10 allowed per window');
  });
});

test('health check responds without touching the database', async () => {
  const insert = async () => { throw new Error('must not be called'); };
  await withServer({ insert }, async (call) => {
    const res = await call(undefined, { method: 'GET', path: '/api/health' });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
  });
});
