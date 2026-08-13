/*
 * The blog's public API for the app.
 *
 * The post data itself is generated from content/posts/<slug>/index.md — see
 * scripts/build-content.js. This file stays hand-written so the components keep
 * a stable import surface regardless of what the generator emits.
 *
 * To add a post: create content/posts/<slug>/index.md, drop its images beside it
 * in images/, then run `npm run images`. Nothing here needs editing.
 */
import { POSTS } from '../content/generated/posts.js';

export { POSTS };
export { CATEGORIES } from './categories.js';
export { postUrl, categorySlug, categoryUrl } from './urls.js';

export const getPost = (slug) => POSTS.find((p) => p.slug === slug);
