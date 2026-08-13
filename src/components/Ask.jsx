import { useEffect, useRef, useState } from 'react';
import Button from './Button.jsx';
import AskStage2 from './AskStage2.jsx';
import { useSceneProgress, track, smooth } from '../lib/useSceneProgress.js';
/* Same three lucide glyphs the in-phone AI screen already ships. */
import iconPlus from '../assets/app/plus.svg';
import iconMic from '../assets/app/mic.svg';
import iconAudioLines from '../assets/app/audio.svg';
/* Same file the in-phone answer uses — they morph into one another on scroll. */
import face1 from '../assets/app/ans-emma.webp';
import face2 from '../assets/ask-face-2.webp';
import face3 from '../assets/ask-face-3.webp';
import { APP_STORE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './Ask.css';

/*
 * "Ask about things you are wondering" — Figma nodes 5798:5381 (state 1) and
 * 5913:16878 (state 2). The right-hand stage keeps its exact Figma placement,
 * expressed as % of the 708 × 506 art box, so faces and bubbles hold their
 * arrangement at any size.
 * [left%, top%, width%, height%]
 */
const FACES = [
  { src: face1, pos: [61.02, 0.76, 18.08, 33.78], dur: '11s' },
  /* the shared one — it flies to state 2, so the slot itself stays invisible */
  { src: face3, pos: [20.06, 32.37, 18.08, 33.78], dur: '13s', shared: true },
  { src: face2, pos: [80.79, 64.04, 19.21, 35.96], dur: '9s' },
];

const BUBBLES = [
  { text: 'What my friends recommended', pos: [0, 0], dur: '12s' },
  { text: 'Places my friends rate highest', pos: [41.67, 43.28], dur: '10s' },
  { text: 'Where Emma dined last night', pos: [28.11, 77.46], dur: '14s' },
];

/* scene timeline */
const FADE1 = [0.10, 0.46]; // state 1 fades out
const MORPH = [0.10, 0.68]; // shared avatar travels
const FADE2 = [0.34, 0.72]; // state 2 fades in

export default function Ask() {
  const p = useSceneProgress('.ask-scene');
  const stageRef = useRef(null);
  const flyerRef = useRef(null);
  const [reduced, setReduced] = useState(false);

  const out = track(p, ...FADE1);
  const into = track(p, ...FADE2);
  const morph = smooth(track(p, ...MORPH));

  useEffect(() => {
    setReduced(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  }, []);

  /* Shared element: rather than animating either slot, lerp a flyer between the
     two slots' live rects. Both endpoints are laid out by the same responsive
     rules, so reading them each frame keeps the path correct at any size —
     and state 2 still has a real rect while it is faded out. */
  useEffect(() => {
    const stage = stageRef.current;
    const flyer = flyerRef.current;
    if (!stage || !flyer) return;
    const from = stage.querySelector('.ask__face--shared');
    const to = stage.querySelector('.a2__av-slot');
    if (!from || !to) return;

    const box = stage.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const mix = (x, y) => x + (y - x) * morph;

    flyer.style.left = `${mix(a.left, b.left) - box.left}px`;
    flyer.style.top = `${mix(a.top, b.top) - box.top}px`;
    flyer.style.width = `${mix(a.width, b.width)}px`;
    flyer.style.height = `${mix(a.height, b.height)}px`;
  }, [morph]);

  return (
    <div className="ask-scene">
      <div className="ask-sticky">
        <section className="section-screen ask" id="ask">
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

            <div className="ask__stage" ref={stageRef} aria-hidden="true">
              <div className="ask__state ask__state--1" style={{ opacity: 1 - out }}>
                {FACES.map(({ src, pos: [l, t, w, h], dur, shared }, i) => (
                  <span
                    key={i}
                    className={`ask__face float${shared ? ' ask__face--shared' : ''}`}
                    style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`, '--dur': dur }}
                  >
                    <img src={src} alt="" loading="lazy" decoding="async" />
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

              <div className="ask__state ask__state--2 a2" style={{ opacity: into }}>
                <AskStage2 />
              </div>

              {/* the one avatar both states share, drawn above both layers */}
              <span className="ask__shared" ref={flyerRef}>
                <img src={face3} alt="" loading="lazy" decoding="async" />
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
