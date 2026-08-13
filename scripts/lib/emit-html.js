import { categorySlug } from '../../src/lib/urls.js';

/*
 * Emits each post's HTML shell and the blog index.
 *
 * This file is the single origin of every string that used to be duplicated by
 * hand: canonical (7 places), title (5), date (5 across 3 files), the three
 * description variants, breadcrumb names, og/twitter tags and the JSON-LD graph.
 */

export const SITE = 'https://bravoapp.ai';
const ORG = `${SITE}/#organization`;
const BLOG = `${SITE}/blog/#blog`;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Long <meta> tags wrap onto three lines, matching how these files were written
   by hand. Purely cosmetic, but it keeps generated-vs-previous diffs limited to
   real changes instead of a reflow of every long line. */
const WRAP_AT = 104;
function meta(attr, name, content) {
  const one = `    <meta ${attr}="${name}" content="${esc(content)}" />`;
  if (one.length <= WRAP_AT) return one;
  return `    <meta\n      ${attr}="${name}"\n      content="${esc(content)}"\n    />`;
}

/*
 * JSON with short objects kept on one line, which is how these graphs were
 * written by hand — it keeps breadcrumb items and {"@id": …} refs readable and
 * makes review diffs small. Built structurally rather than by rewriting
 * JSON.stringify output, so a string containing `","` can't be mangled.
 */
const defined = (obj) => Object.entries(obj).filter(([, v]) => v !== undefined);

function inlineOf(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(inlineOf).join(', ')}]`;
  const entries = defined(value);
  if (!entries.length) return '{}';
  return `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${inlineOf(v)}`).join(', ')} }`;
}

/*
 * Small objects stay on one line, larger ones expand — which is the shape these
 * graphs were hand-written in: a breadcrumb ListItem or an {"@id": …} ref reads
 * fine inline, while a BlogPosting, a Place or a PostalAddress does not. Keyed
 * on shape rather than character count so it doesn't hinge on how long a
 * particular street name happens to be.
 */
const INLINE_MAX_KEYS = 4;
const INLINE_MAX_CHARS = 150;

function jsonld(value, indent = 0) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  const inline = inlineOf(value);
  const small = Array.isArray(value) || defined(value).length <= INLINE_MAX_KEYS;
  if (small && inline.length <= INLINE_MAX_CHARS) return inline;
  const pad = ' '.repeat(indent + 2);
  const close = ' '.repeat(indent);
  if (Array.isArray(value)) {
    return `[\n${value.map((v) => pad + jsonld(v, indent + 2)).join(',\n')}\n${close}]`;
  }
  return `{\n${defined(value)
    .map(([k, v]) => `${pad}${JSON.stringify(k)}: ${jsonld(v, indent + 2)}`)
    .join(',\n')}\n${close}}`;
}

const HEAD_BOILERPLATE = `    <meta name="theme-color" content="#ffffff" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/favicon.svg" />`;

const FONTS = `    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Boldonse&family=Inter:opsz,wght@14..32,300..900&display=swap" rel="stylesheet" />`;

const script = (graph) => {
  const body = jsonld({ '@context': 'https://schema.org', '@graph': graph })
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n');
  return `    <script type="application/ld+json">\n${body}\n    </script>`;
};

function venueNode(post) {
  const v = post.venueData;
  if (!v) return null;
  const s = v.schema ?? {};
  return {
    '@type': s.type ?? 'Place',
    '@id': `${SITE}/blog/${post.slug}/#venue`,
    name: v.name,
    url: v.siteUrl,
    servesCuisine: s.servesCuisine,
    openingHours: s.openingHours,
    address: {
      '@type': 'PostalAddress',
      streetAddress: v.street,
      addressLocality: v.locality,
      addressRegion: s.region,
      addressCountry: s.country,
    },
  };
}

