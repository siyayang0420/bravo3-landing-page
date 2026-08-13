import fs from 'node:fs';
import path from 'node:path';
/* js-yaml 5 is ESM-only with named exports — there is no default export */
import { load as parseYaml } from 'js-yaml';

/*
 * Reads the authoring tree under content/ into plain objects. Nothing here
 * knows about React, Vite or HTML — that lives in the emit-* modules.
 */

export const CONTENT_DIR = path.join(process.cwd(), 'content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const VENUES_DIR = path.join(CONTENT_DIR, 'venues');

/* Splitting the delimiter ourselves and handing the capture to js-yaml is the
   whole of what gray-matter would add, minus a dependency. */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function splitFrontmatter(raw, file) {
  const m = raw.match(FRONTMATTER);
  if (!m) throw new Error(`${file}: missing --- frontmatter block at the top of the file`);
  let data;
  try {
    data = parseYaml(m[1]) ?? {};
  } catch (e) {
    /* An unquoted colon in a title is by far the most common cause, and js-yaml's
       own message ("bad indentation of a mapping entry") does not suggest it. Its
       line/column are relative to the frontmatter block, so they are reported as
       such rather than as file lines. */
    throw new Error(
      `${file}: frontmatter is not valid YAML — ${e.message}\n` +
        `    (position is within the --- block.) A value containing ":" must be quoted, ` +
        `e.g. title: "Ellipsis Vancouver: Coffee and Cocktails"`,
    );
  }
  /* markdown-it numbers tokens against the body it was handed, so error
     messages need the frontmatter's line count added back to point at the real
     line in the file the author is editing. */
  return { data, body: raw.slice(m[0].length), bodyStartLine: m[0].split('\n').length - 1 };
}

export function readVenues() {
  if (!fs.existsSync(VENUES_DIR)) return {};
  const venues = {};
  for (const entry of fs.readdirSync(VENUES_DIR).sort()) {
    if (!entry.endsWith('.yml') && !entry.endsWith('.yaml')) continue;
    const file = path.join(VENUES_DIR, entry);
    const key = entry.replace(/\.ya?ml$/, '');
    let data;
    try {
      data = parseYaml(fs.readFileSync(file, 'utf8')) ?? {};
    } catch (e) {
      throw new Error(`content/venues/${entry}: not valid YAML — ${e.message}`);
    }
    /* logo path is relative to the venues dir, like a post's images are to its own */
    venues[key] = { ...data, key, dir: VENUES_DIR, logoPath: path.join(VENUES_DIR, data.logo ?? '') };
  }
  return venues;
}

export function readPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .map((slug) => {
      const dir = path.join(POSTS_DIR, slug);
      const file = path.join(dir, 'index.md');
      if (!fs.existsSync(file)) {
        throw new Error(`content/posts/${slug}/: no index.md — every post directory needs one`);
      }
      const rel = `content/posts/${slug}/index.md`;
      const { data, body, bodyStartLine } = splitFrontmatter(fs.readFileSync(file, 'utf8'), rel);
      return { slug, dir, file: rel, frontmatter: data, markdown: body, bodyStartLine };
    });
}

/* Post order on the index is newest first. Doing it here rather than asking the
   author to order files by hand means the index LCP hint is always on the
   genuinely-first card. */
export const byDateDesc = (a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1);
