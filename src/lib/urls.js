/*
 * URL shapes for the blog. Standalone (no asset imports) so the build scripts
 * can import it under plain Node and emit exactly the URLs the app links to —
 * a breadcrumb in generated JSON-LD and the href the React breadcrumb renders
 * come from this one place and therefore cannot disagree.
 */
export const postUrl = (slug) => `/blog/${slug}/`;

export const categorySlug = (name) => name.toLowerCase().replace(/\s+/g, '-');

/* The post breadcrumb shows the category, so it needs somewhere to point. The
   index reads `?category=` back on load, which makes a filtered view a real,
   shareable URL rather than throwaway component state — and /blog/'s canonical
   still points at /blog/, so the variants can't read as duplicate pages. */
export const categoryUrl = (name) => `/blog/?category=${categorySlug(name)}`;
