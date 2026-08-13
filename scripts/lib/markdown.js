import MarkdownIt from 'markdown-it';

/*
 * Markdown → block tree.
 *
 * The output is the shape BlogPost.jsx renders directly: an ordered array of
 * `p` / `h2` / `figure` blocks, where a paragraph's text is a small inline tree
 * (text / a / em / strong). Deliberately NOT an HTML string — a string can't
 * carry Vite's hashed asset URLs, and attaching loading/decoding/aspect-ratio to
 * body images would mean rewriting <img> tags with a regex.
 *
 * Anything outside the supported set throws, naming the file and line. Silently
 * dropping a blockquote the author wrote is the one failure mode worth being
 * loud about.
 */

const md = new MarkdownIt({
  html: false, // raw HTML becomes escaped text, so the tree can't carry markup
  linkify: false, // bare URLs shouldn't auto-link in prose
  typographer: false, // would rewrite already-correct curly quotes and mangle “...?”
});

const INLINE_TAGS = { em: 'em', strong: 'strong' };

/* `<div>`, `</a>`, `<img …>` — an opening or closing tag, not a bare `<` used
   as a less-than sign in prose. */
const HTML_TAG = /<\/?[a-zA-Z][a-zA-Z0-9-]*(\s[^<>]*)?>/;

/* token.map is relative to the body markdown-it was given, so the frontmatter's
   length is added back to point at the real line of the file. */
let lineOffset = 0;
const where = (file, token) => `${file}${token?.map ? `:${token.map[0] + 1 + lineOffset}` : ''}`;

/* "aspect: 980/1070; focus: 50% 100%" — used only where the design crops
   deliberately; otherwise the aspect comes from the file's own dimensions. */
function parseImageOptions(title, file, token) {
  const out = {};
  if (!title) return out;
  for (const part of title.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [rawKey, ...rest] = trimmed.split(':');
    const key = rawKey.trim();
    const value = rest.join(':').trim();
    if (key === 'aspect') {
      const m = value.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
      if (!m) throw new Error(`${where(file, token)}: aspect must look like "980/1070", got "${value}"`);
      out.aspect = `${m[1]} / ${m[2]}`;
    } else if (key === 'focus') {
      out.focus = value;
    } else {
      throw new Error(`${where(file, token)}: unknown image option "${key}" — supported: aspect, focus`);
    }
  }
  return out;
}

function parseInline(token, file) {
  const stack = [{ inline: [] }];
  const push = (node) => stack[stack.length - 1].inline.push(node);

  for (const t of token.children ?? []) {
    switch (t.type) {
      case 'text':
        /* `html: false` turns raw HTML into escaped text rather than markup, so
           an author who pastes a tag would silently publish it as visible
           characters. Catching it here makes that a build failure instead. */
        if (HTML_TAG.test(t.content)) {
          throw new Error(
            `${where(file, token)}: raw HTML is not supported — write "${t.content.match(HTML_TAG)[0]}" as Markdown instead, or it will publish as visible text`,
          );
        }
        if (t.content) push({ t: 'text', v: t.content });
        break;
      case 'softbreak':
        /* a single newline inside a paragraph is just a space in the rendered
           text — authors wrap prose for readability, not to force a break */
        push({ t: 'text', v: ' ' });
        break;
      case 'hardbreak':
        push({ t: 'br' });
        break;
      case 'link_open': {
        const href = t.attrGet('href');
        if (!href) throw new Error(`${where(file, token)}: link with no href`);
        stack.push({ t: 'a', href, inline: [] });
        break;
      }
      case 'link_close':
      case 'em_close':
      case 'strong_close': {
        const node = stack.pop();
        if (stack.length === 0) throw new Error(`${where(file, token)}: unbalanced inline markup`);
        stack[stack.length - 1].inline.push(node);
        break;
      }
      case 'em_open':
      case 'strong_open':
        stack.push({ t: INLINE_TAGS[t.type.replace('_open', '')], inline: [] });
        break;
      case 'code_inline':
        push({ t: 'text', v: t.content });
        break;
      default:
        throw new Error(
          `${where(file, token)}: inline "${t.type}" is not supported — supported: text, link, em, strong, hardbreak`,
        );
    }
  }
  if (stack.length !== 1) throw new Error(`${where(file, token)}: unclosed inline markup`);
  return stack[0].inline;
}

/* A paragraph containing nothing but one image is a figure, not a paragraph
   wrapping an image — which is how `![alt](src)` on its own line reads. */
const isLoneImage = (inline) =>
  inline.children?.length === 1 && inline.children[0].type === 'image';

export function parseMarkdown(source, file, bodyStartLine = 0) {
  lineOffset = bodyStartLine;
  const tokens = md.parse(source, {});
  const blocks = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'paragraph_open') {
      const inline = tokens[i + 1];
      if (isLoneImage(inline)) {
        const img = inline.children[0];
        const src = img.attrGet('src');
        const alt = img.content?.trim();
        if (!alt) {
          throw new Error(
            `${where(file, token)}: image "${src}" has no alt text — every image needs a description`,
          );
        }
        blocks.push({
          type: 'figure',
          src,
          alt,
          /* carried so a missing file or a bad aspect can be reported against
             the line the author wrote, not just the post */
          line: (token.map?.[0] ?? 0) + 1 + lineOffset,
          ...parseImageOptions(img.attrGet('title'), file, token),
        });
      } else {
        const parsed = parseInline(inline, file);
        if (parsed.length) blocks.push({ type: 'p', inline: parsed });
      }
      i += 2; // skip inline + paragraph_close
      continue;
    }

    if (token.type === 'heading_open') {
      if (token.tag !== 'h2') {
        throw new Error(
          `${where(file, token)}: only "## " subheadings are supported (the post title is the h1)`,
        );
      }
      blocks.push({ type: 'h2', inline: parseInline(tokens[i + 1], file) });
      i += 2;
      continue;
    }

    if (token.type === 'inline' || token.type.endsWith('_close')) continue;

    throw new Error(
      `${where(file, token)}: "${token.type}" is not supported — supported: paragraphs, "## " subheadings, images, links, em, strong`,
    );
  }

  return blocks;
}

/* Flattened text, used to derive an excerpt when frontmatter omits one. */
export const inlineToText = (inline) =>
  inline.map((n) => (n.t === 'text' ? n.v : n.t === 'br' ? ' ' : inlineToText(n.inline ?? []))).join('');
