/*
 * Google Places (New) review retrieval — the rules, with no transport around
 * them so they can be tested with no key, no network and no request.
 * api/reviews.js is the adapter that supplies both.
 *
 * ── Storage policy ────────────────────────────────────────────────────────
 * Google's Places policy: "You must not pre-fetch, cache, or store Places API
 * content beyond the allowed exceptions", and the only exception relevant here
 * is the place ID, which is "exempt from the caching restrictions". So:
 *
 *   stored   — the place ID, in content/venues/<key>.yml
 *   NOT stored — review text, ratings, author names, avatars, URIs, anywhere:
 *                not Markdown, not YAML, not generated JSON, not Neon, and not
 *                a CDN/edge cache. Responses go out `no-store`.
 *
 * Every page view therefore costs one Place Details call. That is a deliberate
 * v1 trade: Google publishes no caching allowance for review content, and this
 * refuses to lean on an ambiguous reading to save requests.
 */

/* Place Details (New) is a GET; the key and the field mask travel as headers. */
const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places';

/*
 * Exactly the fields the approved component and Google's attribution rules
 * need, and nothing else — `reviews` bills at the Enterprise + Atmosphere SKU,
 * so an over-broad mask is a real cost as well as a policy smell.
 *
 *   text                            the review, shown
 *   rating                          the stars, shown
 *   relativePublishTimeDescription  "a month ago", shown
 *   googleMapsUri                   REQUIRED — access to the source review
 *   authorAttribution               REQUIRED — name, profile URI, avatar
 *   id / displayName                confirms the response is the venue asked for
 */
export const FIELD_MASK = [
  'id',
  'displayName',
  'reviews.text',
  'reviews.rating',
  'reviews.relativePublishTimeDescription',
  'reviews.googleMapsUri',
  'reviews.authorAttribution',
].join(',');

/* Google's own format: an opaque token that has always begun "ChIJ" in
   practice but is only documented as URL-safe base64-ish. Checked loosely —
   enough to reject a venue key or a URL pasted into the field by mistake. */
const PLACE_ID = /^[A-Za-z0-9_-]{10,255}$/;

/**
 * Maps one Places review onto the shape the component already renders.
 * Field names come from the API rather than a parallel schema of our own.
 */
function normalizeReview(review) {
  const author = review.authorAttribution ?? {};
  return {
    /* attribution — all three are Google requirements when present */
    authorName: author.displayName ?? null,
    authorUrl: author.uri ?? null,
    authorPhoto: author.photoUri ?? null,
    /* the review itself */
    rating: typeof review.rating === 'number' ? review.rating : null,
    text: review.text?.text ?? '',
    relativeTime: review.relativePublishTimeDescription ?? null,
    /* REQUIRED: readers must be able to reach the source review on Maps */
    sourceUrl: review.googleMapsUri ?? null,
  };
}

/*
 * Google's order is used exactly as returned — by relevance, which is the
 * documented default. No re-sorting, no filtering, no dropping low ratings:
 * that would both mislead readers and breach the policy on disclosing how
 * reviews are ordered. A review with no text is dropped only because the card
 * has nothing to show; that is not a quality judgement.
 */
export function normalizePlace(place) {
  const reviews = Array.isArray(place?.reviews) ? place.reviews : [];
  return reviews.map(normalizeReview).filter((r) => r.text && r.authorName);
}

/**
 * @param {object}   opts
 * @param {string}   opts.venueKey     from the query string
 * @param {Function} opts.lookupPlaceId venueKey -> placeId | undefined
 * @param {string}   opts.apiKey       server-side only
 * @param {Function} [opts.fetchImpl]  injected in tests
 * @returns {Promise<{status:number, body:object, logLine?:string}>}
 */
export async function reviewsForVenue({ venueKey, lookupPlaceId, apiKey, fetchImpl = fetch }) {
  /* An unknown or absent venue is not an error the reader should ever see: the
     component treats an empty list as "render nothing", so the article is
     unaffected either way. */
  if (!venueKey || typeof venueKey !== 'string') {
    return { status: 400, body: { reviews: [], reason: 'missing_venue' } };
  }

  const placeId = lookupPlaceId(venueKey);
  if (!placeId) {
    /* The common, entirely valid case: a venue with no Google integration. */
    return { status: 200, body: { reviews: [], reason: 'no_place_id' } };
  }
  if (!PLACE_ID.test(placeId)) {
    return {
      status: 200,
      body: { reviews: [], reason: 'invalid_place_id' },
      logLine: `venue "${venueKey}" has a malformed googlePlaceId`,
    };
  }
  if (!apiKey) {
    return {
      status: 200,
      body: { reviews: [], reason: 'not_configured' },
      logLine: 'GOOGLE_PLACES_API_KEY is not set on this deployment',
    };
  }

  let res;
  try {
    res = await fetchImpl(`${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
    });
  } catch (e) {
    /* DNS, TLS, timeout — indistinguishable to a reader, and none of them are
       a reason to lose the article. */
    return { status: 200, body: { reviews: [], reason: 'unreachable' }, logLine: `Places fetch failed: ${e.message}` };
  }

  if (!res.ok) {
    let detail = '';
    try {
      const err = await res.json();
      detail = err?.error?.message ?? '';
    } catch { /* a non-JSON error body tells us nothing extra */ }
    /*
     * 200 to the browser with an empty list, the real status in the log. A
     * reader must never meet a raw Google error, and the page must not appear
     * broken because a third party had a bad minute — but the operator needs
     * the status and message to diagnose a bad key or a revoked Place ID.
     */
    return {
      status: 200,
      body: { reviews: [], reason: 'upstream_error' },
      logLine: `Places ${res.status} for venue "${venueKey}" (${placeId}): ${detail}`,
    };
  }

  const place = await res.json();
  const reviews = normalizePlace(place);

  return {
    status: 200,
    body: {
      reviews,
      /* echoed so a mismatch between the venue asked for and the place returned
         is visible in the network tab rather than silently rendered */
      place: { id: place.id ?? null, name: place.displayName?.text ?? null },
    },
  };
}
