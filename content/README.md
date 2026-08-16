# Bravo Magazine — publishing contract

**This file is the complete specification for turning an approved story into a website
page.** You can prepare, validate and publish a post using only this document, your
approved copy and your images. You do not need to read the build scripts, the React
components, the templates or any existing article's HTML.

A post is **one Markdown file plus its images**. Everything else — the HTML page, the
`<head>` tags, JSON-LD, breadcrumbs, the sitemap row, the blog-index card and the build
entry — is derived from that file.

---

## 0. Where this fits

This `content/` directory is the **website publishing layer**. It is *not* the Bravo
Magazine editorial workspace.

Editorial production happens in a **separate local Bravo Magazine system**, normally
operated through Claude Cowork. That workspace holds the things this directory
deliberately does not: research, story IDs, restaurant and event dossiers, angle
exploration, `ARTICLE.md` drafts, editorial review, QA, the content calendar, and status
such as READY_TO_PUBLISH / PUBLISHED. It has its own README and its own commands.

**Only the approved publishing artifact belongs here.**

```
Editorial ARTICLE.md          (local Bravo Magazine workspace)
        │  approval
        ▼
Publishing index.md           (this directory)
        │
        ▼
Content generator             (npm run content, or dev/build)
        │
        ▼
Website
```

An article's frontmatter names its venue and nothing more about it. Restaurant identity —
address, links, and the Google `googlePlaceId` — belongs to the canonical venue record, so
two articles at the same venue cannot disagree and a venue's details are corrected in one
place. Never put `googlePlaceId`, reviews, or venue detail in an article.

`ARTICLE.md` and `index.md` serve different purposes on purpose. `ARTICLE.md` may carry
rich editorial and workflow metadata — story ID, sources, review notes, status, angle.
`index.md` carries **only** the fields in this contract; anything else is either ignored
or rejected. Do not try to make one file do both jobs.

> **Generating a page does not publish it.** These commands only write files in this
> repository. The article is live only after the repo's normal deployment process runs —
> see the root [`README.md`](../README.md).

### The publishing package

An approved story is handed over as exactly this:

```
content/posts/<slug>/
    index.md
    images/
        hero.webp
        p1.webp
        p2.webp
        …
```

plus, only when the story credits a venue that has no record yet:

```
content/venues/<venue>.yml
content/venues/images/<logo>.webp
```

Venue records are **reusable and shared**. A venue's name, address, map link, site and
logo live in its `.yml` once and are referenced by every post that credits it — never
copied into a post's frontmatter. Two posts at the same venue reference the same file.

---

## 1. Directory structure

```
content/posts/<slug>/
  index.md
  images/
    hero.webp
    p1.webp
    p2.webp
    …
```

The **directory name is the slug**, and the slug is the URL: `content/posts/my-post/`
publishes to `/blog/my-post/`.

Slug rules: lower-case letters, digits and single hyphens (`^[a-z0-9]+(-[a-z0-9]+)*$`).
`index` is reserved. Two posts cannot share a slug — the filesystem prevents it.

---

## 2. Publishing

```bash
npm run content:check   # validate only — writes nothing
npm run images          # build the 1200×630 social card from the hero (required)
npm run content         # validate AND rewrite the generated website files
npm run dev             # or: npm run build — both also regenerate
```

| Command | Validates | Writes files |
|---|---|---|
| `npm run content:check` | yes | **no** — also fails if committed generated files are stale |
| `npm run content` | yes | yes |
| `npm run dev` / `npm run build` | yes | yes |
| `npm run images` | — | only social cards that don't exist yet |

**Use `content:check` to verify a handoff.** It runs every rule in this document and
writes nothing, so it is safe to run against a package you are not ready to commit. Use
`npm run content` when you actually want the generated files updated.

All of them exit non-zero on the first problem and print the file, the line where one
applies, and what to fix.

A new post directory needs a dev-server restart to appear, because the page list is read
once at startup. Edits to an existing post hot-reload.

