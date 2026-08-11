import Button from './Button.jsx';
import PhoneMockup from './PhoneMockup.jsx';
import ChallengeScreen from './ChallengeScreen.jsx';
import { APP_STORE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './Friends.css';

/* "Bring friends. Earn together." — Figma node 5831:8541.
   Copy on the left, the shared phone mockup on the right. */
export default function Friends() {
  return (
    <section className="section-screen friends" id="friends">
      <div className="friends__inner">
        <div className="friends__copy">
          <h2 className="display section-title friends__title">Bring Friends<br />Earn Together</h2>
          <p className="section-lede friends__lede">
            Great meals deserve company. Bravo makes every dinner a little more
            rewarding when you experience it together.
          </p>
          <Button size="reg" className="friends__cta" href={APP_STORE_URL} {...EXTERNAL_LINK}>
            Start Inviting
          </Button>
        </div>

        <PhoneMockup className="friends__phone" aria-label="Bravo group challenge on iPhone">
          <ChallengeScreen />
        </PhoneMockup>
      </div>
    </section>
  );
}
