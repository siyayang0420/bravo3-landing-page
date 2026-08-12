import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import chevron from '../assets/blog/chevron.svg';
import { WREN_CAFE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './Blog.css';

/* Vol. 3's copy carries an inline link, so it lives here as markup rather than
   in the plain-string `body` that data-driven posts use. */
const SessionsVol3Body = () => (
  <>
    <p>
      An inspiring evening exploring how AI is moving beyond chat and into
      real-world commerce—from discovery and booking to ordering, paying,
      and earning.
    </p>
    <p>
      At Wren Cafe, we didn’t just talk about the future of agentic
      commerce—we experienced it firsthand with Bravo AI across a network
      of 500+ restaurants.
    </p>
    <p>
      Special thanks to{' '}
      <a href={WREN_CAFE_URL} {...EXTERNAL_LINK}>WREN CAFÉ</a>{' '}
      for hosting us in their beautiful Yaletown space and keeping
      everyone fuelled with amazing coffee and food.
    </p>
    <p>From prompt to plate—for real. See you at the next Bravo AI Session!</p>
  </>
);

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

          <div className="post__body">
            <h1 className="display post__title">{post.title}</h1>
            <time className="post__date" dateTime={post.date}>{post.dateLabel}</time>

            {post.body
              ? post.body.map((text) => <p key={text}>{text}</p>)
              : <SessionsVol3Body />}
          </div>

          {post.gallery.map(({ src, alt, aspect, focus }) => (
            <img
              key={src}
              className="post__figure"
              src={src}
              alt={alt}
              style={{ aspectRatio: aspect, objectPosition: focus }}
              loading="lazy"
              decoding="async"
            />
          ))}
        </article>
      </main>

      <Footer />
    </>
  );
}
