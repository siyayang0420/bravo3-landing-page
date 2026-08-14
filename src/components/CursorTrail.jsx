import { useEffect, useRef, useState } from 'react';
import BravoMark from './BravoMark.jsx';
import './CursorTrail.css';

/*
 * Cursor trail for the coming-soon page — Figma nodes 5939:17056 / 17055 / 17004.
 *
 * Three app-icon tiles drop behind the pointer at varied angle, size and
 * variant. They are drawn in CSS rather than exported as images: the artwork is
 * two gradients, a flat fill and the project's own wordmark, so this stays a
 * few hundred bytes and renders sharp at whatever size a tile happens to get.
 *
 * Deliberately scoped to this page — it is only mounted here.
 */

/* newest first, so index 0 is the tile under the cursor */
const MAX = 6;
/* opacity by age: the oldest two fade out, which is what gives the trail a tail
   rather than six equally solid tiles */
const OPACITY = [1, 1, 1, 1, 0.55, 0.25];
/* px of pointer travel between drops — spaces the tiles instead of emitting one
   per mousemove event, which would also flood React with state updates */
const STEP = 72;
/* a tile clears itself, so the trail empties when the pointer stops */
const LIFETIME = 900;
/* how far outside the quiet zone the trail stays away — "around" the form, not
   only directly over it, so tiles never crowd the field the visitor is aiming at */
const QUIET_PAD = 32;

const VARIANTS = ['sunset', 'yellow', 'wash'];
const rand = (min, max) => min + Math.random() * (max - min);

const randomLook = () => ({
  rot: Math.round(rand(-26, 26)),
  size: Math.round(rand(46, 86)),
  variant: VARIANTS[Math.floor(Math.random() * VARIANTS.length)],
  /* a small offset off the exact pointer position so the trail reads as
     scattered rather than as beads on a wire */
  dx: Math.round(rand(-14, 14)),
  dy: Math.round(rand(-14, 14)),
});

/*
 * `quiet` is a selector — comma-separated for several — matching areas the trail
 * keeps clear, so tiles never pile up over something the visitor is reaching
 * for. Passed in rather than hardcoded, so the trail stays unaware of the page
 * it is on.
 */
export default function CursorTrail({ quiet }) {
  const [tiles, setTiles] = useState([]);
  const last = useRef(null);
  const seq = useRef(0);
  const timers = useRef(new Set());

  useEffect(() => {
    /*
     * Desktop only, as specified: `hover: hover` + `pointer: fine` is the
     * meaningful test — a touch screen has no cursor to trail. Reduced-motion is
     * honoured too; a trail chasing the pointer is exactly the kind of
     * incidental motion that setting asks to be spared.
     */
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || still.matches) return undefined;

    /* captured here rather than read in the cleanup, which is what the
       exhaustive-deps rule asks for — the Set itself never changes identity */
    const pending = timers.current;

    const onMove = (e) => {
      /*
       * Checked before the distance test, so entering the zone clears the trail
       * immediately rather than waiting for the pointer to travel another STEP.
       * `last` still advances, so leaving the zone doesn't dump a tile instantly.
       */
      const zones = quiet ? document.querySelectorAll(quiet) : [];
      for (const zone of zones) {
        const r = zone.getBoundingClientRect();
        const inside = e.clientX >= r.left - QUIET_PAD && e.clientX <= r.right + QUIET_PAD
          && e.clientY >= r.top - QUIET_PAD && e.clientY <= r.bottom + QUIET_PAD;
        if (inside) {
          last.current = { x: e.clientX, y: e.clientY };
          /* returning the same array when already empty lets React bail out, so
             moving around inside a quiet zone costs no re-renders */
          setTiles((list) => (list.length ? [] : list));
          return;
        }
      }

      const prev = last.current;
      if (prev && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < STEP) return;
      last.current = { x: e.clientX, y: e.clientY };

      const id = (seq.current += 1);
      setTiles((list) => [{ id, x: e.clientX, y: e.clientY, ...randomLook() }, ...list].slice(0, MAX));

      const timer = window.setTimeout(() => {
        pending.delete(timer);
        setTiles((list) => list.filter((t) => t.id !== id));
      }, LIFETIME);
      pending.add(timer);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      pending.forEach(window.clearTimeout);
      pending.clear();
    };
  }, [quiet]);

  if (!tiles.length) return null;

  return (
    /* aria-hidden: decoration with nothing to announce, and pointer-events are
       off in CSS so it can never intercept a click on the form beneath */
    <div className="trail" aria-hidden="true">
      {tiles.map((t, i) => (
        <span
          key={t.id}
          className={`trail__tile trail__tile--${t.variant}`}
          style={{
            left: t.x + t.dx,
            top: t.y + t.dy,
            '--trail-size': `${t.size}px`,
            '--trail-rot': `${t.rot}deg`,
            opacity: OPACITY[i] ?? 0,
          }}
        >
          {t.variant === 'wash' && <span className="trail__wash" />}
          <BravoMark className="trail__mark" />
        </span>
      ))}
    </div>
  );
}
