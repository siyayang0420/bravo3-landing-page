import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fetchVenueReviews } from '../lib/reviews.js';
import { EXTERNAL_LINK } from '../lib/links.js';
import chevron from '../assets/blog/chevron.svg';
/* The design's exported wordmark, downscaled to 124x42 for a 62x20 box (2x).
   PNG rather than WebP because it carries alpha and `sips` — the only image tool
   this repo shells out to — cannot write WebP. At 7KB that is not worth a new
   dependency. See the note on Google's brand assets in the handover. */
import googleLogo from '../assets/blog/google-logo.png';
import './VenueReviews.css';

/*
 * Venue reviews — Figma node 5984:17197.
 *
 * Belongs to the article template, not to any one article: it is driven entirely
 * by the post's existing `venue:` relationship, so every restaurant post gets it
 * for free and no post's Markdown mentions reviews. A venue with no reviews
 * renders nothing at all — not an empty heading.
 *
 * The data is still a fixture. See src/lib/reviews.js; this file is written
 * against the accessor, so swapping in Google Places does not touch it.
 */

/*
 * The design ships this as two exported SVGs whose paths are byte-identical and
 * whose fills differ (#FEE160 on three rows, #202020 on the other two — an
 * inconsistency in the design rather than two glyphs). One path that inherits
 * `currentColor` is therefore the honest representation, and it is the pattern
 * <BravoMark> already sets for a design that exports the same shape twice.
 *
 * The 20px box with an inset glyph is Figma's own geometry, and it is what puts
 * the ~3px of air between adjacent stars without a gap on the row.
 */
const Star = ({ filled }) => (
  <span className={`vreviews__star${filled ? '' : ' vreviews__star--empty'}`} aria-hidden="true">
    <svg viewBox="0 0 16.6682 15.8934" fill="currentColor" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <path d="M7.939 0.245745C7.97552 0.171962 8.03193 0.109855 8.10188 0.0664324C8.17182 0.0230097 8.25251 0 8.33483 0C8.41716 0 8.49785 0.0230097 8.56779 0.0664324C8.63773 0.109855 8.69415 0.171962 8.73067 0.245745L10.6557 4.14491C10.7825 4.40155 10.9697 4.62358 11.2012 4.79196C11.4327 4.96033 11.7016 5.07001 11.9848 5.11158L16.2898 5.74158C16.3714 5.7534 16.448 5.7878 16.5111 5.84091C16.5741 5.89402 16.621 5.9637 16.6465 6.04208C16.672 6.12047 16.6751 6.20442 16.6553 6.28444C16.6356 6.36447 16.5938 6.43737 16.5348 6.49491L13.4215 9.52658C13.2162 9.72666 13.0626 9.97365 12.9739 10.2463C12.8852 10.5189 12.8641 10.809 12.9123 11.0916L13.6473 15.3749C13.6617 15.4564 13.6529 15.5404 13.6219 15.6171C13.5909 15.6939 13.5389 15.7604 13.472 15.8091C13.405 15.8577 13.3256 15.8866 13.2431 15.8923C13.1605 15.8981 13.0779 15.8805 13.0048 15.8416L9.1565 13.8182C8.90293 13.6851 8.62082 13.6155 8.33442 13.6155C8.04802 13.6155 7.7659 13.6851 7.51233 13.8182L3.66483 15.8416C3.59178 15.8803 3.50933 15.8977 3.42688 15.8918C3.34442 15.8859 3.26527 15.857 3.19841 15.8084C3.13156 15.7598 3.07969 15.6934 3.04871 15.6168C3.01773 15.5401 3.00888 15.4563 3.02317 15.3749L3.75733 11.0924C3.80583 10.8097 3.78482 10.5194 3.69611 10.2466C3.60741 9.97382 3.45367 9.72671 3.24817 9.52658L0.134833 6.49574C0.0753279 6.43827 0.0331608 6.36524 0.0131351 6.28497C-0.00689053 6.2047 -0.00396948 6.12043 0.0215654 6.04174C0.0471003 5.96305 0.0942223 5.89311 0.157564 5.8399C0.220905 5.78668 0.297919 5.75233 0.379833 5.74074L4.684 5.11158C4.96755 5.07033 5.23682 4.96079 5.46865 4.7924C5.70048 4.62401 5.88792 4.4018 6.01483 4.14491L7.939 0.245745Z" />
    </svg>
  </span>
);

