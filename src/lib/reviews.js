/*
 * Venue reviews — the app's stable import surface, mirroring src/lib/posts.js.
 *
 * Components ask for a venue key and get reviews back; they never learn that
 * Google is involved. The request goes to this site's own origin, where a
 * Vercel Function holds the API key and resolves the key to a Place ID.
 *
 * Nothing is cached here, by design. Google's Places policy exempts only the
 * place ID from its caching restrictions, so review content is not stored in
 * the repo, in generated files, in a database, at the edge, or in this module.
 * Each mount fetches; each response is `no-store`.
 *
 * The venue key is the filename in content/venues/ without .yml — the same key
 * an article already declares in its `venue:` frontmatter.
 */

/**
 * @param {string | undefined} venueKey
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<object>>} never rejects — an empty array means
 *   "render nothing", which is also what every failure produces. A venue with
 *   no reviews, a venue with no Place ID, and an unreachable Google are
 *   deliberately indistinguishable to the caller: none of them is a reason for
 *   the article around this section to change.
 */
export async function fetchVenueReviews(venueKey, { signal } = {}) {
  if (!venueKey) return [];

  try {
    const res = await fetch(`/api/reviews?venue=${encodeURIComponent(venueKey)}`, {
      headers: { accept: 'application/json' },
      signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.reviews) ? data.reviews : [];
  } catch {
    /* Aborted (unmounted mid-flight), offline, blocked — all the same here. */
    return [];
  }
}

/*
 * Shape returned to the component, mapped from the Places response in
 * server/lib/reviews.mjs:
 *
 *   authorName    string        required — shown, and Google requires the credit
 *   authorUrl     string | null shown as the author's link to their Maps profile
 *   authorPhoto   string | null the avatar; null falls back to the design's disc
 *   rating        number 1–5    shown as stars
 *   text          string        shown, clamped to three lines
 *   relativeTime  string | null "a month ago" — Google's own wording
 *   sourceUrl     string | null REQUIRED link to the review on Google Maps
 */
