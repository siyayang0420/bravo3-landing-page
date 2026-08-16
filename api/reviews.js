/*
 * GET /api/reviews?venue=<key> — a Vercel Function.
 *
 * The same shape as api/waitlist.js: this file is only the adapter between
 * Vercel's req/res and the rules, which live in server/lib/reviews.mjs so they
 * can be tested with no key and no network.
 *
 * The venue KEY is the parameter, not a Place ID. The key is resolved to a
 * Place ID from generated venue data on this side, so the endpoint cannot be
 * used to run arbitrary Place Details lookups through our billing.
 *
 * GOOGLE_PLACES_API_KEY is read here and never leaves: the browser receives
 * normalized review JSON from its own origin and never learns Google is
 * involved, let alone the key.
 */
import { placeIdFor } from '../src/content/generated/venues.js';
import { reviewsForVenue } from '../server/lib/reviews.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET');
    return res.status(405).json({ reviews: [], reason: 'method_not_allowed' });
  }

  const { status, body, logLine } = await reviewsForVenue({
    venueKey: req.query?.venue,
    lookupPlaceId: placeIdFor,
    apiKey: process.env.GOOGLE_PLACES_API_KEY,
  });

  /* Server-side only: the reader gets an empty list, the operator gets the
     reason. This is the diagnosable half of "fail gracefully". */
  if (logLine) console.error(`[reviews] ${logLine}`);

  /*
   * no-store, deliberately. Google publishes no caching exception for review
   * content — only the place ID is exempt — so nothing is held at the edge, in
   * a shared cache, or in the browser. See server/lib/reviews.mjs.
   */
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  return res.status(status).json(body);
}