const MAX_RATING = 5;

/* One labelled group rather than five images: a screen reader should hear the
   score, not "star star star star star". */
const Rating = ({ value }) => {
  const filled = Math.round(Math.min(Math.max(value ?? 0, 0), MAX_RATING));
  return (
    <span className="vreviews__stars" role="img" aria-label={`Rated ${filled} out of ${MAX_RATING}`}>
      {Array.from({ length: MAX_RATING }, (_, i) => <Star key={i} filled={i < filled} />)}
    </span>
  );
};

/*
 * The design draws every avatar as a plain #D9D9D9 disc, so the placeholder is
 * not a fallback bolted on — it IS the design, and a real photo is the variation.
 * Decorative either way: the name sits right beside it in text.
 */
const Avatar = ({ src, name }) => {
  /*
   * A Google avatar that fails to load falls back to the same disc a reviewer
   * with no photo gets, rather than a broken-image box. These are third-party
   * URLs on googleusercontent.com: they can 404, be rate-limited, or be blocked
   * by a content blocker, none of which we control and none of which should
   * show the reader a torn-page icon inside the design.
   */
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <span className="vreviews__avatar vreviews__avatar--blank" aria-hidden="true" data-name={name} />;
  }
  return (
    <img
      className="vreviews__avatar"
      src={src}
      alt=""
      width="42"
      height="42"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      /* Google serves these without CORS headers; no-referrer avoids the
         hotlink checks some Google image hosts apply, and we need no pixel
         access — it is a plain decorative <img>. */
      referrerPolicy="no-referrer"
    />
  );
};

/*
 * Desktop arrows — Figma node 5988:17382.
 *
 * Deliberately not a carousel library and not a stateful "current slide": the
 * rail is a real scroll container, and these only nudge its scrollLeft. Touch
 * swipe, trackpad, keyboard and the scrollbar all keep working untouched, and
 * the buttons are hidden below 1100px where swiping is the natural gesture
 * (CSS handles that — there is no JS breakpoint to drift out of sync).
 */
function useRailArrows(railRef, enabled) {
  /* Both start hidden. The first measurement runs before paint, so a rail that
     cannot scroll never flashes a pair of dead arrows. */
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    /* 1px of slack: sub-pixel layout means scrollLeft rarely lands exactly on
       0 or on max, and without it the arrow at the far end never fades. */
    setEdges({ atStart: rail.scrollLeft <= 1, atEnd: rail.scrollLeft >= max - 1 });
  }, [railRef]);

  /* Layout effect, not effect: it measures the rail and corrects the arrows
     BEFORE the browser paints, so the right arrow is simply there on load
     rather than fading in a frame later. */
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail || !enabled) return;
    measure();
    rail.addEventListener('scroll', measure, { passive: true });
    /* the rail's own size changes with the viewport, and its content's with
       the fonts — ResizeObserver catches both, where a resize listener would
       only catch the first */
    const ro = new ResizeObserver(measure);
    ro.observe(rail);
    return () => {
      rail.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, [railRef, enabled, measure]);

  /* One card plus its gap, read from the DOM rather than hard-coded, so the
     step stays right when --review-w changes at a breakpoint. */
  const nudge = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector('.vreviews__card');
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    const step = card ? card.getBoundingClientRect().width + gap : rail.clientWidth;
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return { ...edges, nudge };
}

const Arrow = ({ direction, hidden, onClick }) => (
  <button
    type="button"
    className={`vreviews__arrow vreviews__arrow--${direction}${hidden ? ' is-hidden' : ''}`}
    onClick={onClick}
    /* Collapsed in CSS rather than unmounted, so its width and margin can
       animate open instead of the control popping in. aria-hidden + -1 keep the
       collapsed button out of the tab order and off the accessibility tree. */
    aria-hidden={hidden || undefined}
    tabIndex={hidden ? -1 : undefined}
    aria-label={direction === 'prev' ? 'Previous reviews' : 'More reviews'}
  >
    <img src={chevron} alt="" aria-hidden="true" />
  </button>
);

