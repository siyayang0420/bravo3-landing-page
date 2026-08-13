import { useEffect, useState } from 'react';

export const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
/* remap `p` so it runs 0->1 across [a, b] and holds outside it */
export const track = (p, a, b) => clamp01((p - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);

/*
 * Progress (0..1) of a pinned "scene": a tall wrapper whose sticky child holds
 * still while the extra height below it is scrolled through.
 *
 * Driven by scroll/resize events rather than a requestAnimationFrame loop.
 * rAF stops firing whenever the page isn't painting (background tab, hidden
 * preview pane), which would freeze the scene mid-transition; scroll events
 * keep arriving regardless. The browser already coalesces them to about one
 * per frame, so this is no more work than a rAF poll.
 */
export function useSceneProgress(sceneSelector) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const read = () => {
      const scene = document.querySelector(sceneSelector);
      if (!scene) return;
      const rect = scene.getBoundingClientRect();
      const budget = rect.height - window.innerHeight;
      setProgress(budget > 0 ? clamp01(-rect.top / budget) : 0);
    };

    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, [sceneSelector]);

  return progress;
}
