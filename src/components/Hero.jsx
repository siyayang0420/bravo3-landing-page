import InPhoneApp from './InPhoneApp.jsx';
import PhoneMockup from './PhoneMockup.jsx';
import badgeAppStore from '../assets/badge-appstore.svg';
import badgeGooglePlay from '../assets/badge-googleplay.svg';
import { APP_STORE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './Hero.css';

export default function Hero() {
  return (
    <header className="hero">
      <div className="hero__copy">
        <h1 className="display hero__title">The Place<br />Where Dining<br />Begins</h1>
        <p className="hero__lede">
          One app for the craving, the choice, the table, the photo and the bill.
          Everything that happens before food. Everything worth remembering after.
        </p>
        <div className="hero__badges">
          <a className="hero__badge" href={APP_STORE_URL} {...EXTERNAL_LINK} aria-label="Download on the App Store">
            <img src={badgeAppStore} alt="" />
          </a>
          <a className="hero__badge" href={APP_STORE_URL} {...EXTERNAL_LINK} aria-label="Get it on Google Play">
            <img src={badgeGooglePlay} alt="" />
          </a>
        </div>
      </div>

      <PhoneMockup className="hero__phone" aria-label="Bravo app on iPhone">
        <InPhoneApp />
      </PhoneMockup>
    </header>
  );
}
