import { useEffect, useRef } from 'react';
import emma from '../assets/app/ans-emma.png';
import './AvatarMorph.css';

/*
 * Shared-element transition: Emma's avatar inside the phone's AI answer grows
 * into the large avatar on the Ask stage as you scroll between the two.
 *
 * Rather than animating either real element, a fixed "flyer" interpolates
 * between their live bounding rects each frame — so it stays correct even
 * though both endpoints are themselves moving with the scroll, and neither
 * layout has to be disturbed.
 */
const SRC = '.ai__friend-av';
const DST = '.ask__face';

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const lerp = (a, b, t) => a + (b - a) * t;

export default function AvatarMorph() {
  const flyer = useRef(null);

  useEffect(() => {
    const el = flyer.current;
    if (!el) return;
    // reduced motion: leave both avatars in place and never fly
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let hidden = [];

    const show = (nodes, on) => nodes.forEach((n) => { if (n) n.style.visibility = on ? '' : 'hidden'; });

    const update = () => {
      raf = 0;
      // Restore first, unconditionally. Every early return below used to skip
      // this, which could strand the Ask avatar with visibility:hidden.
      show(hidden, true);
      hidden = [];

      const scene = document.querySelector('.hero-scene');
      const ask = document.querySelector('.ask');
      const src = document.querySelector(SRC);
      const dst = document.querySelector(DST);
      if (!scene || !ask || !dst) { el.style.opacity = '0'; return; }

      // document-space anchors: scene release -> Ask section settled
      const startY = scene.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
      const endY = ask.getBoundingClientRect().top + window.scrollY;
      const span = Math.max(endY - startY, 1);
      const t = clamp01((window.scrollY - startY) / span);
      const e = t * t * (3 - 2 * t); // smoothstep

      // The source only exists once the in-phone answer has rendered. Without it
      // there is nothing to fly from, so leave both real avatars alone.
      const flying = src && t > 0 && t < 1;
      if (!flying) {
        if (src && t < 1) { hidden = [dst]; show(hidden, false); }
        el.style.opacity = '0';
        return;
      }
      hidden = [src, dst];
      show(hidden, false);

      const a = src.getBoundingClientRect();
      const b = dst.getBoundingClientRect();
      const w = lerp(a.width, b.width, e);
      const h = lerp(a.height, b.height, e);
      el.style.opacity = '1';
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.transform = `translate3d(${lerp(a.left, b.left, e)}px, ${lerp(a.top, b.top, e)}px, 0)`;
      // keep the Figma highlight proportional as it grows
      el.style.setProperty('--sh', `${w}px`);
    };

    /* Driven by a rAF loop rather than scroll events. The endpoints are laid out
       by two other scroll-driven components, so a missed frame leaves a real
       avatar hidden; polling the scroll position is self-correcting and costs a
       single comparison on idle frames. */
    let alive = true;
    let lastY = NaN;
    let lastW = NaN;
    const loop = () => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      if (window.scrollY === lastY && window.innerWidth === lastW) return;
      lastY = window.scrollY;
      lastW = window.innerWidth;
      update();
    };
    loop();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      show(hidden, true);
    };
  }, []);

  return (
    <div className="avatar-morph" ref={flyer} aria-hidden="true">
      <img src={emma} alt="" />
    </div>
  );
}
