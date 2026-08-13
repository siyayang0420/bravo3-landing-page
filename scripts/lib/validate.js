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

export function validateVenue(venue) {
  const where = `content/venues/${venue.key}.yml`;
  /* mapUrl is required, not optional: every venue's address links to its own
     Google Maps location, so the credit block is the same shape everywhere. A
     venue added without one would silently render a dead-looking plain address. */
  for (const field of ['name', 'logo', 'street', 'locality', 'mapUrl', 'site', 'siteUrl']) {
    required(venue[field], field, where);
  }
  return venue;
}
