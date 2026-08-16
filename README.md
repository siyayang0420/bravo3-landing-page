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
| `npm run test:waitlist` | Tests the waitlist endpoint's rules. No network, no credentials. | No |
| `npm run test:reviews` | Tests the Google reviews endpoint's rules. No network, no API key. | No |
| `npm run db:migrate` | Applies `server/schema.sql` to the database in `.env`. Run by hand. | Writes to the **database** |

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

The site runs on **Vercel**, with the apex domain attached there. Deploys come from the
Git integration — push, and Vercel runs `npm run build` and serves `dist/`. Framework and
output directory are auto-detected, so they are deliberately not restated in
`vercel.json`.

[`vercel.json`](vercel.json) holds the two things the platform will not infer:

- **Redirects.** `/blog/bravo-tech-sessions-vol-3` (both slash forms) and the post's old
  social image `301` to their renamed counterparts, so the rename keeps its search
  ranking. `statusCode: 301` is written out rather than `"permanent": true`, which emits
  a **308** — a different status than the one already published.
- **A `Cache-Control` header on `/favicon.svg`.** Vite fingerprints JS and CSS, but files
  in `public/` are copied verbatim, so without this an icon change takes the default 30
  days to reach returning visitors. A day is short enough to iterate.

`npm run images` stays out of the build (see above), so the social cards must be committed
— Vercel's Linux builder has no `sips` and cannot generate them.

### The waitlist API

The coming-soon form posts to `/api/waitlist`, which is
[`api/waitlist.js`](api/waitlist.js) — a Vercel Function on the same origin as the site.
The browser never talks to Neon, and never learns a database exists.

- The connection string is the **Environment Variable `DATABASE_URL`** on the Vercel
  project (set for Production, Preview and Development). It is not in the repo, and `.env*`
  is gitignored.
- Use Neon's **pooled** connection string — the host containing `-pooler`.
- The function uses `@neondatabase/serverless`, whose `neon()` is a single HTTPS round
  trip. A `pg.Pool` would assume a process that outlives the request; a function instance
  does not have one.
- Schema changes are still applied by hand from a laptop: `npm run db:migrate` reads
  `.env` and applies [`server/schema.sql`](server/schema.sql).

**Locally**, `npm run dev` serves the site but not the function — a signup submitted under
it will 404. To exercise the whole thing on one origin, use the Vercel CLI:

```bash
npx vercel dev
```

The endpoint's rules live in [`server/lib/signup.mjs`](server/lib/signup.mjs), separate
from the function so they can be tested with no credentials and no network:
`npm run test:waitlist`.

### The Google reviews API

Restaurant articles show Google reviews for their venue. The venue's
`googlePlaceId` in `content/venues/<key>.yml` is the only thing that enables it —
see [`content/README.md`](content/README.md).

The page calls `/api/reviews?venue=<key>`, which is
[`api/reviews.js`](api/reviews.js) — a Vercel Function that resolves the key to a Place ID
and calls **Place Details (New)**. The **`GOOGLE_PLACES_API_KEY`** Environment Variable
lives on the Vercel project (Production, Preview and Development) and never reaches the
browser: the client sees only normalized JSON from its own origin.

The venue *key* is the parameter, not a Place ID, so the endpoint cannot be used to run
arbitrary Place Details lookups against our billing.

**Nothing is cached.** Google's Places policy exempts only the place ID from its caching
restrictions — there is no published allowance for review content — so responses are
`no-store` and reviews are never written to Markdown, venue YAML, generated files, Neon,
or a CDN. Every page view is one Place Details call, which bills at the Enterprise +
Atmosphere SKU. That is a deliberate v1 trade of cost for a policy position that needs no
interpretation; revisit it if traffic makes it expensive.

Unlike the waitlist, **`npm run dev` does serve this endpoint** (a small middleware in
`vite.config.js` runs the same handler), because an unreachable reviews endpoint is
indistinguishable from a venue that simply has no reviews — the section just never
appears. The rules are in [`server/lib/reviews.mjs`](server/lib/reviews.mjs) and testable
with no key: `npm run test:reviews`.

**Rate limiting is not implemented.** The obvious in-process counter is worse than
nothing here: each function instance would keep its own, so the real ceiling would be
`limit × instances`. The two honest options, when it is worth adding:

- **Vercel WAF rate limiting** (Pro plan) — configured in the dashboard, runs at the edge,
  no code.
- **Upstash Redis / Vercel KV with `@upstash/ratelimit`** — a counter shared across
  instances; adds a service and a second environment variable.

## Project structure

```
api/                Vercel Functions. Every file here is a URL — api/waitlist.js is /api/waitlist.
content/            Bravo Magazine source — posts and venues. See content/README.md.
scripts/            Content generator and validator; the image/social-card script.
server/             Waitlist rules + schema + migration. Runtime-agnostic; api/ imports from it.
blog/               GENERATED per-post HTML shells. Do not edit by hand.
src/
  components/       Page sections and visual components (one .css per component)
  content/generated/ GENERATED post data. Do not edit by hand.
  lib/              Shared, asset-free modules (categories, urls, posts facade, links)
  styles/tokens.css Shared colour, spacing and typography tokens
  assets/           Landing-page imagery and store badges
public/             Copied verbatim — favicon, robots.txt, sitemap.xml, social cards
vercel.json         Redirects and cache headers — the only hosting config in the repo
```

`CLAUDE.md` holds the brand and code constraints for this repo (fonts, colour rules, the
one-story landing page, and the rule that generated blog files are never hand-edited).

## Design notes

- Use existing tokens in `src/styles/tokens.css` before adding colours, type scales or spacing.
- Keep motion subtle and respect `prefers-reduced-motion`.
- The landing page tells one story — keep it a focused page rather than adding routing.
