import fs from 'node:fs';
import path from 'node:path';
import { readPosts, readVenues, byDateDesc } from './lib/read.js';
import { validatePost, validateVenue } from './lib/validate.js';
import { parseMarkdown, inlineToText } from './lib/markdown.js';
import { resolveFigure, assertOgCard, measure } from './lib/images.js';
import { emitPosts } from './lib/emit-posts.js';
import { emitPostHtml, emitIndexHtml } from './lib/emit-html.js';
import { emitSitemap } from './lib/emit-sitemap.js';
/* scripts/ may read src/, never the reverse — categories.js is plain JS with no
   asset imports precisely so it can be loaded under bare Node here. */
import { CATEGORIES } from '../src/lib/categories.js';

/*
 * Turns content/ into everything derivable from it: the generated posts module,
 * each post's HTML shell, the blog index, and the sitemap.
 *
 * Run by the Vite plugin in config(), so `npm run dev` and `npm run build` share
 * one code path and can't diverge. `--check` regenerates in memory and exits 1
 * if anything on disk differs.
 */

const CHECK = process.argv.includes('--check');
const ROOT = process.cwd();

const dateLabel = (iso) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));

/* Only rewrite when the bytes actually change: the dev watcher watches these
   paths, so unconditional writes would make it chase its own tail. */
function write(absPath, contents, changed) {
  const existing = fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
  if (existing === contents) return;
  changed.push(path.relative(ROOT, absPath));
  if (CHECK) return;
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, contents);
}

export function buildContent({ silent = false } = {}) {
  const venues = Object.fromEntries(
    Object.entries(readVenues()).map(([k, v]) => [k, validateVenue(v)]),
  );

  const posts = readPosts()
    .map((post) => validatePost(post, { categories: CATEGORIES, venues }))
    .map((post) => {
      const fm = post.frontmatter;
      /* checked here rather than left to Vite: an unresolvable static import
         surfaces as a bundler error about a path, which is not a useful message
         for someone editing frontmatter. */
      const heroAbs = path.join(post.dir, fm.hero);
      measure(heroAbs, `${post.file}: hero "${fm.hero}"`);

      const blocks = parseMarkdown(post.markdown, post.file, post.bodyStartLine);

      const content = blocks.map((block) =>
        block.type === 'figure' ? resolveFigure(block, post.dir, post.file) : block,
      );

      const firstParagraph = content.find((b) => b.type === 'p');
      const ogImageFile = fm.seo?.ogImage ?? `blog-hero-${post.slug}.jpg`;

      return {
        ...post,
        heroAbs,
        content,
        crumb: fm.crumb ?? fm.title,
        dateLabel: dateLabel(post.date),
        excerpt: fm.excerpt ?? (firstParagraph ? inlineToText(firstParagraph.inline) : ''),
        ogImageFile,
        ogImage: assertOgCard(ogImageFile, post.file),
        venueData: fm.venue ? venues[fm.venue] : null,
      };
    })
    .sort(byDateDesc);

  const changed = [];
  write(path.join(ROOT, 'src/content/generated/posts.js'), emitPosts(posts, venues), changed);
  for (const post of posts) {
    write(path.join(ROOT, 'blog', post.slug, 'index.html'), emitPostHtml(post), changed);
  }
  write(path.join(ROOT, 'blog/index.html'), emitIndexHtml(posts), changed);
  write(path.join(ROOT, 'public/sitemap.xml'), emitSitemap(posts), changed);

  /* A slug removed from content/ leaves an orphan directory that Vite would
     still build and crawlers would still see. */
  const slugs = new Set(posts.map((p) => p.slug));
  for (const entry of fs.readdirSync(path.join(ROOT, 'blog'), { withFileTypes: true })) {
    if (entry.isDirectory() && !slugs.has(entry.name)) {
      console.warn(
        `  ! blog/${entry.name}/ has no content/posts/${entry.name}/ — delete it if the post is gone`,
      );
    }
  }

  if (!silent && changed.length) {
    console.log(`  content: ${changed.length} file(s) ${CHECK ? 'out of date' : 'written'}`);
    for (const f of changed) console.log(`    ${f}`);
  }
  return { posts, changed };
}

/* Only self-execute when run directly (npm run content), not when the Vite
   plugin imports buildContent(). */
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { posts, changed } = buildContent();
    if (CHECK && changed.length) {
      console.error('\nGenerated files are out of date. Run: npm run content');
      process.exit(1);
    }
    const published = posts.filter((p) => !p.frontmatter.draft).length;
    console.log(`  ${posts.length} post(s), ${published} published, ${posts.length - published} draft`);
  } catch (e) {
    console.error(`\ncontent build failed\n  ${e.message}\n`);
    process.exit(1);
  }
}
