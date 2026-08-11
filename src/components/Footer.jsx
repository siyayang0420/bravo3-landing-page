import BravoMark from './BravoMark.jsx';
import badgeAppStore from '../assets/badge-appstore.svg';
import badgeGooglePlay from '../assets/badge-googleplay.svg';
import qrRewards from '../assets/footer/qr-rewards.png';
import { APP_STORE_URL, PLAY_STORE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './Footer.css';

/* Footer — Figma node 5821:7396. The page ends on a white sheet with rounded
   bottom corners; a wide, heavily blurred brand gradient sits behind the
   sign-off and shows through the card's backdrop blur. */
export default function Footer() {
  return (
    <footer className="footer">
      <span className="footer__wash" aria-hidden="true" />
      <div className="footer__sheet" aria-hidden="true" />

      <div className="footer__inner">
        <BravoMark className="footer__mark" />

        <div className="footer__stack">
          <div className="footer__card">
            <p className="footer__card-title">Download Bravo Rewards App</p>
            <div className="footer__qr">
              <img
                src={qrRewards}
                alt="QR code to download the Bravo Rewards app"
                width="265"
                height="265"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div className="footer__badges">
            <a className="footer__badge" href={APP_STORE_URL} {...EXTERNAL_LINK} aria-label="Download on the App Store">
              <img src={badgeAppStore} alt="" />
            </a>
            <a className="footer__badge" href={PLAY_STORE_URL} {...EXTERNAL_LINK} aria-label="Get it on Google Play">
              <img src={badgeGooglePlay} alt="" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