export default function VenueReviews({ venue }) {
  /*
   * Fetched rather than imported: review content is never stored in this repo,
   * so it cannot be part of the build. Failures and "no reviews" both arrive as
   * an empty array, which renders nothing — the article is unaffected either
   * way, and a reader never sees an API error.
   */
  const [reviews, setReviews] = useState([]);
  const venueKey = venue?.key;

  useEffect(() => {
    if (!venueKey) return undefined;
    /* aborted on unmount so a late response can't set state on a gone component */
    const stop = new AbortController();
    fetchVenueReviews(venueKey, { signal: stop.signal }).then(setReviews);
    return () => stop.abort();
  }, [venueKey]);

  const railRef = useRef(null);
  const hasReviews = reviews.length > 0;
  const { atStart, atEnd, nudge } = useRailArrows(railRef, hasReviews);

  /* No reviews, no section — not a heading over an empty rail. Also the state
     while the request is in flight, so nothing flashes before it resolves. */
  if (!hasReviews) return null;

  const label = `What people are saying on Google Maps about ${venue.name}`;

  return (
    /*
     * A labelled region rather than a heading: this block sits ABOVE the
     * article's <h1>, so an <h2> here would put a level-2 heading before the
     * page's only level-1 and break the document outline. The region label
     * carries the same words to assistive tech.
     */
    <section className="vreviews" aria-label={label} data-review-source="google-places">
      <p className="vreviews__title">
        What people are saying on{' '}
        <img className="vreviews__google" src={googleLogo} alt="Google" width="62" height="20" loading="lazy" decoding="async" />
      </p>

      {/* The arrows are siblings of the rail, not children — a control inside a
          scroll container would scroll away with the content. */}
      <div className="vreviews__viewport">
        <Arrow direction="prev" hidden={atStart} onClick={() => nudge(-1)} />

        {/*
          * tabIndex makes the rail reachable by keyboard: a scroll container that
          * contains no focusable elements cannot otherwise be scrolled without a
          * mouse, which is a genuine WCAG 2.1.1 failure rather than a nicety.
          * It stays even with the arrows, which are desktop-only.
          * <ul> so the count is announced; the label says it scrolls.
          */}
        <ul
          className="vreviews__rail"
          ref={railRef}
          tabIndex={0}
          aria-label={`${reviews.length} reviews — scrollable`}
        >
          {reviews.map((review, i) => (
            <li className="vreviews__card" key={review.sourceUrl ?? `${review.authorName}-${i}`}>
              <div className="vreviews__who">
                <Avatar src={review.authorPhoto} name={review.authorName} />
                <div className="vreviews__ident">
                  {/* Google requires the author's name AND a link to their
                      profile. Styled to sit exactly where the plain name did. */}
                  {review.authorUrl ? (
                    <a className="vreviews__author" href={review.authorUrl} {...EXTERNAL_LINK}>
                      {review.authorName}
                    </a>
                  ) : (
                    <span className="vreviews__author">{review.authorName}</span>
                  )}
                  <Rating value={review.rating} />
                </div>
              </div>

              {/*
                * The text is clamped to three lines, and Google requires that
                * readers can always reach the source review — so the whole
                * quote is the link that opens it on Maps. That satisfies the
                * requirement and answers the truncation in the same gesture.
                * `relativeTime` is Google's own wording, kept verbatim.
                */}
              {review.sourceUrl ? (
                <a className="vreviews__quote" href={review.sourceUrl} {...EXTERNAL_LINK}>
                  <span className="vreviews__text">{review.text}</span>
                  <span className="vreviews__meta">
                    {review.relativeTime}
                    <span className="vreviews__more"> · Read on Google Maps</span>
                  </span>
                </a>
              ) : (
                <p className="vreviews__text">{review.text}</p>
              )}
            </li>
          ))}
        </ul>

        <Arrow direction="next" hidden={atEnd} onClick={() => nudge(1)} />
      </div>

      {/*
        * Required: "Include a clear notice that describes how reviews are being
        * ordered and filtered." Google returns them by relevance and we render
        * that order untouched, so the notice is one muted line rather than a
        * compliance block — the smallest thing that states the fact.
        */}
      <p className="vreviews__note">Reviews from Google Maps, ordered by relevance.</p>
    </section>
  );
}
