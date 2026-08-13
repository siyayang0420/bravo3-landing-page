# bravoapp.ai — Bravo landing site & Bravo Magazine

React + Vite site for [bravoapp.ai](https://bravoapp.ai): the Bravo product landing page
(animated hero, marquee, Ask, Taste, Pay, footer) **and Bravo Magazine**, the blog at
`/blog/`.

It is a multi-page Vite build, not a single-page app with a router. Every page ships its
own `<title>`, description, canonical and JSON-LD in static HTML, so crawlers and
link-preview scrapers get correct metadata without executing JavaScript.

## Bravo Magazine in one minute

Blog publishing is **content-driven**. Articles are not hand-built HTML pages — each one
is a Markdown file plus its images under `content/`, and the build derives the page, its
metadata, its structured data, the sitemap row and the blog-index entry from that.

**Editorial production does not happen in this repository.** Research, story IDs, venue
dossiers, angle exploration, drafting, review, QA and the content calendar live in a
**separate local Bravo Magazine workspace**, normally operated through **Claude Cowork**.
That workspace has its own README and its own commands; none of it is reproduced here.

Only the *approved publishing artifact* is handed into this repo.

```
Local Bravo Magazine editorial workspace   ← Claude Cowork
        │
        │  Research → Angles → Draft → Review → QA → Approval
        ▼
bravo-landing/content/                     ← the publishing package lands here
        │
        ▼
Validation / generation                    (npm run content, or dev/build)
        │
        ▼
Website build                              (npm run build)
        │
        ▼
Deployment                                 ← separate, manual step
        │
        ▼
Live article
```

> **READY TO PUBLISH ≠ LIVE.**
> Validation and generation only produce files in this repository. An article is live
> only after the repository's normal deployment process has run. Nothing in `content/`,
> and no npm script here, publishes to the web by itself.

**Where to go next**

| If you want to… | Go to |
|---|---|
| Research, write, revise or manage a story | the local Bravo Magazine workspace, in Cowork |
| Understand how approved content becomes a web page | **[`content/README.md`](content/README.md)** — the authoritative publishing contract |
| Change the site, components, or the content generator | this repo |

### Which assistant does what

Guidance only — a convention, not a technical dependency. **The website builds with plain
`npm` and does not require Claude or Cowork.**

- **Claude Cowork** — operates the separate editorial workflow: researches, writes and
  revises stories, runs editorial QA, and prepares an approved publishing package that
  conforms to `content/README.md`.
- **Claude Code** — maintains this repository: the site, React components, styling, and
  the content generator/validator under `scripts/`.

## Getting started

```bash
npm install
npm run dev
```

## Commands

| Command | Purpose | Writes files? |
|---|---|---|
| `npm run dev` | Vite dev server. Regenerates content on startup and watches `content/**`, reloading on change. | **Yes** — regenerates generated files |
| `npm run build` | Production build into `dist/`. Regenerates content first. | **Yes** — generated files + `dist/` |
| `npm run preview` | Serves the existing `dist/` locally. | No |
| `npm run lint` | ESLint over the repo. | No |
| `npm run content` | Runs the content generator: validates `content/` and rewrites the generated files. | **Yes** |
| `npm run content:check` | Validates `content/` and fails if the committed generated files are out of date. | **No — read-only** |
| `npm run images` | Builds any missing 1200×630 social card from each post's hero. Skips cards that already exist. | **Yes** — only *new* cards |

**The distinction that matters for editorial handoff:**

- **`npm run content:check`** is the safe verification command. It runs every validation
  rule and reports what is wrong or out of date, but writes nothing. Use it to confirm a
  publishing package is valid.
- **`npm run content`** performs the same validation and then *writes* the generated
  website files.

Note that `npm run dev` and `npm run build` also regenerate content, because the generator
runs inside a Vite plugin so dev and build cannot drift apart. `content:check`, `lint` and
`preview` are the only read-only commands.

`npm run images` is deliberately **not** part of `npm run build`: it shells out to macOS
`sips`, so wiring it into the build would tie deploys to a Mac. Existing social cards are
never overwritten (a rebuild requires `node scripts/optimize-images.js --force`), so a
card already cached by social platforms cannot change by accident. The build *fails* if a
post has no card, which is the reminder to run it.

## Deployment

There is no CI/CD configuration in this repository. The site is served by **nginx (1.18.0,
Ubuntu)** — see [`deploy/nginx-redirects.conf`](deploy/nginx-redirects.conf), which holds
the checked-in redirect and cache rules that must be applied on the server by hand
(`sudo nginx -t && sudo systemctl reload nginx`).

Deployment itself is a separate manual step: build, then publish `dist/` by whatever
process the server currently uses. **Check the current deployment configuration before
assuming a hosting provider, branch or pipeline** — none is declared here.

## Project structure

```
content/            Bravo Magazine source — posts and venues. See content/README.md.
scripts/            Content generator and validator; the image/social-card script.
blog/               GENERATED per-post HTML shells. Do not edit by hand.
src/
  components/       Page sections and visual components (one .css per component)
  content/generated/ GENERATED post data. Do not edit by hand.
  lib/              Shared, asset-free modules (categories, urls, posts facade, links)
  styles/tokens.css Shared colour, spacing and typography tokens
  assets/           Landing-page imagery and store badges
public/             Copied verbatim — favicon, robots.txt, sitemap.xml, social cards
deploy/             Server config that must be applied by hand
```

`CLAUDE.md` holds the brand and code constraints for this repo (fonts, colour rules, the
one-story landing page, and the rule that generated blog files are never hand-edited).

## Design notes

- Use existing tokens in `src/styles/tokens.css` before adding colours, type scales or spacing.
- Keep motion subtle and respect `prefers-reduced-motion`.
- The landing page tells one story — keep it a focused page rather than adding routing.
