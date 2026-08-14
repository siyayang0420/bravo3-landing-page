/*
 * Normalisation and validation rules — the part of the waitlist that can be
 * proven without a database. Run with:  npm run test:waitlist
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail, MAX_EMAIL_LENGTH } from './lib/email.mjs';

test('accepts a plain address', () => {
  assert.deepEqual(normalizeEmail('sam@example.com'), { ok: true, email: 'sam@example.com' });
});

test('trims surrounding whitespace, including pasted non-breaking space', () => {
  assert.equal(normalizeEmail('  sam@example.com  ').email, 'sam@example.com');
  assert.equal(normalizeEmail(' sam@example.com ').email, 'sam@example.com');
  assert.equal(normalizeEmail('\n\tsam@example.com\n').email, 'sam@example.com');
});

test('lower-cases, so casing cannot create a second row', () => {
  assert.equal(normalizeEmail('Sam@Example.COM').email, 'sam@example.com');
  assert.equal(
    normalizeEmail('  SAM@EXAMPLE.com ').email,
    normalizeEmail('sam@example.com').email,
  );
});

test('rejects empty and whitespace-only input', () => {
  for (const value of ['', '   ', '\t\n', ' ']) {
    assert.equal(normalizeEmail(value).ok, false, `expected ${JSON.stringify(value)} to fail`);
  }
});

test('rejects anything that is not a string', () => {
  for (const value of [null, undefined, 42, {}, [], true]) {
    assert.equal(normalizeEmail(value).ok, false);
  }
});

test('rejects malformed shapes', () => {
  for (const value of [
    'sam', 'sam@', '@example.com', 'sam@example', 'sam @example.com',
    'sam@exa mple.com', 'sam@@example.com', 'sam@.com',
  ]) {
    assert.equal(normalizeEmail(value).ok, false, `expected ${value} to fail`);
  }
});

test('enforces the maximum length, measured after trimming', () => {
  const localPart = 'a'.repeat(MAX_EMAIL_LENGTH - '@example.com'.length);
  const atLimit = `${localPart}@example.com`;
  assert.equal(atLimit.length, MAX_EMAIL_LENGTH);
  assert.equal(normalizeEmail(atLimit).ok, true);

  assert.equal(normalizeEmail(`a${atLimit}`).ok, false);
  /* padding does not count toward the limit */
  assert.equal(normalizeEmail(`   ${atLimit}   `).ok, true);
});

test('a very large payload is rejected on length, never parsed', () => {
  const huge = `${'a'.repeat(100_000)}@example.com`;
  assert.deepEqual(normalizeEmail(huge), { ok: false, reason: 'too_long' });
});
