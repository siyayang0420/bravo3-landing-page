/*
 * Place ID discovery for the editorial workflow — the rules, with no transport
 * and no printing, so the matching can be tested without a key or a network.
 * scripts/find-place.js is the CLI around it.
 *
 * This is a *sibling* of server/lib/reviews.mjs, not a second integration: same
 * Places API (New), same server-side key, same header convention, same rule that
 * nothing but the place ID is ever kept. Reviews read Place Details by ID; this
 * resolves an ID in the first place, which is a one-off editorial step.
 *
 * What it deliberately does NOT do:
 *   - infer or convert an ID from a Maps CID, a Knowledge Graph ID, or the
 *     internals of a Maps URL — those identify a place to Maps, not to the
 *     Places API, and are not interchangeable
 *   - invent, guess or "best-guess" an ID
 *   - persist the response, or write to any venue file
 */

export const SEARCH_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

/*
 * Only what an editor needs to confirm identity. `websiteUri` earns its place:
 * for a shared-brand family (La Taqueria's Pinche Taco Shop, COMEDOR and
 * Brentwood all carry the parent's name) the site was the field that separated
 * them when name and address alone could not. `businessStatus` catches a
 * permanently-closed listing before it becomes a venue record.
 */
export const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.websiteUri',
  'places.primaryTypeDisplayName',
  'places.businessStatus',
].join(',');

/* Lower-case, strip punctuation, collapse whitespace — enough to compare a
   human-typed name against Google's listing name without pretending to be a
   fuzzy matcher. */
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/* The leading number of a street address, which is the single most reliable
   discriminator between two branches of the same brand. */
const streetNumber = (s) => (String(s ?? '').trim().match(/^\d+/) || [])[0] ?? null;

/**
 * How well one candidate matches what the editor asked for. Advisory only —
 * a human still confirms. Nothing here selects or discards a candidate.
 */
export function assess(place, { name, address }) {
  const wantName = norm(name);
  const gotName = norm(place.displayName?.text);
  /* either direction: Google's listing is often the brand plus the branch
     ("Pinche Taco Shop By La Taqueria…"), so containment beats equality */
  const nameMatch = Boolean(wantName && gotName && (gotName.includes(wantName) || wantName.includes(gotName)));

  const wantNo = streetNumber(address);
  const gotAddr = norm(place.formattedAddress);
  const streetMatch = Boolean(wantNo && gotAddr.startsWith(`${wantNo} `));

  return {
    nameMatch,
    streetMatch,
    /* both, or it is not strong — a name match alone is exactly how you end up
       with the wrong branch of a chain */
    strong: nameMatch && streetMatch,
    open: place.businessStatus === 'OPERATIONAL' || place.businessStatus === undefined,
  };
}

/**
 * @returns {Promise<{ok:boolean, reason?:string, candidates?:Array, query?:string}>}
 *   Never throws; the CLI decides how to present the outcome.
 */
export async function findPlace({ name, address, apiKey, fetchImpl = fetch }) {
  if (!name || !address) return { ok: false, reason: 'usage' };
  if (!apiKey) return { ok: false, reason: 'no_api_key' };

  const query = `${name}, ${address}`;

  let res;
  try {
    res = await fetchImpl(SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': SEARCH_FIELD_MASK,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ textQuery: query }),
    });
  } catch (e) {
    return { ok: false, reason: 'unreachable', detail: e.message, query };
  }

  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error?.message ?? '';
    } catch { /* non-JSON error body */ }
    return { ok: false, reason: 'upstream_error', status: res.status, detail, query };
  }

  const body = await res.json();
  const candidates = (body.places ?? []).map((p) => ({
    id: p.id,
    name: p.displayName?.text ?? null,
    address: p.formattedAddress ?? null,
    website: p.websiteUri ?? null,
    type: p.primaryTypeDisplayName?.text ?? null,
    status: p.businessStatus ?? null,
    match: assess(p, { name, address }),
  }));

  return { ok: true, query, candidates };
}
