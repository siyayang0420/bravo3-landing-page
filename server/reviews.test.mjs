/*
 * Review retrieval behaviour, with a stand-in for Google so every case runs
 * without an API key, a Place ID or a network. reviewsForVenue() is called
 * directly — the rules are the subject, and the transport belongs to Vercel.
 *
 *   npm run test:reviews
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewsForVenue, normalizePlace, FIELD_MASK } from './lib/reviews.mjs';

const PLACE_ID = 'ChIJg4UbagBzhlQR1tHd7tI6fdk';
/* Two venues with Place IDs and one without — the real shape of the venue set,
   so cross-venue isolation and the no-integration case are both exercisable. */
const PLACES = { ellipsis: PLACE_ID, 'wren-cafe': 'ChIJPVtgMgBzhlQRMJ3LT4cv2gs' };
const lookup = (key) => PLACES[key];

/* One review in the exact shape Place Details (New) returns, taken from the
   response structure — not its content. */
const googleReview = (over = {}) => ({
  text: { text: 'Lovely room, slow service.', languageCode: 'en' },
  rating: 4,
  relativePublishTimeDescription: 'a month ago',
  googleMapsUri: 'https://www.google.com/maps/reviews/data=!x',
  authorAttribution: {
    displayName: 'A Reviewer',
    uri: 'https://www.google.com/maps/contrib/1/reviews',
    photoUri: 'https://lh3.googleusercontent.com/a/x',
  },
  ...over,
});

const okFetch = (place) => async () => ({ ok: true, status: 200, json: async () => place });

test('maps every field the component and Google require', async () => {
  const { status, body } = await reviewsForVenue({
    venueKey: 'ellipsis',
    lookupPlaceId: lookup,
    apiKey: 'k',
    fetchImpl: okFetch({ id: PLACE_ID, displayName: { text: 'ELLIPSIS' }, reviews: [googleReview()] }),
  });
  assert.equal(status, 200);
  const [r] = body.reviews;
  assert.equal(r.authorName, 'A Reviewer');
  assert.equal(r.authorUrl, 'https://www.google.com/maps/contrib/1/reviews');
  assert.equal(r.authorPhoto, 'https://lh3.googleusercontent.com/a/x');
  assert.equal(r.rating, 4);
  assert.equal(r.text, 'Lovely room, slow service.');
  assert.equal(r.relativeTime, 'a month ago');
  assert.equal(r.sourceUrl, 'https://www.google.com/maps/reviews/data=!x');
});

test('sends the key and the minimum field mask as headers, and uses GET', async () => {
  let seen;
  await reviewsForVenue({
    venueKey: 'ellipsis',
    lookupPlaceId: lookup,
    apiKey: 'secret-key',
    fetchImpl: async (url, init) => {
      seen = { url, init };
      return { ok: true, status: 200, json: async () => ({ reviews: [] }) };
    },
  });
  assert.match(seen.url, new RegExp(`/v1/places/${PLACE_ID}$`));
  assert.equal(seen.init.headers['X-Goog-Api-Key'], 'secret-key');
  assert.equal(seen.init.headers['X-Goog-FieldMask'], FIELD_MASK);
  /* no method given means GET, which is what Place Details (New) expects */
  assert.equal(seen.init.method, undefined);
  /* the mask must not be a wildcard — `reviews` bills at the dearest SKU */
  assert.ok(!FIELD_MASK.includes('*'));
});

test("preserves Google's order — no re-sorting and no cherry-picking", async () => {
  const place = {
    reviews: [
      googleReview({ rating: 2, text: { text: 'Disappointing.' } }),
      googleReview({ rating: 5, text: { text: 'Wonderful.' } }),
      googleReview({ rating: 3, text: { text: 'Fine.' } }),
    ],
  };
  const { body } = await reviewsForVenue({
    venueKey: 'ellipsis', lookupPlaceId: lookup, apiKey: 'k', fetchImpl: okFetch(place),
  });
  assert.deepEqual(body.reviews.map((r) => r.rating), [2, 5, 3]);
});

test('a venue with no Place ID yields an empty list, not an error', async () => {
  const { status, body } = await reviewsForVenue({
    venueKey: 'pinche-taco-shop', lookupPlaceId: lookup, apiKey: 'k',
    fetchImpl: () => assert.fail('must not call Google without a Place ID'),
  });
  assert.equal(status, 200);
  assert.deepEqual(body.reviews, []);
  assert.equal(body.reason, 'no_place_id');
});

