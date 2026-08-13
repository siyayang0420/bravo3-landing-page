import { useState } from 'react';
import Nav from './Nav.jsx';
import Button from './Button.jsx';
import './ComingSoon.css';

/*
 * Coming-soon page — Figma node 5937:16907 ("Pre Launch").
 *
 * The header is the site's shared <Nav>, minus the store button: there is
 * nothing to download yet, so the page would contradict itself.
 *
 * The design's fourth row (a second wordmark and CTA at the bottom) is set to
 * zero opacity in Figma — it exists to balance the column, not to be read. It
 * is reproduced here as an empty spacer rather than a hidden copy of the
 * header, so screen readers and crawlers don't meet invisible duplicate links.
 */

/*
 * TODO — no signup endpoint exists yet. Point this at the real one (or a form
 * service) and handle the response; until then the button deliberately does
 * nothing rather than pretending the address was stored.
 */
const SIGNUP_ENDPOINT = null;

export default function ComingSoon() {
  const [email, setEmail] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    if (!SIGNUP_ENDPOINT) return;
  };

  return (
    <main className="page coming-soon">
      <Nav markHref="/" cta={false} />

      <h1 className="display coming-soon__title">
        <span className="coming-soon__line">Bravo App 3.0</span>
        <span className="coming-soon__line">Coming Soon</span>
      </h1>

      <form className="coming-soon__signup" onSubmit={onSubmit} noValidate={false}>
        {/* the line above the field is the field's own label, so the control is
            named without adding a second piece of copy for a screen reader */}
        <label className="coming-soon__label" htmlFor="coming-soon-email">
          Be first in line for Bravo 3.0
        </label>
        <div className="coming-soon__row">
          <input
            id="coming-soon-email"
            className="coming-soon__input"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Your email here"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" className="coming-soon__submit">Count me in</Button>
        </div>
      </form>

      <div className="coming-soon__spacer" aria-hidden="true" />
    </main>
  );
}
