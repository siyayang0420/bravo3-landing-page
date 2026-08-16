/*
 * Resolve a Google Place ID for a venue, for the editorial workflow.
 *
 *   npm run place:find -- "Venue Name" "Full Street Address, City"
 *
 * Prints candidates for a human to verify. It deliberately does NOT write to
 * content/venues/ — identity is confirmed by a person, and the Place ID is
 * added by hand afterwards. See content/README.md.
 *
 * Reads GOOGLE_PLACES_API_KEY from .env via `node --env-file`, the same way
 * db:migrate reads DATABASE_URL. The key is used for one request and never
 * printed.
 */
import { findPlace } from '../server/lib/place-search.mjs';

const [name, address] = process.argv.slice(2);

const bold = (s) => `[1m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;
const green = (s) => `[32m${s}[0m`;
const yellow = (s) => `[33m${s}[0m`;
const red = (s) => `[31m${s}[0m`;

function usage() {
  console.error(`
${bold('Usage')}
  npm run place:find -- "<venue name>" "<full street address, city>"

${bold('Example')}
  npm run place:find -- "Wren Cafe" "280 Nelson St, Vancouver"

Give the full street address, not just the city — a name alone will happily
match another branch of the same business.
`);
}

function show(c, i) {
  const flag = c.match.strong ? green('● strong match') : dim('○ partial');
  const closed = c.status && c.status !== 'OPERATIONAL' ? red(`  ${c.status}`) : '';
  console.log(`
  [${i}] ${bold(c.name ?? '(no name)')}   ${flag}${closed}
      address  ${c.address ?? '—'}   ${c.match.streetMatch ? green('✓ street no. matches') : dim('street no. differs')}
      website  ${c.website ?? '—'}
      type     ${c.type ?? '—'}
      ${bold('googlePlaceId:')} ${c.id}`);
}

const result = await findPlace({
  name,
  address,
  apiKey: process.env.GOOGLE_PLACES_API_KEY,
});

if (!result.ok) {
  if (result.reason === 'usage') { usage(); process.exit(1); }
  if (result.reason === 'no_api_key') {
    console.error(red('\n  GOOGLE_PLACES_API_KEY is not set.\n') +
      '  Add it to .env (gitignored). It is the same key the reviews endpoint uses.\n');
    process.exit(1);
  }
  console.error(red(`\n  Lookup failed (${result.reason}${result.status ? ` ${result.status}` : ''}).`) +
    (result.detail ? `\n  ${result.detail}` : '') + '\n');
  process.exit(1);
}

const { candidates, query } = result;
console.log(`\n${dim(`query: ${query}`)}`);

if (!candidates.length) {
  console.log(yellow('\n  No candidates.') +
    '\n  Try the venue\'s exact registered name, or check the address.\n' +
    '  Do not invent a Place ID — leave googlePlaceId out and flag the venue.\n');
  process.exit(0);
}

candidates.forEach(show);

const strong = candidates.filter((c) => c.match.strong);
console.log('');

if (strong.length === 1 && candidates.length === 1) {
  console.log(green(`  ✓ One candidate, and it matches the name and street number you gave.`));
  console.log(`    Confirm the website and type look right, then add to the venue file:\n`);
  console.log(`      ${bold(`googlePlaceId: ${strong[0].id}`)}\n`);
} else if (strong.length === 1) {
  console.log(green(`  ✓ Likely match: [${candidates.indexOf(strong[0])}] ${strong[0].name}`));
  console.log(yellow(`    ${candidates.length} candidates came back, so check the others above before accepting it —`));
  console.log(yellow(`    branches of one brand often share a name.`));
  console.log(`\n      ${bold(`googlePlaceId: ${strong[0].id}`)}\n`);
} else if (strong.length > 1) {
  console.log(yellow(`  ${strong.length} candidates match both the name and the street number.`));
  console.log(`  ${bold('Needs a human decision')} — compare the websites above. Do not guess.\n`);
} else {
  console.log(yellow(`  No candidate matches both the name and the street number you gave.`));
  console.log(`  ${bold('Needs a human decision')} — verify against the venue's own website before`);
  console.log(`  accepting any of these, or leave googlePlaceId out and flag the venue.\n`);
}

console.log(dim('  Nothing was saved. Add the ID to content/venues/<key>.yml yourself once verified.\n'));