/*
 * Cross-venue isolation. Each venue's reviews can only come from the Place ID
 * its own record declares — the venue key is the only input, and it is resolved
 * to a Place ID server-side, so one article cannot inherit another's reviews.
 */
test('each venue asks Google for its own place and no other', async () => {
  const asked = [];
  const spy = async (url) => {
    asked.push(url.split('/').pop());
    return { ok: true, status: 200, json: async () => ({ reviews: [] }) };
  };
  await reviewsForVenue({ venueKey: 'ellipsis', lookupPlaceId: lookup, apiKey: 'k', fetchImpl: spy });
  await reviewsForVenue({ venueKey: 'wren-cafe', lookupPlaceId: lookup, apiKey: 'k', fetchImpl: spy });

  assert.deepEqual(asked, [PLACES.ellipsis, PLACES['wren-cafe']]);
  assert.notEqual(asked[0], asked[1]);
});

test('a venue key the caller invents reaches no Place ID at all', async () => {
  const { body } = await reviewsForVenue({
    venueKey: '../ellipsis', lookupPlaceId: lookup, apiKey: 'k',
    fetchImpl: () => assert.fail('an unknown key must never reach Google'),
  });
  assert.deepEqual(body.reviews, []);
  assert.equal(body.reason, 'no_place_id');
});

test('zero reviews from Google renders nothing, and is not an error', async () => {
  const { status, body } = await reviewsForVenue({
    venueKey: 'ellipsis', lookupPlaceId: lookup, apiKey: 'k',
    /* a real place with no reviews omits the field entirely */
    fetchImpl: okFetch({ id: PLACE_ID, displayName: { text: 'ELLIPSIS' } }),
  });
  assert.equal(status, 200);
  assert.deepEqual(body.reviews, []);
  assert.equal(body.logLine, undefined);
});

test('a review with no author photo still renders — the disc is the fallback', async () => {
  const { body } = await reviewsForVenue({
    venueKey: 'ellipsis', lookupPlaceId: lookup, apiKey: 'k',
    fetchImpl: okFetch({ reviews: [googleReview({
      authorAttribution: { displayName: 'No Photo', uri: 'https://maps/contrib/1' },
    })] }),
  });
  assert.equal(body.reviews.length, 1);
  assert.equal(body.reviews[0].authorPhoto, null);
  /* the credit and the source link survive, which is what Google requires */
  assert.equal(body.reviews[0].authorName, 'No Photo');
  assert.ok(body.reviews[0].sourceUrl);
});

test('an upstream failure is invisible to the reader but logged for the operator', async () => {
  const { status, body, logLine } = await reviewsForVenue({
    venueKey: 'ellipsis', lookupPlaceId: lookup, apiKey: 'k',
    fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ error: { message: 'key revoked' } }) }),
  });
  /* 200 + empty: the article renders, the section does not */
  assert.equal(status, 200);
  assert.deepEqual(body.reviews, []);
  /* but the cause is diagnosable server-side */
  assert.match(logLine, /403/);
  assert.match(logLine, /key revoked/);
});

test('a network error is caught rather than thrown at the page', async () => {
  const { status, body, logLine } = await reviewsForVenue({
    venueKey: 'ellipsis', lookupPlaceId: lookup, apiKey: 'k',
    fetchImpl: async () => { throw new Error('ECONNRESET'); },
  });
  assert.equal(status, 200);
  assert.deepEqual(body.reviews, []);
  assert.match(logLine, /ECONNRESET/);
});

test('a missing API key degrades quietly and names itself in the log', async () => {
  const { body, logLine } = await reviewsForVenue({
    venueKey: 'ellipsis', lookupPlaceId: lookup, apiKey: undefined,
    fetchImpl: () => assert.fail('must not call Google without a key'),
  });
  assert.deepEqual(body.reviews, []);
  assert.match(logLine, /GOOGLE_PLACES_API_KEY/);
});

test('a malformed Place ID is refused before any billable call', async () => {
  const { body, logLine } = await reviewsForVenue({
    venueKey: 'x', lookupPlaceId: () => 'https://maps.google.com/?cid=1',
    apiKey: 'k', fetchImpl: () => assert.fail('must not call Google with a bad id'),
  });
  assert.deepEqual(body.reviews, []);
  assert.match(logLine, /malformed/);
});

test('drops only entries with nothing to render, never by rating', () => {
  const out = normalizePlace({
    reviews: [
      googleReview({ rating: 1 }),                                  // kept
      googleReview({ text: { text: '' } }),                         // no text
      googleReview({ authorAttribution: { uri: 'x' } }),            // no name to credit
    ],
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].rating, 1);
});
