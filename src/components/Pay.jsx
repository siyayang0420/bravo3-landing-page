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
      {/* Copy comes first in source so it stays on top once the section stacks,
          and so the CTA is reached before the phone's interactive coin. The
          desktop mirror (phone on the left) is done with row-reverse in CSS. */}
      <div className="pay__inner">
        <div className="pay__copy">
          <h2 className="display pay__title">Every Meal Gives Something Back</h2>
          <p className="pay__lede">Scan, pay, and keep the night going. Rewards happen automatically in the background.</p>
          <Button size="reg" className="pay__cta" href={APP_STORE_URL} {...EXTERNAL_LINK}>Get Started</Button>
        </div>

        <PhoneMockup className="pay__phone">
          <PayPhoneApp />
        </PhoneMockup>
      </div>
    </section>
  );
}
