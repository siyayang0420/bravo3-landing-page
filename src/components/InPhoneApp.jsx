import { useEffect, useRef, useState } from 'react';
import av1 from '../assets/app/av1.webp';
import av2 from '../assets/app/av2.webp';
import av3 from '../assets/app/av3.webp';
import av4 from '../assets/app/av4.webp';
import venue from '../assets/app/venue.webp';
import photo1 from '../assets/app/photo1.webp';
import photo2 from '../assets/app/photo2.webp';
import photo3 from '../assets/app/photo3.webp';
import me from '../assets/app/me.png';
import cellular from '../assets/app/cellular.svg';
import wifi from '../assets/app/wifi.svg';
import battery from '../assets/app/battery.svg';
import coinBg from '../assets/app/coin-bg.svg';
import coinIn from '../assets/app/coin-in.svg';
import flame from '../assets/app/flame.svg';
import star from '../assets/app/star.svg';
import bookmark from '../assets/app/bookmark.svg';
import comment from '../assets/app/comment.svg';
import swap from '../assets/app/swap.svg';
import bell from '../assets/app/bell.svg';
import plus from '../assets/app/plus.svg';
import mic from '../assets/app/mic.svg';
import audio from '../assets/app/audio.svg';
import compose from '../assets/app/compose.svg';
import navMap from '../assets/app/nav-map.svg';
import navUsers from '../assets/app/nav-users.svg';
import navQr from '../assets/app/nav-qr.svg';
import navStar from '../assets/app/nav-star.svg';
import PhoneAiScreen from './PhoneAiScreen.jsx';
import { usePhoneScreenScale } from '../lib/usePhoneScreenScale.js';
import './InPhoneApp.css';

/* Exported heart vector (Figma node I5796:4975). Recoloured for the two states
   rather than redrawn, so the geometry is the real design asset. */
const HEART_PATH =
  'M0.75 5.34679C0.750017 4.41946 1.03133 3.51395 1.55678 2.74985C2.08223 1.98575 2.8271 1.39901 3.69301 1.06713C4.55892 0.735245 5.50513 0.673832 6.40668 0.890998C7.30822 1.10816 8.12269 1.59369 8.7425 2.28346C8.78615 2.33014 8.83893 2.36735 8.89756 2.39279C8.95619 2.41824 9.01942 2.43136 9.08333 2.43136C9.14724 2.43136 9.21047 2.41824 9.2691 2.39279C9.32773 2.36735 9.38051 2.33014 9.42417 2.28346C10.042 1.58921 10.8567 1.0996 11.7597 0.879796C12.6627 0.659991 13.6112 0.720417 14.4791 1.05303C15.3469 1.38565 16.0928 1.97467 16.6176 2.74171C17.1424 3.50875 17.4211 4.41743 17.4167 5.34679C17.4167 7.25513 16.1667 8.68013 14.9167 9.93013L10.34 14.3576C10.1847 14.536 9.99327 14.6792 9.77837 14.7779C9.56347 14.8765 9.33003 14.9283 9.09357 14.9298C8.85711 14.9313 8.62304 14.8825 8.4069 14.7866C8.19077 14.6906 7.99752 14.5498 7.84 14.3735L3.25 9.93013C2 8.68013 0.75 7.26346 0.75 5.34679Z';

function HeartIcon({ filled }) {
  return (
    <svg className="ph-heart__icon" viewBox="0 0 18.1667 15.6799" aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'currentColor' : '#737373'}
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={HEART_PATH} />
    </svg>
  );
}

const DESIGN_W = 402;
const FEED_TRAVEL = 196; // design px the feed scrolls, screen 1 -> screen 2
/* Fractions of the pinned scene's scroll budget, in order:
   feed scrolls -> heart fires -> hold for the burst -> feed slides out left
   while the AI screen slides in from the right -> chat bubble rises. */
const FEED_DONE = 0.24;
const LIKE_AT = 0.31;
const SLIDE_FROM = 0.40;
const SLIDE_TO = 0.58;
const BUBBLE_FROM = 0.63;
const BUBBLE_TO = 0.75;
const KB_FROM = 0.72;   // keyboard starts dropping just before the orb lands
const KB_TO = 0.80;
const THINK_FROM = 0.78;
const THINK_TO = 0.86;
/* the three answer blocks, staggered so they arrive one after another */
const ANSWER_STEPS = [[0.88, 0.92], [0.92, 0.955], [0.955, 0.99]];
const track = (p, a, b) => Math.min(Math.max((p - a) / (b - a), 0), 1);
const rand = (a, b) => a + Math.random() * (b - a);

