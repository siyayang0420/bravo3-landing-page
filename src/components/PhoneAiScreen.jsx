import aiBack from '../assets/app/ai-back.svg';
import aiLogo from '../assets/app/ai-logo.svg';
import aiMenu from '../assets/app/ai-menu.svg';
import kbEmoji from '../assets/app/kb-emoji.svg';
import kbMic from '../assets/app/kb-mic.svg';
import { useEffect, useState } from 'react';
import plus from '../assets/app/plus.svg';
import mic from '../assets/app/mic.svg';
import audio from '../assets/app/audio.svg';
/* Canonical Emma avatar. The Ask section imports this exact file too — the two
   are one shared element that morphs on scroll, so they must be byte-identical
   rather than merely similar crops. */
import ansEmma from '../assets/app/ans-emma.png';
import ansVenue from '../assets/app/ans-venue.png';
import ansPhoto1 from '../assets/app/ans-photo1.png';
import ansPhoto2 from '../assets/app/ans-photo2.png';
import quote from '../assets/app/quote.svg';
import bookmark from '../assets/app/bookmark.svg';
import Orb from './Orb.jsx';
import './PhoneAiScreen.css';

/* "Breeze in": drift up and settle, with a touch of blur coming off. */
const breeze = (t) => ({
  opacity: t,
  transform: `translateY(${(1 - t) * 16}px)`,
  filter: t < 1 ? `blur(${(1 - t) * 3}px)` : 'none',
});

/* Rotating status lines while bravo AI "searches". */
const THINKING = [
  'Let me look that up for you …',
  'Scanning menus and reviews nearby …',
  'Rounding up the best matches …',
];

const ROW1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const ROW2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const ROW3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

/* Shift / delete / return are SF Symbols in the design — system glyphs with no
   exported vector, so they're drawn here rather than sourced from Figma. */
const Shift = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#595959" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5 3.5 12H8v6.5h8V12h4.5L12 3.5Z" />
  </svg>
);
const Delete = () => (
  <svg viewBox="0 0 26 20" fill="none" stroke="#595959" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 3h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13L2 10l6.5-7Z" />
    <path d="M12.5 7.5l6 5M18.5 7.5l-6 5" />
  </svg>
);
const Return = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 5v6a3 3 0 0 1-3 3H5" />
    <path d="M9 10l-4 4 4 4" />
  </svg>
);

