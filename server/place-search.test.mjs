/*
 * Place ID discovery — the matching rules, with a stand-in for Google so every
 * case runs without a key or a network.
 *
 * The subject is `assess()`: whether a candidate is a strong enough match to be
 * offered to an editor. Getting it wrong in the permissive direction is how a
 * venue silently adopts a sibling branch's reviews, so the shared-brand cases
 * below are the ones that matter.
 *
 *   npm run test:waitlist   (runs every server/*.test.mjs)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { findPlace, assess, SEARCH_FIELD_MASK, SEARCH_ENDPOINT } from './lib/place-search.mjs';

const place = (over = {}) => ({
  id: 'ChIJtest',
  displayName: { text: 'Wren Cafe' },
  formattedAddress: '280 Nelson St, Vancouver, BC V6B 6J8, Canada',
  websiteUri: 'https://wrencafe.ca',
  primaryTypeDisplayName: { text: 'Cafe' },
  businessStatus: 'OPERATIONAL',
  ...over,
});

const want = { name: 'Wren Cafe', address: '280 Nelson St, Vancouver' };

test('name and street number both matching is a strong match', () => {
  assert.equal(assess(place(), want).strong, true);
});

test("Google's longer listing name still matches by containment", () => {
  /* real shape: "Pinche Taco Shop By La Taqueria Pinche Taco Shop" */
  const m = assess(
    place({ displayName: { text: 'Pinche Taco Shop By La Taqueria Pinche Taco Shop' }, formattedAddress: '367 Seymour St, Vancouver, BC' }),
    { name: 'Pinche Taco Shop', address: '367 Seymour St, Vancouver' },
  );
  assert.equal(m.nameMatch, true);
  assert.equal(m.strong, true);
});

test('a sibling branch sharing the brand name is NOT strong', () => {
  /* the failure that matters: same brand, different address */
  const m = assess(
    place({ displayName: { text: 'La Taqueria Brentwood By La Taqueria Pinche Taco Shop' }, formattedAddress: '4580 Brentwood Blvd Unit 1210, Burnaby, BC' }),
    { name: 'Pinche Taco Shop', address: '367 Seymour St, Vancouver' },
  );
  assert.equal(m.streetMatch, false);
  assert.equal(m.strong, false);
});

test('a matching street number at a differently-named place is NOT strong', () => {
  const m = assess(place({ displayName: { text: 'Some Other Bar' } }), want);
  assert.equal(m.nameMatch, false);
  assert.equal(m.strong, false);
});

test('punctuation and case do not defeat the name comparison', () => {
  assert.equal(assess(place({ displayName: { text: 'WREN CAFÉ' } }), want).nameMatch, true);
});

test('a permanently closed listing is flagged', () => {
  assert.equal(assess(place({ businessStatus: 'CLOSED_PERMANENTLY' }), want).open, false);
});

test('sends the key and a minimal, non-wildcard field mask', async () => {
  let seen;
  await findPlace({
    ...want,
    apiKey: 'secret',
    fetchImpl: async (url, init) => { seen = { url, init }; return { ok: true, status: 200, json: async () => ({ places: [] }) }; },
  });
  assert.equal(seen.url, SEARCH_ENDPOINT);
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers['X-Goog-Api-Key'], 'secret');
  assert.equal(seen.init.headers['X-Goog-FieldMask'], SEARCH_FIELD_MASK);
  assert.ok(!SEARCH_FIELD_MASK.includes('*'));
  /* identity fields only — no reviews, no photos, nothing billable beyond it */
  assert.ok(!SEARCH_FIELD_MASK.includes('reviews'));
  assert.deepEqual(JSON.parse(seen.init.body), { textQuery: 'Wren Cafe, 280 Nelson St, Vancouver' });
});

test('missing arguments and a missing key are reported, not guessed around', async () => {
  assert.equal((await findPlace({ name: 'x', apiKey: 'k' })).reason, 'usage');
  assert.equal((await findPlace({ ...want, apiKey: undefined })).reason, 'no_api_key');
});

test('an upstream failure surfaces rather than returning a candidate', async () => {
  const r = await findPlace({
    ...want, apiKey: 'k',
    fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ error: { message: 'denied' } }) }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.status, 403);
  assert.match(r.detail, /denied/);
});

test('every candidate is returned — none is filtered or reordered', async () => {
  const r = await findPlace({
    ...want, apiKey: 'k',
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ places: [
      place({ id: 'a', displayName: { text: 'Elsewhere' }, formattedAddress: '1 Other St' }),
      place({ id: 'b' }),
    ] }) }),
  });
  assert.deepEqual(r.candidates.map((c) => c.id), ['a', 'b']);
  assert.equal(r.candidates.filter((c) => c.match.strong).length, 1);
});
