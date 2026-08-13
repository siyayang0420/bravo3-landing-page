/*
 * The blog's category vocabulary. Standalone (no asset imports) so the build
 * scripts can import it under plain Node to validate every post's `category`,
 * while the app imports it for the index filter chips.
 *
 * Adding a value here is what makes a new filter chip possible; a post naming a
 * category that isn't listed fails the build rather than silently vanishing.
 */
export const CATEGORIES = ['AI Event', 'Restaurant'];
