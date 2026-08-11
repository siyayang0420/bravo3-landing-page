import { useCallback, useEffect, useRef, useState } from 'react';
import coinFront from '../assets/pay/coin-front.webp';
import coinBack from '../assets/pay/coin-back.webp';
import './BravoCoin.css';

/*
 * Bravo coin — Figma 5821:7383 (front) / 5821:7392 (back).
 *
 * On `play` it spins two full turns while rising, then rests at the front of
 * the screen. After that it is a toy: drag horizontally to spin it, release to
 * snap to whichever face is nearer. A sheen sweeps across the visible face
 * whenever it is edge-on, which is what sells it as a struck metal disc.
 */
const LIFT = 70;          // design px the coin rises during the intro
const INTRO_SPIN = 720;   // two full turns
const INTRO_MS = 1500;
const DRAG_DEG_PER_PX = 1.1;
const SNAP_MS = 420;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
/* overshoot on the snap so the coin settles like it has weight */
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function BravoCoin({ play = false, value = '$5', className = '' }) {
  const [angle, setAngle] = useState(0);
  const [lift, setLift] = useState(0);
  const [dragging, setDragging] = useState(false);
  const raf = useRef(0);
  const drag = useRef(null);

  const stop = () => { cancelAnimationFrame(raf.current); raf.current = 0; };

  /* Generic rAF tween used by both the intro and the release snap. */
  const tween = useCallback((from, to, ms, ease, onFrame) => {
    stop();
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min((now - t0) / ms, 1);
      onFrame(from + (to - from) * ease(t), t);
      if (t < 1) raf.current = requestAnimationFrame(step);
      else raf.current = 0;
    };
    raf.current = requestAnimationFrame(step);
  }, []);

  /* Intro: spin + rise, driven from one clock so they land together. */
  useEffect(() => {
    if (!play) { stop(); setAngle(0); setLift(0); return; }
    if (prefersReducedMotion()) { setAngle(0); setLift(LIFT); return; }
    tween(0, INTRO_SPIN, INTRO_MS, easeOutCubic, (v, t) => {
      setAngle(v);
      setLift(LIFT * easeOutCubic(Math.min(t * 1.25, 1)));
    });
    return stop;
  }, [play, tween]);

  useEffect(() => stop, []);

  const onPointerDown = (e) => {
    stop();
    /* capture keeps the spin alive when the pointer leaves the small disc */
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* no active pointer */ }
    drag.current = { x: e.clientX, angle, moved: false };
    setDragging(true);
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    setAngle(drag.current.angle + dx * DRAG_DEG_PER_PX);
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    const { moved } = drag.current;
    drag.current = null;
    setDragging(false);
    /* a tap with no travel still flips — the coin invites a poke */
    const target = moved
      ? Math.round(angle / 180) * 180
      : Math.round(angle / 180) * 180 + 180;
    if (prefersReducedMotion()) setAngle(target);
    else tween(angle, target, SNAP_MS, easeOutBack, setAngle);
  };

  const onKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    stop();
    const target = Math.round(angle / 180) * 180 + 180;
    if (prefersReducedMotion()) setAngle(target);
    else tween(angle, target, SNAP_MS, easeOutBack, setAngle);
  };

  /* Sheen: brightest when a face is edge-on, sweeping across as it turns. */
  const rad = (angle * Math.PI) / 180;
  const glareO = Math.pow(Math.abs(Math.sin(rad)), 1.5) * 0.8;
  const glareX = -60 + 120 * (((angle % 180) + 180) % 180) / 180;

  return (
    <div
      className={`coin ${className}`.trim()}
      style={{ '--coin-lift': `${lift}px` }}
    >
      <div
        className={`coin__disc${dragging ? ' is-dragging' : ''}`}
        style={{
          '--coin-angle': `${angle}deg`,
          '--glare-o': glareO,
          '--glare-x': `${glareX}%`,
        }}
        role="button"
        /* Out of the tab order on purpose: the coin lives inside a role="img"
           mockup, so assistive tech never describes it. A focus stop that
           screen readers can't explain is worse than no focus stop — it stays
           fully interactive by pointer. */
        tabIndex={-1}
        aria-label="Flip the Bravo coin"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <span className="coin__face coin__face--front">
          <img src={coinFront} alt="" draggable="false" loading="lazy" decoding="async" />
          <span className="coin__glare" />
        </span>
        <span className="coin__face coin__face--back">
          <img src={coinBack} alt="" draggable="false" loading="lazy" decoding="async" />
          {/* The reward figure is struck on the reverse. Set as live text, not
              baked into the art, so the amount can change. */}
          <span className="coin__value">{value}</span>
          <span className="coin__glare" />
        </span>
      </div>
    </div>
  );
}
