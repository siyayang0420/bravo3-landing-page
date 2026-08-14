/*
 * Email normalisation and validation.
 *
 * Deliberately small. Fully validating an address per RFC 5322 is famously
 * impractical and still cannot tell you whether it receives mail; the database's
 * UNIQUE constraint is the real guarantee against duplicates, and a bounced
 * send is the real test of deliverability. This only rejects input that is
 * obviously not an address.
 *
 * Shared by the API and its tests, so the rules cannot drift between them.
 */

/* RFC 5321's maximum length for a deliverable address. */
export const MAX_EMAIL_LENGTH = 254;

/*
 * One @, no whitespace, and a dot-something after it. Intentionally permissive:
 * anything stricter starts rejecting real addresses (new TLDs, tagged
 * addresses, apostrophes) for no gain.
 */
const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {unknown} input
 * @returns {{ ok: true, email: string } | { ok: false, reason: string }}
 */
export function normalizeEmail(input) {
  if (typeof input !== 'string') return { ok: false, reason: 'not_a_string' };

  /*
   * Trim whitespace, including the non-breaking space that a paste from a
   * styled document or an email client signature commonly carries along.
   */
  const trimmed = input.replace(/^[\s ]+|[\s ]+$/g, '');
  if (trimmed === '') return { ok: false, reason: 'empty' };

  /*
   * Length is checked before anything else touches the value, so a megabyte of
   * text never reaches the regex or the database.
   */
  if (trimmed.length > MAX_EMAIL_LENGTH) return { ok: false, reason: 'too_long' };

  if (!SHAPE.test(trimmed)) return { ok: false, reason: 'shape' };

  /*
   * Lower-cased whole. The local part is technically case-sensitive per RFC
   * 5321, but no mainstream provider treats it that way, and folding it is what
   * stops "Sam@x.com" and "sam@x.com" becoming two rows — which matters more
   * for a waitlist than a spec edge case no real address relies on.
   */
  return { ok: true, email: trimmed.toLowerCase() };
}