---

## 3. Frontmatter

**Required (6):** `title`, `date`, `category`, `hero`, `heroAlt`, `seo.description`.
Everything else is optional — omit anything that does not apply. Do not add a key just to
make files look alike; an omitted optional key and a key set to its default mean the same
thing, and the omitted form is correct.

The key order below is a **house convention, not a validated rule** — the build accepts
any order. Follow it anyway so posts diff cleanly against each other.

```yaml
---
title:            # required
crumb:            # optional  — defaults to title
date:             # required  — YYYY-MM-DD
category:         # required  — see §4
venue:            # optional  — a filename in content/venues/, without .yml
venueIsSubject:   # conditional — only with `venue`; true when the venue IS the subject
draft:            # optional  — omit to publish; `true` to hold back
hero:             # required  — images/hero.webp
heroAlt:          # required  — describes the hero photo
excerpt:          # optional  — defaults to the first paragraph
seo:
  title:          # optional  — only to override the derived title
  description:    # required
  socialDescription:  # optional — defaults to seo.description
  ogImageAlt:     # optional  — defaults to heroAlt
  ogImage:        # optional  — only to keep an existing published card URL
---
```

**YAML quoting.** Quote any value containing a colon, or starting with `#`, `[`, `{`, `*`
or `&`. A colon is the common case:

```yaml
seo:
  title: "Ellipsis Vancouver: Coffee and Cocktails, 9 a.m. to 11 p.m."
```

Unquoted, YAML reads everything before the colon as a key and the file fails to parse.
Apostrophes, em dashes and accented characters need no quoting and are preserved exactly.

### Field reference

| Field | Kind | Behaviour |
|---|---|---|
| `title` | required | The `<h1>`, the index-card title, and the JSON-LD `headline`. |
| `crumb` | optional | Last breadcrumb label. Defaults to `title`. Set it when the title is too long for a breadcrumb — Vol. 3's title is *"That's a wrap on Bravo AI Sessions Vol. 3"*, its crumb is *"Bravo AI Sessions Vol. 3"*. **Omit when it would equal the title.** |
| `date` | required | `YYYY-MM-DD`. Drives `<time>`, `datePublished`, the sitemap row, and index order. The printed form ("August 8, 2026") is derived — never write it. |
| `category` | required | Must be one of §4. Sets the breadcrumb's middle level, `articleSection`, and which filter chip shows the post. |
| `venue` | optional | Filename in `content/venues/` without `.yml` (`venue: wren-cafe`). Renders the venue credit block under the hero and adds a schema.org `Place`/`Restaurant` as `contentLocation`. Omit and neither appears. |
| `venueIsSubject` | conditional | Requires `venue`. `true` adds schema.org `about` alongside `contentLocation` — use when the article is *about* the venue (Ellipsis), not merely *held at* it (an event at Wren Cafe). Omit otherwise. Without `venue` it is silently ignored rather than rejected, so do not rely on it alone. |
| `draft` | optional | Omit to publish. `true` keeps the post out of `sitemap.xml` and the blog-index JSON-LD, and sets `robots: noindex, follow`. The page still builds and still shows on the blog index, so you can review it. Publishing = deleting this line. |
| `hero` | required | Always `images/hero.webp`. Displayed in a fixed 980×599 frame and centre-cropped, so faces near the edges may be trimmed. |
| `heroAlt` | required | Describes the hero photo. Also the default `og:image:alt`. |
| `excerpt` | optional | The blog-index card summary, clamped to two lines. Defaults to the first paragraph, which is usually too long — write one sentence. |
| `seo.title` | optional | Overrides the `<title>`, `og:title`, `twitter:title` and adds `alternativeHeadline`. Use for a search-facing title unlike the editorial one. **When omitted**, `<title>` is `"<title> — Bravo Blog"` and the social title is `title`. When present it is used verbatim, with no suffix. |
| `seo.description` | required | The `<meta name="description">`. One or two sentences. |
| `seo.socialDescription` | optional | Shorter text for `og:`/`twitter:`/JSON-LD `description`. Defaults to `seo.description`. Only add it when the meta description is too long to share well. |
| `seo.ogImageAlt` | optional | Alt for the social card. Defaults to `heroAlt`. |
| `seo.ogImage` | optional | **Do not set this on a new post.** The card filename defaults to `blog-hero-<slug>.jpg`. This key exists only to pin a card URL that is already live and cached by social platforms. |

