/*
 * Every check here replaces something that is currently remembered by a human.
 * They all throw: a build that fails with a readable message is strictly better
 * than a page that ships with a missing alt or an unfiltered category.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RESERVED_SLUGS = new Set(['index']);

const required = (value, field, where) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`${where}: "${field}" is required`);
  }
  return value;
};

export function validatePost(post, { categories, venues }) {
  const { slug, file, frontmatter: fm } = post;

  /* also guarded on the post, in case hours are attached to the article rather
     than to the venue record */
  rejectOpeningHours(fm, file, '');
  rejectOpeningHours(fm.seo, file, ' under "seo"');

  if (!SLUG.test(slug)) {
    throw new Error(`content/posts/${slug}/: directory name must be lower-case words joined by hyphens`);
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`content/posts/${slug}/: "${slug}" is reserved — it would collide with the blog index`);
  }

  required(fm.title, 'title', file);
  required(fm.date, 'date', file);
  required(fm.hero, 'hero', file);
  required(fm.heroAlt, 'heroAlt', file);

  /* js-yaml parses an unquoted 2026-08-08 into a Date; either form is fine to
     author, but downstream wants the ISO string. */
  const date = fm.date instanceof Date ? fm.date.toISOString().slice(0, 10) : String(fm.date);
  if (!ISO_DATE.test(date)) {
    throw new Error(`${file}: date must be YYYY-MM-DD, got "${fm.date}"`);
  }

  required(fm.category, 'category', file);
  if (!categories.includes(fm.category)) {
    throw new Error(
      `${file}: category "${fm.category}" is not in CATEGORIES — valid: ${categories.join(', ')}. ` +
        `Add it to src/lib/categories.js or the filter chip will never appear.`,
    );
  }

  if (fm.venue && !venues[fm.venue]) {
    const known = Object.keys(venues);
    throw new Error(
      `${file}: venue "${fm.venue}" has no content/venues/${fm.venue}.yml` +
        (known.length ? ` — known venues: ${known.join(', ')}` : ''),
    );
  }

  required(fm.seo?.description, 'seo.description', file);

  return { ...post, date };
}

/*
 * Bravo Magazine deliberately does not publish venue opening hours: they are
 * dynamic operational data that goes stale, and the magazine is not their
 * authoritative source. Rejecting the field rather than ignoring it means a
 * future agent that researches and adds hours gets told why, instead of quietly
 * having the work dropped — or worse, silently reintroducing the claim.
 */
const HOURS_FIELDS = ['openingHours', 'opening_hours', 'hours', 'businessHours', 'openingHoursSpecification'];

function rejectOpeningHours(record, where, scope) {
  for (const field of HOURS_FIELDS) {
    if (record?.[field] !== undefined) {
      throw new Error(
        `${where}: "${field}"${scope} is not supported — Bravo Magazine does not publish venue opening hours.\n` +
          `    Hours are dynamic operational data we do not maintain as an authoritative source, so they are\n` +
          `    never stored or emitted as structured data. Remove the field; readers get current hours from\n` +
          `    the venue's "mapUrl" (its Google Maps location). Event start/end times in article copy are a\n` +
          `    separate thing and remain fine.`,
      );
    }
  }
}

export function validateVenue(venue) {
  const where = `content/venues/${venue.key}.yml`;
  rejectOpeningHours(venue, where, '');
  rejectOpeningHours(venue.schema, where, ' under "schema"');
  /* mapUrl is required, not optional: every venue's address links to its own
     Google Maps location, so the credit block is the same shape everywhere. A
     venue added without one would silently render a dead-looking plain address. */
  for (const field of ['name', 'logo', 'street', 'locality', 'mapUrl', 'site', 'siteUrl']) {
    required(venue[field], field, where);
  }

  /*
   * Optional: a venue without it simply renders no reviews section. But a
   * malformed one would fail silently at request time and look like "this venue
   * has no reviews", so the shape is checked here where the message can name the
   * file. It must be the Places ID (a "ChIJ…"-style token), not the CID pair
   * from a Maps URL and not a URL — those identify a place to Maps, not to the
   * Places API, and are not interchangeable.
   */
  if (venue.googlePlaceId !== undefined) {
    const id = String(venue.googlePlaceId).trim();
    if (!/^[A-Za-z0-9_-]{10,255}$/.test(id)) {
      throw new Error(
        `${where}: "googlePlaceId" is not a Google Place ID — got "${id}".\n` +
          `    Expected an opaque token such as ChIJg4UbagBzhlQR1tHd7tI6fdk, not a URL and not the\n` +
          `    "0x…:0x…" pair from mapUrl. Resolve it with Google's Place ID Finder:\n` +
          `    https://developers.google.com/maps/documentation/places/web-service/place-id`,
      );
    }
  }

  return venue;
}