export default function PhoneAiScreen({
  scale, frameH, bubble = 0, thinking = 0, kb = 1, answer = [0, 0, 0],
}) {
  const [line, setLine] = useState(0);
  const answering = answer[0] > 0;
  const active = thinking > 0.5 && !answering;

  /* cycle the status line only while the row is actually on screen */
  useEffect(() => {
    if (!active) { setLine(0); return; }
    const id = setInterval(() => setLine((i) => (i + 1) % THINKING.length), 2200);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="ai__frame" style={{ transform: `scale(${scale})`, height: `${frameH}px` }}>
      <div className="ai__glow" />

      <div className="ai__top">
        <div className="ai__bar">
          <span className="ai__iconbtn"><img src={aiBack} alt="" /></span>
          <img className="ai__logo" src={aiLogo} alt="bravo AI" />
          <span className="ai__iconbtn"><img src={aiMenu} alt="" /></span>
        </div>
        <p className="ai__note">bravo AI may make mistakes, so please double check.</p>
      </div>

      <div className="ai__bottom">
        <div className="ai__thread">
          <div className="ai__bubble-row">
            <div
              className="ai__bubble"
              style={{ opacity: bubble, transform: `translateY(${(1 - bubble) * 26}px)` }}
            >
              where to try foie gras in town ?
            </div>
          </div>

          {/* answer — orb stays, status line is replaced by the reply.
              The three blocks breeze in one after another. */}
          <div
            className="ai__reply"
            style={{ opacity: thinking, transform: `translateY(${(1 - thinking) * 14}px)` }}
          >
            <Orb className="ai__orb" speed={1.4} />

            <div className="ai__reply-body">
              {!answering && <span className="ai__think-line" key={line}>{THINKING[line]}</span>}

              {answering && (
                <>
                  <p className="ai__answer breeze" style={breeze(answer[0])}>
                    PiDGiN in Downtown is your best bet — it’s Michelin recommended, and their
                    seared Foie Gras with rice is the one dish regulars keep coming back for.
                    Go early if you want the counter.
                  </p>

                  <div className="ai__friend breeze" style={breeze(answer[1])}>
                    <div className="ai__friend-head">
                      <span>Your friend</span>
                      <span className="ai__friend-av"><img src={ansEmma} alt="" /></span>
                      <span>Emma posted about it last week</span>
                    </div>
                    <div className="ai__friend-quote">
                      <img className="ai__quote-mark" src={quote} alt="" />
                      <p>What a great place to be, I like their foie gras on rice and the drinks are amazing</p>
                    </div>
                  </div>

                  <div className="ai__result breeze" style={breeze(answer[2])}>
                    <div className="ai__venue">
                      <div className="ai__venue-left">
                        <span className="ai__venue-thumb">
                          <img src={ansVenue} alt="" />
                          <span className="ai__venue-pct">3%</span>
                        </span>
                        <span className="ai__venue-meta">
                          <span className="ai__venue-name">PiDGiN</span>
                          <span className="ai__venue-sub">Fine Dining • Vancouver • 15.13km</span>
                        </span>
                      </div>
                      <span className="ai__venue-save"><img src={bookmark} alt="" /></span>
                    </div>
                    <div className="ai__photos">
                      <span className="ai__photo"><img src={ansPhoto1} alt="" /></span>
                      <span className="ai__photo"><img src={ansPhoto2} alt="" /></span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pbox ai__prompt">
            <div className="pbox__inner">
              <span className="ai__prompt-plus"><img src={plus} alt="" /></span>
              <span className="ai__prompt-ph">Ask or search anything...</span>
              <img className="ai__prompt-mic" src={mic} alt="" />
              <span className="ai__prompt-audio"><img src={audio} alt="" /></span>
            </div>
          </div>
        </div>

        {/* Keyboard drops away once bravo AI starts working. The negative margin
            collapses its layout space in step with the slide, otherwise it keeps
            reserving 342px and pushes the thread out through the top. */}
        <div
          className="ai__kb"
          style={{
            transform: `translateY(${(1 - kb) * 100}%)`,
            opacity: kb,
            marginBottom: `${-(1 - kb) * 342}px`,
          }}
        >
          <div className="ai__kb-suggest">
            <span>“The”</span><i /><span>the</span><i /><span>to</span>
          </div>

          <div className="ai__kb-keys">
            <div className="ai__kb-row">
              {ROW1.map((k) => <span className="ai__key" key={k}>{k}</span>)}
            </div>
            <div className="ai__kb-row ai__kb-row--2">
              {ROW2.map((k) => <span className="ai__key" key={k}>{k}</span>)}
            </div>
            <div className="ai__kb-row ai__kb-row--3">
              <span className="ai__key ai__key--shift"><Shift /></span>
              <span className="ai__kb-mid">
                {ROW3.map((k) => <span className="ai__key" key={k}>{k}</span>)}
              </span>
              <span className="ai__key ai__key--del"><Delete /></span>
            </div>
            <div className="ai__kb-row ai__kb-row--4">
              <span className="ai__key ai__key--abc">ABC</span>
              <span className="ai__key ai__key--space" />
              <span className="ai__key ai__key--return"><Return /></span>
            </div>
          </div>

          <div className="ai__kb-foot">
            <img src={kbEmoji} alt="" style={{ width: 26.92, height: 26.92 }} />
            <img src={kbMic} alt="" style={{ width: 18.866, height: 28.213 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
