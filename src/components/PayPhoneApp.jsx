import { useEffect, useState } from 'react';
import { usePhoneScreenScale } from '../lib/usePhoneScreenScale.js';
import BravoCoin from './BravoCoin.jsx';
import cellular from '../assets/app/cellular.svg';
import wifi from '../assets/app/wifi.svg';
import battery from '../assets/app/battery.svg';
import qr from '../assets/pay/qr.png';
import back1 from '../assets/pay/back-1.svg';
import back2 from '../assets/pay/back-2.svg';
import scan from '../assets/pay/scan.svg';
import add1 from '../assets/pay/add-1.svg';
import add2 from '../assets/pay/add-2.svg';
import add3 from '../assets/pay/add-3.svg';
import moreBg from '../assets/pay/more-bg.svg';
import moreDots from '../assets/pay/more-dots.svg';
import help from '../assets/pay/help.svg';
import toggleKnob from '../assets/pay/toggle-knob.svg';
import pager from '../assets/pay/pager.svg';
import arrowRight from '../assets/pay/arrow-right.svg';
import checkCircle from '../assets/pay/check-circle.svg';
import checkMark from '../assets/pay/check-mark.svg';
import './PayPhoneApp.css';

const DESIGN_W = 393;   // Figma screen frame (5815:6640 / 5821:7179)
const HOLD_MS = 800;    // QR screen holds this long, then the receipt lands

function StatusBar() {
  return (
    <div className="pay-status">
      <span className="pay-status__time">9:41</span>
      <span className="pay-status__levels">
        <img src={cellular} alt="" style={{ width: 19.2, height: 12.226 }} />
        <img src={wifi} alt="" style={{ width: 17.142, height: 12.328 }} />
        <img src={battery} alt="" style={{ width: 27.328, height: 13 }} />
      </span>
    </div>
  );
}

/* ---------- screen 1: Pay / QR (Figma 5815:6640) ---------- */
function QrScreen() {
  return (
    <div className="pay-scr">
      <StatusBar />

      {/* Composite icons keep their Figma fragments; the hairline strokes get an
          explicit 1.5px so a zero-height box can't collapse them. */}
      <span className="pay-scr__back">
        <img src={back1} alt="" />
        <img src={back2} alt="" />
      </span>
      <p className="pay-scr__title">Pay</p>
      <span className="pay-scr__tools">
        <img className="pay-scr__tool" src={scan} alt="" />
        <span className="pay-scr__tool pay-scr__add">
          <img src={add1} alt="" />
          <img src={add2} alt="" />
          <img src={add3} alt="" />
        </span>
      </span>

      {/* <p>, not a heading — see InPhoneApp: mockup chrome must stay out of
          the document outline */}
      <p className="pay-qr__h">Bravo balance</p>

      <div className="pay-qr__col">
        <div className="pay-qr__group">
          <div className="pay-qr__card">
            <div className="pay-qr__code">
              <img className="pay-qr__img" src={qr} alt="Payment QR code" />
              <span className="pay-qr__more">
                <img className="pay-qr__more-bg" src={moreBg} alt="" />
                <img className="pay-qr__more-dots" src={moreDots} alt="" />
              </span>
            </div>

            {/* present but transparent in the design — it holds the card's height */}
            <div className="pay-qr__offline">Offline payment processing...</div>

            <div className="pay-qr__controls">
              <div className="pay-qr__row">
                <span className="pay-qr__rowleft">
                  <img className="pay-qr__help" src={help} alt="" />
                  <span className="pay-qr__labels">
                    <span className="pay-qr__label">Redeem Cashback</span>
                    <span className="pay-qr__sub">Max $12.88</span>
                  </span>
                </span>
                <span className="pay-qr__toggle">
                  <img src={toggleKnob} alt="" />
                </span>
              </div>

              <div className="pay-qr__btns">
                <span className="pay-qr__btn pay-qr__btn--max">
                  <em>Max</em>
                  <b>$12.88</b>
                </span>
                <span className="pay-qr__btn pay-qr__btn--ghost">Customize</span>
              </div>
            </div>
          </div>

          <p className="pay-qr__cap">Show the code to servers</p>
        </div>

        <img className="pay-qr__pager" src={pager} alt="" />

        <div className="pay-qr__balance">
          <b className="pay-qr__amount">$128.00 Available</b>
          <span className="pay-qr__balrow">
            <span>Charge from balance</span>
            <span className="pay-qr__topup">Top-up<img src={arrowRight} alt="" /></span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- screen 2: Success (Figma 5821:7179) ---------- */
function SuccessScreen({ coinPlaying }) {
  return (
    <div className="pay-scr pay-scr--ok">
      <span className="pay-ok__wash" />
      <StatusBar />

      <span className="pay-ok__check">
        <img className="pay-ok__check-bg" src={checkCircle} alt="" />
        <img className="pay-ok__check-tick" src={checkMark} alt="" />
      </span>

      {/* <p className="pay-ok__was">$110.50</p> */}
      <p className="pay-ok__now">$97.62</p>
      <p className="pay-ok__title">Payment successful</p>
      <p className="pay-ok__link">View order details</p>

      <BravoCoin className="pay-ok__coin" play={coinPlaying} />
    </div>
  );
}

export default function PayPhoneApp() {
  const { ref: screenRef, frameStyle } = usePhoneScreenScale(DESIGN_W, 852);
  const [paid, setPaid] = useState(false);

  /* Run the sequence when the phone is actually on screen, and rearm when it
     leaves — otherwise it would play out long before anyone scrolled here. */
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        clearTimeout(timer);
        if (e.isIntersecting) timer = setTimeout(() => setPaid(true), HOLD_MS);
        else setPaid(false);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); };
  }, [screenRef]);

  return (
    <div className="pay-ph phone-mockup__screen" ref={screenRef}>
      <div className={`pay-ph__layer${paid ? ' is-out' : ''}`} aria-hidden={paid}>
        <div className="pay-ph__frame" style={frameStyle}><QrScreen /></div>
      </div>
      <div className={`pay-ph__layer${paid ? '' : ' is-out'}`} aria-hidden={!paid}>
        <div className="pay-ph__frame" style={frameStyle}><SuccessScreen coinPlaying={paid} /></div>
      </div>
    </div>
  );
}
