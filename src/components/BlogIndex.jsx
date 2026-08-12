import { useState } from 'react';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import { POSTS, CATEGORIES, postUrl } from '../lib/posts.js';
import './Blog.css';

/* "All" plus only those categories that actually have a post, so an empty
   filter can never be shown. */
const ALL = 'All';
const FILTERS = [ALL, ...CATEGORIES.filter((c) => POSTS.some((p) => p.category === c))];

/* Blog index — Figma node 5870:16211.
   Posts flow into rows of up to three, and the last (short) row stretches its
   cards to fill the width: 1 post = full-bleed, 2 = halves, 3 = thirds. Chunking
   into explicit flex rows is what makes the last-row stretch work — a normal
   grid would leave a short final row aligned left instead. */
const ROW_SIZE = 3;
const toRows = (items) => {
  const rows = [];
  for (let i = 0; i < items.length; i += ROW_SIZE) rows.push(items.slice(i, i + ROW_SIZE));
  return rows;
};

export default function BlogIndex() {
  const [filter, setFilter] = useState(ALL);
  const visible = filter === ALL ? POSTS : POSTS.filter((p) => p.category === filter);

  return (
    <>
      <main className="page blog">
        <Nav markHref="/" />

        <header className="blog__head">
          <h1 className="display blog__title">Bravo Blog</h1>
          <p className="blog__lede">What’s happening in Bravo</p>
        </header>

        {/* Filtering is client-side over an already-rendered list — every post
            stays in the HTML for crawlers, and each has its own indexed page. */}
        <div className="blog__filters" role="group" aria-label="Filter posts by category">
          {FILTERS.map((name) => (
            <button
              type="button"
              key={name}
              className="blog__filter"
              aria-pressed={filter === name}
              onClick={() => setFilter(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="blog__rows">
          {toRows(visible).map((row, ri) => (
            <div className="blog__row" key={ri}>
              {row.map((post, ci) => (
                <a className="blog-card" href={postUrl(post.slug)} key={post.slug}>
                  <img
                    className="blog-card__img"
                    src={post.hero}
                    alt={post.heroAlt}
                    /* the very first card is the blog page's LCP; the rest defer */
                    loading={ri === 0 && ci === 0 ? undefined : 'lazy'}
                    decoding="async"
                  />
                  <div className="blog-card__meta">
                    <time className="blog-card__date" dateTime={post.date}>{post.dateLabel}</time>
                    <h2 className="blog-card__title">{post.title}</h2>
                    <p className="blog-card__excerpt">{post.excerpt}</p>
                  </div>
                </a>
              ))}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
