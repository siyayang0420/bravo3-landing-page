import Button from './Button.jsx';
import PhoneMockup from './PhoneMockup.jsx';
import PayPhoneApp from './PayPhoneApp.jsx';
import { APP_STORE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './Pay.css';

/* "Pay that earns back" — Figma node 5815:6548, with the hero's phone mockup
   reused and the pay -> receipt sequence playing inside it. */
export default function Pay() {
  return (
    <section className="pay" id="get">
      <div className="pay__inner">
        <PhoneMockup className="pay__phone">
          <PayPhoneApp />
        </PhoneMockup>

        <div className="pay__copy">
          <h2 className="display pay__title">Every Meal Gives Something Back</h2>
          <p className="pay__lede">Scan, pay, and keep the night going. Rewards happen automatically in the background.</p>
          <Button size="reg" className="pay__cta" href={APP_STORE_URL} {...EXTERNAL_LINK}>Get Started</Button>
        </div>
      </div>
    </section>
  );
}
