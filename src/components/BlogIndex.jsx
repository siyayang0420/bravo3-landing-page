import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import { POSTS, postUrl } from '../lib/posts.js';
import './Blog.css';

/* Blog index — Figma node 5852:14661. */
export default function BlogIndex() {
  return (
    <>
      <main className="page blog">
        <Nav markHref="/" />

        <header className="blog__head">
          <h1 className="display blog__title">Bravo Blog</h1>
          <p className="blog__lede">What’s happening in Bravo</p>
        </header>

        <ul className="blog__list">
          {POSTS.map((post) => (
            <li key={post.slug}>
              <a className="blog-card" href={postUrl(post.slug)}>
                <img
                  className="blog-card__img"
                  src={post.hero}
                  alt={post.heroAlt}
                  width="484"
                  height="363"
                  decoding="async"
                />
                <time className="blog-card__date" dateTime={post.date}>{post.dateLabel}</time>
                <h2 className="blog-card__title">{post.title}</h2>
              </a>
            </li>
          ))}
        </ul>
      </main>

      <Footer />
    </>
  );
}
