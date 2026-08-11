import { useEffect, useRef } from 'react';
import { OrbSphere } from '../lib/orb-sphere.js';

/* Thin React wrapper around the WebGL orb: construct on mount, destroy on unmount.
   The orb fills its container, so size it from CSS. */
export default function Orb({ className, speed = 1 }) {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const orb = new OrbSphere(el, { speed });
    return () => orb.destroy();
  }, [speed]);

  return <span className={className} ref={host} aria-hidden="true" />;
}
