import BravoMark from './BravoMark.jsx';
import Button from './Button.jsx';
import { APP_STORE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './Nav.css';

/*
 * Shared header — identical on every page. Figma draws the blog's CTA outlined
 * (5852:14719), but one consistent solid button across the site was preferred
 * to two treatments of the same action.
 *
 * `markHref` links the wordmark home; the landing page omits it, since the
 * wordmark linking to the page you are already on is just noise.
 */
export default function Nav({ markHref }) {
  return (
    <nav className="nav">
      {markHref
        ? (
          <a className="nav__home" href={markHref} aria-label="Bravo — home">
            <BravoMark className="nav__mark" />
          </a>
        )
        : <BravoMark className="nav__mark" />}

      <div className="nav__right">
        <a className="nav__link" href="/blog/">Blog</a>
        <Button size="mid" href={APP_STORE_URL} {...EXTERNAL_LINK}>
          Get the App
        </Button>
      </div>
    </nav>
  );
}