---

## 4. Categories

The authoritative list lives in **`src/lib/categories.js`** and is enforced by the
validator. As of this writing:

```
AI Event
Restaurant
```

A category not in that list **fails the build** — it would otherwise publish a post no
filter chip could ever reach. Adding a category is a code change (one array entry), so
ask before inventing one.

---

## 5. Body

Ordinary Markdown after the closing `---`. **Document order is authoritative**: the page
renders paragraphs and photos in exactly the order written, which is how a photo comes to
sit between two paragraphs.

```markdown
There are two bars at Ellipsis, and neither one closes when the other opens.

![Two iced matcha drinks on a mirrored tray at Ellipsis](images/p1.webp)

The room seats 47 and runs from nine in the morning until eleven at night.

![An omelette finished with XO sauce on a dark plate](images/p2.webp)
```

### Supported

| Syntax | Notes |
|---|---|
| Paragraphs | Blank line between them. A single newline inside one is just a space. |
| `## Subheading` | The only heading level — `title` is already the page's `h1`. |
| `[text](https://…)` | External links automatically get `target="_blank" rel="noopener noreferrer"`. Internal links start with `/`. |
| `*emphasis*`, `**strong**` | |
| `![alt](images/pN.webp)` | See §6. |

### Not supported — these fail the build

`#`, `###`–`######` headings · bullet lists · numbered lists · blockquotes · tables ·
fenced or indented code blocks · horizontal rules (`---`) · raw HTML.

They fail rather than being dropped silently, so nothing you write disappears without
telling you. If copy needs one of these, that is a template change — ask.

Backticks render as plain text, not code styling.

---

## 6. Images

### Naming — strict

```
images/hero.webp     the hero
images/p1.webp       first body image, in document order
images/p2.webp       second …
```

Numbering follows the order the images appear in the Markdown, with no gaps. Do not use
descriptive filenames — the post directory already says which article it is. Use `.webp`.

### Alt text — required

Every image needs alt text describing what is in it. An empty `![](…)` fails the build.
Write what a reader who cannot see the photo would need: *"Guests at tables in the
Ellipsis dining room after dark"*, not *"photo"* or *"image 3"*.

### Aspect and focus — usually omit

By default an image keeps its own proportions, and the page reserves the right amount of
space before it loads. Add options only when a design crops deliberately:

```markdown
![A card on the counter](images/p5.webp "aspect: 980/958; focus: 50% 82%")
```

