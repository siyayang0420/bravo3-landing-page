import Button from './Button.jsx';
import Orb from './Orb.jsx';
/* Same three lucide glyphs the in-phone AI screen already ships. */
import iconPlus from '../assets/app/plus.svg';
import iconMic from '../assets/app/mic.svg';
import iconAudioLines from '../assets/app/audio.svg';
/* Same file the in-phone answer uses — they morph into one another on scroll. */
import face1 from '../assets/app/ans-emma.png';
import face2 from '../assets/ask-face-2.png';
import face3 from '../assets/ask-face-3.png';
import { APP_STORE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './Ask.css';

/*
 * "Ask about things you are wondering" — Figma node 5798:5381.
 * The right-hand stage keeps its exact Figma placement, expressed as % of the
 * 708 × 506 art box, so faces and bubbles hold their arrangement at any size.
 * [left%, top%, width%, height%]
 */
const FACES = [
  { src: face1, alt: '', pos: [61.02, 0.76, 18.08, 33.78], dur: '11s' },
  { src: face3, alt: '', pos: [20.06, 32.37, 18.08, 33.78], dur: '13s' },
  { src: face2, alt: '', pos: [80.79, 64.04, 19.21, 35.96], dur: '9s' },
];

const BUBBLES = [
  { text: 'What my friends recommended', pos: [0, 0], dur: '12s' },
  { text: 'Places my friends rate highest', pos: [41.67, 43.28], dur: '10s' },
  { text: 'Where Emma dined last night', pos: [28.11, 77.46], dur: '14s' },
];

export default function Ask() {
  return (
    <section className="section-screen ask" id="ask">
      {/* Figma has a 170 layer-blur orb behind the copy (≈85px CSS radius).
          We render the live WebGL orb instead of the flattened export so it
          keeps moving. */}
      <Orb className="ask__orb" speed={0.6} />

      <div className="ask__inner">
        <div className="ask__copy">
          {/* Same rotating cyan → yellow → red border as the in-phone prompt box. */}
          <div className="ask__pbox">
            <form className="ask__pbox-inner" onSubmit={(e) => e.preventDefault()}>
              <button className="ask__icon-btn" type="button" aria-label="Add context">
                <img src={iconPlus} alt="" />
              </button>
              <input
                className="ask__input"
                type="text"
                placeholder="Ask or search anything..."
                aria-label="Ask or search anything"
              />
              <img className="ask__mic" src={iconMic} alt="" />
              <button className="ask__icon-btn ask__icon-btn--dark" type="submit" aria-label="Ask Bravo">
                <img src={iconAudioLines} alt="" />
              </button>
            </form>
          </div>

          <h2 className="display section-title ask__title">Ask What Only Your Circle Knows</h2>

          <p className="section-lede ask__lede">
            From hidden gems your friends swear by to where everyone went last Friday night, Bravo combines AI with real dining experiences to help you decide with confidence.
          </p>

          <Button size="reg" className="ask__cta" href={APP_STORE_URL} {...EXTERNAL_LINK}>Get Started</Button>
        </div>

        <div className="ask__stage" aria-hidden="true">
          {FACES.map(({ src, alt, pos: [l, t, w, h], dur }, i) => (
            <span
              key={i}
              className="ask__face float"
              style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`, '--dur': dur }}
            >
              <img src={src} alt={alt} />
            </span>
          ))}
          {BUBBLES.map(({ text, pos: [l, t], dur }, i) => (
            <span
              key={i}
              className="ask__bubble float-alt"
              style={{ left: `${l}%`, top: `${t}%`, '--dur': dur }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