/* Smooth wavy rise. The path is sampled into many pre-eased keyframes and played
   linearly, which reads far more naturally than a few hard-cornered CSS steps. */
function flyHeart(el, { drift, rise, spin, waves, dur }) {
  const N = 36;
  const frames = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = -rise * (1 - Math.pow(1 - t, 2.1));           // ease-out climb
    const x = drift * Math.sin(t * Math.PI * waves) * (1 - t * 0.3); // damped sway
    const pop = t < 0.16 ? 0.4 + (1.12 - 0.4) * (t / 0.16) : 1.12 - 0.34 * ((t - 0.16) / 0.84);
    const rot = spin * Math.sin(t * Math.PI * (waves * 0.8));
    const opacity = t < 0.08 ? t / 0.08 : t > 0.58 ? Math.max(0, 1 - (t - 0.58) / 0.42) : 1;
    frames.push({
      transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${pop.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`,
      opacity: +opacity.toFixed(3),
      offset: t,
    });
  }
  return el.animate(frames, { duration: dur, easing: 'linear', fill: 'forwards' });
}

export default function InPhoneApp() {
  const { ref: screenRef, scale, frameHeight: frameH, frameStyle } = usePhoneScreenScale(DESIGN_W, 874);
  const burstRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const likedRef = useRef(false);

  const burst = () => {
    const host = burstRef.current;
    if (!host) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 2; i++) {
      const node = document.createElement('span');
      node.className = 'ph-fly';
      node.innerHTML =
        `<svg viewBox="0 0 18.1667 15.6799" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="${HEART_PATH}"/></svg>`;
      host.appendChild(node);
      const anim = flyHeart(node, {
        drift: rand(9, 16) * (i === 0 ? -1 : 1),
        rise: rand(58, 82),
        spin: rand(-16, 16),
        waves: rand(1.7, 2.6),
        dur: rand(1250, 1650),
      });
      anim.finished.then(() => node.remove()).catch(() => node.remove());
    }
  };

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const scene = document.querySelector('.hero-scene');
      if (!scene) return;
      const rect = scene.getBoundingClientRect();
      const budget = rect.height - window.innerHeight;
      const p = budget > 0 ? Math.min(Math.max(-rect.top / budget, 0), 1) : 0;
      setProgress(p);
      if (p >= LIKE_AT && !likedRef.current) {
        likedRef.current = true;
        setLiked(true);
        burst();
      } else if (p < LIKE_AT - 0.22 && likedRef.current) {
        likedRef.current = false; // scroll back up to replay
        setLiked(false);
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  /* eased so the screens don't start and stop abruptly */
  const slideRaw = track(progress, SLIDE_FROM, SLIDE_TO);
  const slide = slideRaw * slideRaw * (3 - 2 * slideRaw); // smoothstep
  const bubble = track(progress, BUBBLE_FROM, BUBBLE_TO);
  const thinking = track(progress, THINK_FROM, THINK_TO);
  const kb = 1 - track(progress, KB_FROM, KB_TO);
  const answer = ANSWER_STEPS.map(([a, b]) => track(progress, a, b));

  return (
    <div className="ph" ref={screenRef}>
      <div
        className="ph__layer"
        style={{ transform: `translateX(${-100 * slide}%)`, opacity: 1 - slide }}
      >
      <div className="ph__frame" style={frameStyle}>

        {/* ---------- scrolling feed ---------- */}
        <div
          className="ph__feed"
          style={{ transform: `translateY(${-FEED_TRAVEL * Math.min(progress / FEED_DONE, 1)}px)` }}
        >
          {/* heading + card are one group (Figma 5796:3404, gap 16) inside the
              feed's gap-32 stack — otherwise the two spacings compound */}
          <div className="ph__group">
          {/* a <p>, not a heading: this is UI inside a decorative mockup and
              would otherwise inject an H3 between the page's H1 and its H2s */}
          <p className="ph__h3">In Progress Challenge</p>

          <div className="ph-card">
            <div className="ph-card__row">
              <div className="ph-stack">
                {[av1, av2, av3, av4].map((src, i) => (
                  <span className="ph-stack__item" key={i}><img src={src} alt="" /></span>
                ))}
              </div>
              <p className="ph-card__who">Bonnie and 2+ are in this challenge with you</p>
            </div>

            <div className="ph-card__title">
              <span className="ph-bold">Summer Dining Challenge</span>
              <span className="ph-coin">
                <span className="ph-coin__art">
                  <img className="ph-coin__bg" src={coinBg} alt="" />
                  <img className="ph-coin__in" src={coinIn} alt="" />
                </span>
                <span className="ph-bold">$5</span>
              </span>
            </div>

            <div className="ph-prog">
              <div className="ph-prog__row"><span>$512.56/$1000</span><span>67 days left</span></div>
              <div className="ph-prog__track"><div className="ph-prog__fill" /></div>
            </div>
          </div>
          </div>

          <div className="ph-post">
            <span className="ph-post__av"><img src={av1} alt="" /></span>
            <div className="ph-post__body">
              <div className="ph-post__head">
                <div className="ph-post__name">
                  <span className="ph-name">Happy</span>
                  <span className="ph-dot">•</span>
                  <span className="ph-date">Jun 3, 2026</span>
                </div>
                <div className="ph-chips">
                  <span className="ph-chip ph-chip--flame"><img src={flame} alt="" />2X</span>
                  <span className="ph-chip ph-chip--lv"><img src={star} alt="" />Lv.1</span>
                </div>
              </div>

              <p className="ph-post__text">Best Cantonese cafe, will come again soon next time when my fam visit</p>

              <div className="ph-venue">
                <div className="ph-venue__left">
                  <span className="ph-venue__thumb">
                    <img src={venue} alt="" />
                    <span className="ph-venue__pct">3%</span>
                  </span>
                  <span className="ph-venue__meta">
                    <span className="ph-venue__name">Ellipsis</span>
                    <span className="ph-venue__sub">Cafe • Vancouver • 15.13km</span>
                  </span>
                </div>
                <span className="ph-venue__save"><img src={bookmark} alt="" /></span>
              </div>

              <div className="ph-photos">
                {[photo1, photo2, photo3].map((src, i) => (
                  <span className="ph-photos__item" key={i}><img src={src} alt="" /></span>
                ))}
              </div>

              <div className="ph-actions">
                <img className="ph-actions__icon" src={comment} alt="" />
                <span className={`ph-heart${liked ? ' is-liked' : ''}`}>
                  <HeartIcon filled={liked} />
                  <span className="ph-heart__burst" ref={burstRef} />
                  {liked && <span className="ph-heart__count">1</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- fixed chrome ---------- */}
        <div className="ph__top">
          <div className="ph-status">
            <span className="ph-status__time">9:41</span>
            <span className="ph-status__island" />
            <span className="ph-status__levels">
              <img src={cellular} alt="" style={{ width: 19.2, height: 12.226 }} />
              <img src={wifi} alt="" style={{ width: 17.142, height: 12.328 }} />
              <img src={battery} alt="" style={{ width: 27.328, height: 13 }} />
            </span>
          </div>
          <div className="ph-tabs">
            <div className="ph-tabs__left">
              <span className="ph-tab"><span className="ph-tab__label is-dim">For you</span><i /></span>
              <span className="ph-tab"><span className="ph-tab__label">Friends</span><i className="is-on" /></span>
            </div>
            <div className="ph-tabs__right">
              <span className="ph-round"><img src={swap} alt="" /></span>
              <span className="ph-round"><img src={bell} alt="" /></span>
            </div>
          </div>
        </div>

        <div className="ph__bottom">
          <div className="ph-prompt">
            <div className="pbox ph-prompt__box">
              <div className="pbox__inner">
                <span className="ph-prompt__plus"><img src={plus} alt="" /></span>
                <span className="ph-prompt__ph">New onboarded restaurants...</span>
                <img className="ph-prompt__mic" src={mic} alt="" />
                <span className="ph-prompt__audio"><img src={audio} alt="" /></span>
              </div>
            </div>
            <span className="ph-compose"><img src={compose} alt="" /></span>
          </div>
          <div className="ph-nav">
            <img src={navMap} alt="" />
            <img src={navUsers} alt="" />
            <img src={navQr} alt="" />
            <img src={navStar} alt="" />
            <span className="ph-nav__me"><img src={me} alt="" /></span>
          </div>
        </div>
      </div>
      </div>

      {/* AI screen slides in from the right as the feed slides out */}
      <div className="ph__layer" style={{ transform: `translateX(${100 * (1 - slide)}%)` }}>
        <PhoneAiScreen
          scale={scale} frameH={frameH}
          bubble={bubble} thinking={thinking} kb={kb} answer={answer}
        />
      </div>
    </div>
  );
}
