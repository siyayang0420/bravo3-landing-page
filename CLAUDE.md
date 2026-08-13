# Working on this repo

React 18 + Vite, plain CSS (no Tailwind, no CSS-in-JS). One .css file per component,
imported from that component. Shared values live in `src/styles/tokens.css` — add a
variable there rather than hardcoding a new color or size.

Hard constraints from the brand:
- Fonts: Boldonse and Inter only.
- Boldonse: display use only (wordmark, hero, marquee, closing statement), max ~3 words per
  line, line-height >= 1.3.
- Yellow #FFD400 is an accent; never a section background.
- Copy is short, human, confident. Headlines create curiosity; they don't explain features.
- The page tells one story (one night out) — do not turn it into a feature grid.

## The blog is generated — never hand-write its plumbing

A post is **one Markdown file plus its images**: `content/posts/<slug>/index.md`.
See `content/README.md` for the frontmatter fields and authoring rules.

Everything else is derived by `scripts/build-content.js` and **must not be edited by
hand** — an edit will be silently overwritten on the next dev/build:

- `src/content/generated/posts.js`
- `blog/<slug>/index.html` and `blog/index.html`
- `public/sitemap.xml`

The generator runs inside a Vite plugin (`config()` + a `content/**` watcher), so
`npm run dev` and `npm run build` share one code path and cannot diverge. Generated
files are committed on purpose: for a marketing site, the diff of a generated `<head>`
*is* the SEO review surface.

- `npm run content` / `content:check` — regenerate / fail if the checked-in output is stale.
- `npm run images` — build each post's 1200×630 social card from its hero (macOS `sips`).
  Existing cards are left alone unless `--force`, so a live URL is never re-encoded.

Two import rules:
- Nothing under `src/` may import from `scripts/`. Values both sides need live in plain
  modules with no asset imports — `src/lib/categories.js`, `src/lib/urls.js` — which the
  scripts import under bare Node.
- `src/lib/posts.js` is the app's stable import surface; components import from there,
  never from `src/content/generated/`.
