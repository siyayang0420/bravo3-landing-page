import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readPosts, readVenues } from './lib/read.js';
import { measure } from './lib/images.js';

/*
 * Generates each post's 1200x630 social card from its hero.
 *
 * Deliberately NOT part of `npm run build`: this leans on `sips`, which is
 * macOS-only, so putting it in the build would hard-couple deploys to a Mac and
 * break the first time the site builds on CI. Outputs are committed instead —
 * the same convention the repo already used for public/blog-hero-*.jpg.
 *
 * Existing cards are skipped unless --force, so a card that is already live and
 * cached by social platforms is never silently re-encoded.
 */

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const QUALITY = 'high'; // sips: low | normal | high | best

const FORCE = process.argv.includes('--force');
const PUBLIC = path.join(process.cwd(), 'public');

const sips = (args) => execFileSync('sips', args, { stdio: ['ignore', 'ignore', 'pipe'] });

function makeCard(heroAbs, outAbs, label) {
  const { width, height } = measure(heroAbs, label);

  /* scale so the hero *covers* the card, then centre-crop to size — scaling
     straight to 1200x630 would stretch a photo that isn't already 1.9:1 */
  const scale = Math.max(OG_WIDTH / width, OG_HEIGHT / height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const tmp = `${outAbs}.tmp.jpg`;
  try {
    sips(['-s', 'format', 'jpeg', '-s', 'formatOptions', QUALITY, heroAbs, '--out', tmp]);
    sips(['-z', String(h), String(w), tmp]);
    sips(['-c', String(OG_HEIGHT), String(OG_WIDTH), tmp]);
    fs.renameSync(tmp, outAbs);
  } catch (e) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw new Error(`${label}: sips failed — ${e.stderr?.toString().trim() || e.message}`);
  }

  const kb = Math.round(fs.statSync(outAbs).size / 1024);
  if (scale > 1) {
    console.log(`  ! ${path.basename(outAbs)}  ${OG_WIDTH}x${OG_HEIGHT}  ${kb}KB  (hero is only ${width}px wide — upscaled)`);
  } else {
    console.log(`  + ${path.basename(outAbs)}  ${OG_WIDTH}x${OG_HEIGHT}  ${kb}KB`);
  }
}

try {
  const venues = readVenues();
  const posts = readPosts();
  let made = 0;
  let skipped = 0;

  for (const post of posts) {
    const fm = post.frontmatter;
    if (!fm.hero) continue;
    const file = fm.seo?.ogImage ?? `blog-hero-${post.slug}.jpg`;
    const outAbs = path.join(PUBLIC, file);
    const heroAbs = path.join(post.dir, fm.hero);

    /* Existence, not mtime: a card that is already live is cached by social
       platforms, and git doesn't preserve mtimes anyway, so "older than its
       hero" would rebuild cards spuriously after any clone. Replacing one is an
       explicit --force. */
    if (fs.existsSync(outAbs) && !FORCE) {
      console.log(`  = ${file}  (exists — pass --force to rebuild)`);
      skipped++;
      continue;
    }
    makeCard(heroAbs, outAbs, post.file);
    made++;
  }

  /* venue logos aren't social cards, but a missing one is the same class of
     mistake, so surface it here rather than at render time */
  for (const [key, venue] of Object.entries(venues)) {
    if (!fs.existsSync(venue.logoPath)) {
      console.warn(`  ! content/venues/${key}.yml: logo not found at ${venue.logo}`);
    }
  }

  console.log(`\n  ${made} card(s) written, ${skipped} left alone`);
} catch (e) {
  console.error(`\nimage build failed\n  ${e.message}\n`);
  process.exit(1);
}