- `aspect: W/H` — the frame to show the image in, as a **ratio**, not pixels. By
  convention the width is written as `980` (today's content column) purely because it
  makes the height easy to read off a design, but only the ratio is used: `980/490` and
  `2/1` behave identically, and if the column width ever changes these values stay
  correct. Anything other than `W/H` fails the build.
- `focus: X% Y%` — which part survives the crop, as CSS `object-position`.
  `50% 100%` keeps the bottom, `50% 0%` the top. Only meaningful alongside `aspect`.

Separate the two with `;`. `aspect` and `focus` are the only options.

### The social card

`npm run images` builds `public/blog-hero-<slug>.jpg` (1200×630) by centre-cropping the
hero. The build **fails** if a post has no card, so run it before building.

Existing cards are never overwritten — regenerating one is a deliberate
`node scripts/optimize-images.js --force`. This is why a published post's social preview
cannot change by accident.

---

## 7. Venues

`content/venues/<key>.yml` holds the visible credit and its schema.org fields together so
they cannot drift, and is reusable across posts.

Every venue renders the same three lines:

```
Venue Name | Venue Name on bravo      ← the highlighted half links to its Bravo page
Street, City                          → links to that venue's Google Maps location
website.ca                            → links to the venue's own site
```

```yaml
name: Wren Cafe
logo: images/wren-cafe-logo.webp   # relative to content/venues/
bravoUrl: https://…                # optional — omit and the highlight is plain text
street: 280 Nelson St              # required
locality: Vancouver                # required
mapUrl: https://…                  # required — this venue's Google Maps location
site: wrencafe.ca                  # required — the label shown
siteUrl: https://wrencafe.ca       # required — where that label links
schema:
  type: Place                      # or Restaurant
  region: BC
  country: CA
  servesCuisine: [Coffee, Cocktails]   # optional, Restaurant only
```

**Required (7):** `name`, `logo`, `street`, `locality`, `mapUrl`, `site`, `siteUrl`.
Missing any one of them fails the build.

| Field | Kind | Behaviour |
|---|---|---|
| `googlePlaceId` | optional | Enables the Google reviews section for every article at this venue — see below. Omit it and no reviews section renders. |
| `name` | required | Shown twice in the credit line, and the schema.org `name`. |
| `logo` | required | Path relative to `content/venues/` — by convention `images/<venue>-logo.webp`. Rendered in an 81×81 box. |
| `street`, `locality` | required | The address line. Also `streetAddress` / `addressLocality` in `PostalAddress`. |
| `mapUrl` | required | This venue's own Google Maps location. The address line links here. |
| `site`, `siteUrl` | required | The label shown, and where it links. `siteUrl` is also the schema.org `url`. |
| `bravoUrl` | optional | The venue's page on Bravo. Omit and the highlighted half renders as plain text instead of a link — the only optional link in the block. |
| `schema.type` | optional | `Place` or `Restaurant`. Defaults to `Place`. |
| `schema.region`, `schema.country` | optional | `addressRegion` / `addressCountry`. |
| `schema.servesCuisine` | optional | Restaurant only. A list, e.g. `[Coffee, Cocktails]`. |

Values under `schema` are passed through to structured data as given; only the
opening-hours fields below are rejected.

`mapUrl` is **required**: every venue's address links to its own Google Maps location, so
the credit block reads the same everywhere. Use the venue's own place URL. `bravoUrl` is
the only optional link — a venue with no Bravo page yet renders that half as plain text.

### Google reviews — `googlePlaceId`

**Optional.** One field on the venue, and nothing else, anywhere:

```yaml
name: Wren Cafe
street: 280 Nelson St
locality: Vancouver
mapUrl: https://…            # the clickable address
siteUrl: https://wrencafe.ca
googlePlaceId: ChIJPVtgMgBzhlQRMJ3LT4cv2gs   # optional — enables reviews
```

Add it and **every** article for that venue gains the reviews section automatically —
current articles and future ones, with no code change and no per-article setup. Omit it and
the venue is still completely valid: the article renders normally, with no reviews section
and no error for the reader. It is not required, and most venues will not have one.

#### The two Google fields are not interchangeable

| Field | Purpose | Looks like |
|---|---|---|
| `mapUrl` | the clickable address in the venue credit — a destination for a human | a Maps URL, often containing `0x…:0x…` |
| `googlePlaceId` | identifies the venue to the Places **API** — a key for a machine | an opaque token, e.g. `ChIJPVtg…` |

**Neither can be derived from the other.** The `0x…:0x…` pair inside a `mapUrl` is a
different identifier and is not convertible. Keep both; they do different jobs. The build
rejects a `googlePlaceId` that is a URL or a CID pair.

#### Obtaining one

It must come from a **verified Google Places result** — either Google's
[Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
or a Places API Text Search. Either way: search the venue's name **and full address**, then
confirm the returned name and address match the venue record before accepting the ID.

**If more than one plausible candidate comes back, or you cannot confirm the match, leave
the field out and flag it for a human.** Never invent a Place ID, never guess one, and never
infer one from an unrelated Maps identifier. A wrong ID silently attaches **another
business's reviews** to the article — which is worse than having no reviews, because
nothing about the page looks broken.

#### Reviews are never authored

No `index.md` and no venue file contains review text, author names, ratings or quotes — not
copied, not paraphrased, not summarised, not hand-written. Do not select, rank, reorder or
edit reviews; the shared system renders exactly what Google returns, in Google's own
relevance order, and says so on the page.

Review content is fetched live at page load and is deliberately **not** stored in Markdown,
venue YAML, generated files, the database, or any cache. Google's Places policy exempts only
the *place ID* from its caching restrictions — which is precisely why that one value may
live in this directory and the review content may not.

#### The workflow, end to end

1. Create or identify the canonical venue in `content/venues/`.
2. Verify the venue's identity — name and address.
3. Obtain and verify its `googlePlaceId` if you confidently can; otherwise flag it.
4. Write that one field into the venue record.
5. Write the article normally, referencing only `venue: <key>`.

The shared template does the rest. There is no review step, no review file, and nothing
about reviews in an article.

### Do not publish venue opening hours

**Bravo Magazine does not store, generate or publish venue opening hours.** This is a
deliberate editorial policy, not an omission.

Hours are dynamic operational data. They change without notice, and a magazine article is
the wrong place to assert them — a stale claim in structured data is worse than no claim,
because search engines will surface it as fact. Bravo Magazine is not the authoritative
source for a venue's hours; the venue is.

If you are writing or researching a post:

- **Do not research a venue's opening hours for publication.**
- **Do not add `openingHours`** — or `hours`, `businessHours`, `opening_hours`,
  `openingHoursSpecification` — to a venue file or to post frontmatter. The build
  **rejects** these fields with an explanation; they are not silently ignored.
- **Do not generate opening-hours structured data** anywhere.
- **`mapUrl` is the answer.** Readers follow the venue's Google Maps link for current
  hours and operational status, which is always up to date.

**Event times are different and remain supported.** A start or end time for a specific
event, and prose describing when something happened, are editorial content about a moment
in time, not a standing claim about a business. Ellipsis's article says the room "runs
from nine in the morning until eleven at night" in its copy — that is reporting, and it
stays. The prohibition is on *structured venue hours*, not on writing about time.

Quote any value containing a `#`, e.g. `street: "1540 W 2nd Ave #205"` — unquoted, YAML
reads `#` as the start of a comment.

---

## 8. What the build derives — never write these by hand

Editing any of the following is pointless: it is overwritten on the next dev run or build.

```
src/content/generated/posts.js
blog/<slug>/index.html
blog/index.html
public/sitemap.xml
```

> **Never hand-edit a generated file to publish or fix an article.** Publishing always
> originates in `content/`. An edit made downstream is silently discarded the next time
> anyone runs dev, build or `npm run content` — and until then the site and its source
> disagree, which `npm run content:check` will flag as out of date.

| Authored by you | Derived by the build |
|---|---|
| `title`, `crumb`, `date`, `category` | canonical URL, `<title>`, printed date ("August 8, 2026"), breadcrumbs, `articleSection` |
| `seo.*`, `heroAlt` | `<meta name="description">`, every `og:` and `twitter:` tag, `og:image:width`/`height` |
| `venue` reference | the venue credit block, the `Place`/`Restaurant` JSON-LD node, `contentLocation` (and `about` with `venueIsSubject`) |
| `draft` | `robots`, sitemap inclusion, blog-index JSON-LD inclusion |
| Markdown body and image files | the page HTML, block order, each image's aspect ratio, `width`/`height`, `loading` and `decoding` |
| — | the JSON-LD graph (`BlogPosting`, `Place`/`Restaurant`, `BreadcrumbList`), the sitemap row, the blog-index card and its JSON-LD entry, the Vite build entry |

Index order is **newest first by `date`**. The first card loads eagerly as the page's
largest image; the rest lazy-load. You do not control this and should not try to.

---

## 9. Canonical example

`content/posts/bravo-ai-sessions-vol-4/index.md`

```markdown
---
title: Bravo AI Sessions Vol. 4
crumb: Bravo AI Sessions Vol. 4
date: 2026-09-02
category: AI Event
venue: wren-cafe
hero: images/hero.webp
heroAlt: Guests gathered around the counter during Bravo AI Sessions Vol. 4
excerpt: An evening on what changes when the agent can also pay the bill.
seo:
  description: Bravo AI Sessions Vol. 4 at Wren Cafe, on what changes when an agent can discover, book, order and pay.
  ogImageAlt: Guests at Bravo AI Sessions Vol. 4
---

An evening on what changes when the agent can also pay the bill.

![Guests talking around cafe tables during the session](images/p1.webp)

Thanks to [WREN CAFÉ](https://www.bravoup.ca/store/wren-cafe) for hosting us.

![The room filling up before the talk](images/p2.webp)
```

with `images/hero.webp`, `images/p1.webp`, `images/p2.webp` beside it. Then
`npm run images` and `npm run build`.

---

## 10. What fails the build, and why

Each error names the file, the line where one applies, and what to fix.

| Failure | Reason |
|---|---|
| Missing `title`, `date`, `hero`, `heroAlt`, `category` or `seo.description` | Required. |
| `date` not `YYYY-MM-DD` | Feeds `datePublished` and the sitemap. |
| `category` not in `src/lib/categories.js` | No filter chip could reach the post. |
| `venue` with no matching `content/venues/<key>.yml` | Typo in the venue key. |
| Slug not lower-case-hyphenated, or `index` | It is the public URL. |
| Hero or body image missing on disk | A typo would otherwise fail later as a bundler error about a path. |
| Image with no alt text | Accessibility and SEO. |
| `aspect` not `W/H`, or an unknown image option | Only `aspect` and `focus` exist. |
| Unsupported Markdown (lists, tables, `###`, blockquotes, code blocks, raw HTML) | Would be dropped or published as visible characters. |
| Malformed YAML frontmatter | Usually an unquoted colon in a title. |
| Missing social card | `npm run images`. |
| `openingHours` (or `hours`/`businessHours`/…) on a venue or post | Bravo Magazine does not publish venue opening hours — see §7. |

---

## 11. If publishing fails

Run `npm run content:check` first — it reports the same errors without writing anything.

| Symptom | Where to look |
|---|---|
| `category "X" is not in CATEGORIES` | The authoritative list is `src/lib/categories.js`. Adding a value is a code change — ask before inventing one. |
| `no such image` | Check `content/posts/<slug>/images/`. Names are strict: `hero.webp`, then `p1.webp`, `p2.webp`… in document order, no gaps. |
| `has no alt text` | Every `![](…)` needs a description inside the brackets. |
| `"X" is not supported` (Markdown) | §5. Lists, tables, blockquotes, code blocks, `###`, `---` rules and raw HTML all fail by design. |
| `frontmatter is not valid YAML` | Usually an unquoted colon. Quote the whole value: `title: "Name: Subtitle"`. The error prints a caret at the offending character. |
| Venue error (`"mapUrl" is required`, unknown venue) | Check `content/venues/<key>.yml` against §7. The `venue:` key in frontmatter is the filename without `.yml`. |
| `og:image … is missing` | Run `npm run images`. It only creates cards that don't exist. |
| Social card is wrong/outdated | Existing cards are never overwritten. Rebuild deliberately: `node scripts/optimize-images.js --force`. |
| `Generated files are out of date` from `content:check` | Someone changed `content/` without regenerating. Run `npm run content` and commit the result. |
| Page builds but the article isn't live | Generation is not deployment. See the root [`README.md`](../README.md). |
| New post doesn't appear in `npm run dev` | Restart the dev server — the page list is read once at startup. |
