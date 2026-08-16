import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import BravoMark from './BravoMark.jsx';
import VenueReviews from './VenueReviews.jsx';
import chevron from '../assets/blog/chevron.svg';
import { EXTERNAL_LINK } from '../lib/links.js';
import { categoryUrl } from '../lib/posts.js';
import './Blog.css';

/* Venue credit — Figma node 5893:16639. The highlighted half links to the
   venue's page on Bravo; the plain line links to the venue's own site.
   <BravoMark> is the project's wordmark component rather than the design's
   exported SVG: same glyph, one asset, and it inherits the text colour. */
const Venue = ({ venue }) => (
  <aside className="venue" aria-label={`Venue: ${venue.name}`}>
    <img
      className="venue__logo"
      src={venue.logo}
      alt={`${venue.name} logo`}
      width="81"
      height="81"
      loading="lazy"
      decoding="async"
    />
    <div className="venue__meta">
      <p className="venue__name">
        {venue.name}
        <span className="venue__sep" aria-hidden="true">|</span>
        <mark className="venue__highlight">
          {/* Not every venue has a Bravo page yet; without a URL the credit is
              still true, so it renders as plain text rather than a dead link. */}
          {venue.bravoUrl ? (
            <a className="venue__link" href={venue.bravoUrl} {...EXTERNAL_LINK}>
              {venue.name} on <BravoMark className="venue__wordmark" />
            </a>
          ) : (
            <span className="venue__link">
              {venue.name} on <BravoMark className="venue__wordmark" />
            </span>
          )}
        </mark>
      </p>
      {/* every venue links its address to its own Google Maps location — the
          content build requires `mapUrl`, so this is never a plain address */}
      <p className="venue__line">
        <a className="venue__site" href={venue.mapUrl} {...EXTERNAL_LINK}>
          {venue.street}, {venue.locality}
        </a>
      </p>
      <p className="venue__line">
        <a className="venue__site" href={venue.siteUrl} {...EXTERNAL_LINK}>{venue.site}</a>
      </p>
    </div>
  </aside>
);

/* Inline nodes from the Markdown pipeline. The set is deliberately small — the
   content build throws on anything outside it rather than dropping it silently.
   External links get EXTERNAL_LINK so a post can't ship an unsafe target. */
const isExternal = (href) => !href.startsWith('/') && !href.startsWith('#');

const Inline = ({ nodes }) =>
  nodes.map((node, i) => {
    switch (node.t) {
      case 'text':
        return node.v;
      case 'br':
        return <br key={i} />;
      case 'em':
        return <em key={i}><Inline nodes={node.inline} /></em>;
      case 'strong':
        return <strong key={i}><Inline nodes={node.inline} /></strong>;
      case 'a':
        return (
          <a key={i} href={node.href} {...(isExternal(node.href) ? EXTERNAL_LINK : {})}>
            <Inline nodes={node.inline} />
          </a>
        );
      default:
        return null;
    }
  });

/* Blog post — Figma nodes 5852:14838 / 5870:16257. Content column is 980px; the
   hero and the gallery run its full width. */
export default function BlogPost({ post }) {
  return (
    <>
      <main className="page blog">
        <Nav markHref="/" />

        <article className="post">
          <nav className="post__crumbs" aria-label="Breadcrumb">
            <a className="post__crumb" href="/blog/">Bravo Blog</a>
            <img className="post__crumb-sep" src={chevron} alt="" aria-hidden="true" />
            <a className="post__crumb" href={categoryUrl(post.category)}>{post.category}</a>
            <img className="post__crumb-sep" src={chevron} alt="" aria-hidden="true" />
            <span className="post__crumb" aria-current="page">{post.crumb}</span>
          </nav>

          <img
            className="post__hero"
            src={post.hero}
            alt={post.heroAlt}
            width="980"
            height="599"
            decoding="async"
          />

          {/* Everything the venue block knows about the place, then the rule
              that opens the article. <VenueReviews> renders nothing when the
              venue has no reviews, so this group is unchanged for the venues
              and post types that never have any. */}
          {post.venue && (
            <>
              <Venue venue={post.venue} />
              <VenueReviews venue={post.venue} />
              <hr className="post__rule" />
            </>
          )}

          <div className="post__body">
            <h1 className="display post__title">{post.title}</h1>
            <time className="post__date" dateTime={post.date}>{post.dateLabel}</time>
          </div>

          {/* Prose and photos in the order the Markdown wrote them, as siblings
              of .post__body so the column's own 32px gap sets the rhythm between
              a paragraph and the photo after it. */}
          {post.content.map((block, i) => {
            if (block.type === 'figure') {
              return (
                <img
                  key={block.src}
                  className="post__figure"
                  src={block.src}
                  alt={block.alt}
                  width={block.width}
                  height={block.height}
                  style={{ aspectRatio: block.aspect, objectPosition: block.focus }}
                  loading="lazy"
                  decoding="async"
                />
              );
            }
            if (block.type === 'h2') {
              return <h2 className="post__subhead" key={i}><Inline nodes={block.inline} /></h2>;
            }
            return <p className="post__para" key={i}><Inline nodes={block.inline} /></p>;
          })}
        </article>
      </main>

      <Footer />
    </>
  );
}
