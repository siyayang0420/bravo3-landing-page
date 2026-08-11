import BravoMark from './BravoMark.jsx';
import badgeAppStore from '../assets/badge-appstore.svg';
import badgeGooglePlay from '../assets/badge-googleplay.svg';
import iconInstagram from '../assets/footer/instagram.svg';
import iconLinkedin from '../assets/footer/linkedin.svg';
import iconFacebook from '../assets/footer/facebook.svg';
import {
  APP_STORE_URL, PLAY_STORE_URL, EXTERNAL_LINK,
  EGIFT_URL, EGIFT_BALANCE_URL, EGIFT_RESTAURANTS_URL,
  SOCIAL_URLS, storeUrlForDevice,
} from '../lib/links.js';
import './Footer.css';

const SOCIAL = [
  { name: 'Instagram', icon: iconInstagram, href: SOCIAL_URLS.instagram },
  { name: 'LinkedIn', icon: iconLinkedin, href: SOCIAL_URLS.linkedin },
  { name: 'Facebook', icon: iconFacebook, href: SOCIAL_URLS.facebook },
];

/*
 * Footer — Figma node 5821:7396. The page curves off on a white sheet; a wide,
 * heavily blurred brand gradient washes the bottom. Nav columns left, brand and
 * social right, copyright pinned to the bottom of the left column.
 */
export default function Footer() {
  /* Per the design's annotation: send Android to Play, everyone else to the
     App Store. The href stays a real App Store URL so crawlers and no-JS
     visitors get a working link; only Android is rewritten. */
  const onDownload = (e) => {
    const url = storeUrlForDevice();
    if (url !== APP_STORE_URL) {
      e.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  /* The href stays #top so it works without JS and survives being copied; this
     only upgrades the jump to a glide. Left alone under reduced motion, where
     the native jump is the correct behaviour. */
  const onHome = (e) => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <span className="footer__wash" aria-hidden="true" />
      <div className="footer__sheet" aria-hidden="true" />

      <div className="footer__inner">
        <div className="footer__nav">
          <nav className="footer__cols" aria-label="Footer">
            <div className="footer__col">
              <p className="footer__col-title">Bravo Rewards App</p>
              <a className="footer__link" href="#top" onClick={onHome}>Home</a>
              <a
                className="footer__link"
                href={APP_STORE_URL}
                onClick={onDownload}
                {...EXTERNAL_LINK}
              >
                Download
              </a>
            </div>

            <div className="footer__col">
              <a className="footer__col-title" href={EGIFT_URL} {...EXTERNAL_LINK}>
                Bravo eGift Card
              </a>
              <a className="footer__link" href={EGIFT_URL} {...EXTERNAL_LINK}>Shop eGift Card</a>
              <a className="footer__link" href={EGIFT_BALANCE_URL} {...EXTERNAL_LINK}>Check Balance</a>
              <a className="footer__link" href={EGIFT_RESTAURANTS_URL} {...EXTERNAL_LINK}>Partner Restaurants</a>
            </div>

            <div className="footer__col">
              <p className="footer__col-title">About</p>
              <a className="footer__link" href="/blog/">Blog</a>
            </div>
          </nav>

          <p className="footer__copy">© 2026 Bravo Technology Inc. All Rights Reserved.</p>
        </div>

        <div className="footer__brand">
          <div className="footer__brand-top">
            <BravoMark className="footer__mark" />
            <div className="footer__badges">
              <a className="footer__badge" href={APP_STORE_URL} {...EXTERNAL_LINK} aria-label="Download on the App Store">
                <img src={badgeAppStore} alt="" />
              </a>
              <a className="footer__badge" href={PLAY_STORE_URL} {...EXTERNAL_LINK} aria-label="Get it on Google Play">
                <img src={badgeGooglePlay} alt="" />
              </a>
            </div>
          </div>

          <div className="footer__social">
            {SOCIAL.map(({ name, icon, href }) => (
              <a
                key={name}
                className="footer__social-link"
                href={href}
                {...EXTERNAL_LINK}
                aria-label={`Bravo on ${name}`}
              >
                <img src={icon} alt="" loading="lazy" decoding="async" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