export function emitPostHtml(post) {
  const url = `${SITE}/blog/${post.slug}/`;
  const seo = post.frontmatter.seo ?? {};
  const pageTitle = seo.title ?? `${post.frontmatter.title} — Bravo Blog`;
  const socialTitle = seo.title ?? post.frontmatter.title;
  const social = seo.socialDescription ?? seo.description;
  const ogImage = `${SITE}${post.ogImage}`;
  const venue = venueNode(post);
  const venueRef = venue ? { '@id': venue['@id'] } : undefined;

  const graph = [
    {
      '@type': 'BlogPosting',
      '@id': `${url}#post`,
      headline: post.frontmatter.title,
      alternativeHeadline: seo.title,
      description: social,
      url,
      datePublished: post.date,
      dateModified: post.date,
      inLanguage: 'en',
      image: ogImage,
      author: { '@id': ORG },
      publisher: { '@id': ORG },
      isPartOf: { '@id': BLOG },
      articleSection: post.frontmatter.category,
      about: post.frontmatter.venueIsSubject ? venueRef : undefined,
      contentLocation: venueRef,
      mainEntityOfPage: url,
    },
    venue,
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.frontmatter.category,
          item: `${SITE}/blog/?category=${categorySlug(post.frontmatter.category)}`,
        },
        { '@type': 'ListItem', position: 4, name: post.crumb, item: url },
      ],
    },
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${esc(pageTitle)}</title>
${meta('name', 'description', seo.description)}
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="${post.frontmatter.draft ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />
${HEAD_BOILERPLATE}

    <!-- article previews carry the post's own hero, not the site card -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Bravo" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:url" content="${url}" />
${meta('property', 'og:title', socialTitle)}
${meta('property', 'og:description', social)}
    <meta property="og:image" content="${ogImage}" />
${meta('property', 'og:image:alt', seo.ogImageAlt ?? post.frontmatter.heroAlt)}
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="article:published_time" content="${post.date}" />
    <meta property="article:section" content="${esc(post.frontmatter.category)}" />
    <meta name="twitter:card" content="summary_large_image" />
${meta('name', 'twitter:title', socialTitle)}
${meta('name', 'twitter:description', social)}
    <meta name="twitter:image" content="${ogImage}" />

${FONTS}

${script(graph)}
  </head>
  <body>
    <div id="root" data-post="${post.slug}"></div>
    <script type="module" src="/src/blog-post.jsx"></script>
  </body>
</html>
`;
}

export function emitIndexHtml(posts) {
  /* drafts are noindex, so listing them in the Blog graph would advertise pages
     we're asking not to be indexed */
  const published = posts.filter((p) => !p.frontmatter.draft);

  const graph = [
    {
      '@type': 'Blog',
      '@id': BLOG,
      name: 'Bravo Blog',
      description: 'What’s happening in Bravo',
      url: `${SITE}/blog/`,
      inLanguage: 'en',
      publisher: { '@id': ORG },
      blogPost: published.map((p) => ({
        '@type': 'BlogPosting',
        '@id': `${SITE}/blog/${p.slug}/#post`,
        headline: p.frontmatter.title,
        url: `${SITE}/blog/${p.slug}/`,
        datePublished: p.date,
        image: `${SITE}${p.ogImage}`,
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
      ],
    },
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>Bravo Blog — What’s happening in Bravo</title>
    <meta
      name="description"
      content="News, events and stories from Bravo — the app that turns everyday dining into rewards across 500+ restaurants."
    />
    <link rel="canonical" href="${SITE}/blog/" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
${HEAD_BOILERPLATE}

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Bravo" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:url" content="${SITE}/blog/" />
    <meta property="og:title" content="Bravo Blog — What’s happening in Bravo" />
    <meta
      property="og:description"
      content="News, events and stories from Bravo — the app that turns everyday dining into rewards."
    />
    <meta property="og:image" content="${SITE}/og-image.jpg" />
    <meta property="og:image:alt" content="Friends around a table at a restaurant, with the Bravo wordmark" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Bravo Blog — What’s happening in Bravo" />
    <meta
      name="twitter:description"
      content="News, events and stories from Bravo — the app that turns everyday dining into rewards."
    />
    <meta name="twitter:image" content="${SITE}/og-image.jpg" />

${FONTS}

${script(graph)}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/blog-index.jsx"></script>
  </body>
</html>
`;
}
