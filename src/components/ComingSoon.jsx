import { useState } from 'react';
import Nav from './Nav.jsx';
import Button from './Button.jsx';
import CursorTrail from './CursorTrail.jsx';
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
 * Same-origin, so the browser never learns a database host exists: nginx
 * proxies this path to the waitlist service (see deploy/nginx-waitlist.conf),
 * which is the only thing holding the Neon credentials.
 */
const SIGNUP_ENDPOINT = '/api/waitlist';

/*
 * One message per outcome. Kept here rather than inline so the copy is
 * reviewable in one place, and so the render stays a lookup.
 */
const MESSAGES = {
  success: 'You’re in. See you at the table.',
  duplicate: 'You’re already on the list.',
  invalid: 'Enter a valid email.',
  error: 'Something went wrong. Try again.',
};

/* Matches the API's rule, so an obviously-bad address is caught without a
   round trip. The server re-validates — this is a courtesy, not the guard. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  /* 'idle' | 'loading' | 'success' | 'duplicate' | 'invalid' | 'error' */
  const [status, setStatus] = useState('idle');

  const busy = status === 'loading';
  /* Both are terminal: the form is replaced by its result rather than inviting
     the same address to be sent again. */
  const done = status === 'success' || status === 'duplicate';

  const onSubmit = async (e) => {
    e.preventDefault();
    /* Guards the Enter key as well as the click, and makes a double-submit a
       no-op even before the button's disabled attribute applies. */
    if (busy || done) return;

    const value = email.trim();
    if (!EMAIL_SHAPE.test(value) || value.length > 254) {
      setStatus('invalid');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });

      if (res.status === 400) return setStatus('invalid');
      if (!res.ok) return setStatus('error');

      const data = await res.json();
      setStatus(data.status === 'duplicate' ? 'duplicate' : 'success');
    } catch {
      /* Offline, DNS failure, request blocked — all the same to the visitor. */
      setStatus('error');
    }
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
            disabled={busy || done}
            /* points a screen reader at the message when the address is refused */
            aria-invalid={status === 'invalid' || undefined}
            aria-describedby="coming-soon-status"
          />
          <Button type="submit" className="coming-soon__submit" disabled={busy || done}>
            {busy ? 'Adding…' : 'Count me in'}
          </Button>
        </div>

        {/*
          * Always in the DOM, so assistive tech is already watching it when the
          * text arrives — a region inserted at the same moment as its own
          * content is often missed. `polite` waits for a pause rather than
          * cutting across what is being read.
          */}
        <p
          className={`coming-soon__status${status === 'invalid' || status === 'error' ? ' is-error' : ''}`}
          id="coming-soon-status"
          role="status"
          aria-live="polite"
        >
          {MESSAGES[status] ?? ''}
        </p>
      </form>

      <div className="coming-soon__spacer" aria-hidden="true" />

      {/* mounted here and nowhere else, so the trail is unique to this page.
          `quiet` keeps it off the header and the signup block — tiles landing
          over the field, or over the wordmark and menu, would sit between the
          visitor and the things the page is asking them to use. */}
      <CursorTrail quiet=".nav, .coming-soon__signup" />
    </main>
  );
}
