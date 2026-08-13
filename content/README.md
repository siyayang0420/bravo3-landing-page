# Authoring a Bravo blog post

**This file is the complete specification.** You can write, validate and publish a post
using only this document, your approved copy and your images. You do not need to read
the build scripts, the React components, the templates or any existing article's HTML.

A post is **one Markdown file plus its images**. Everything else — the HTML page, the
`<head>` tags, JSON-LD, breadcrumbs, the sitemap row, the blog-index card and the build
entry — is derived from that file.

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
npm run images     # builds the post's 1200×630 social card from its hero
npm run content    # validates and regenerates everything (optional — dev/build do it)
npm run dev        # or: npm run build
```

`npm run content` is the validator. It exits non-zero and prints the file, the line
where possible, and what to fix. `npm run content:check` additionally fails if the
committed generated files are out of date.

A new post directory needs a dev-server restart to appear, because the page list is read
once at startup. Edits to an existing post hot-reload.

---

## 3. Frontmatter

Keys must appear in this order. **Only `title`, `date`, `category`, `hero`, `heroAlt` and
`seo.description` are required** — omit anything that does not apply. Do not add a key
just to make files look alike; an omitted optional key and a key set to its default mean
the same thing, and the omitted form is correct.

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
| `venueIsSubject` | conditional | Only meaningful with `venue`. `true` adds schema.org `about` as well as `contentLocation` — use when the article is *about* the venue (Ellipsis), not merely *held at* it (an event at Wren Cafe). Omit otherwise. |
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
  openingHours: Mo-Su 09:00-23:00      # optional, Restaurant only
```

`mapUrl` is **required**: every venue's address links to its own Google Maps location, so
the credit block reads the same everywhere. Use the venue's own place URL. `bravoUrl` is
the only optional link — a venue with no Bravo page yet renders that half as plain text.

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

From your Markdown, the build derives: the page and its `<head>`; `<title>`, description,
canonical, `robots`; all `og:`/`twitter:` tags; the JSON-LD graph (`BlogPosting`,
`Place`/`Restaurant`, `BreadcrumbList`); breadcrumbs; the printed date; the blog-index
card and its JSON-LD entry; the sitemap row; the Vite build entry; and every image's
aspect ratio, `width`/`height`, lazy-loading and decoding attributes.

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
