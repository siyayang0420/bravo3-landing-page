import { useEffect, useRef, useState } from 'react';

/*
 * In-phone screens are authored at their Figma design width and scaled down to
 * the phone glass, so every label stays real text instead of a flattened image.
 *
 * Returns a ref for the glass element plus the inline style for the design-sized
 * frame inside it. The frame's height is measured rather than hard-coded: the
 * glass is proportionally shorter than the design frame, so a fixed height crops
 * the bottom chrome.
 */
export function usePhoneScreenScale(designWidth, fallbackHeight) {
  const ref = useRef(null);
  const [box, setBox] = useState({ scale: 1, frameHeight: fallbackHeight });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(([entry]) => {
      const scale = entry.contentRect.width / designWidth;
      /* A detached or display:none phone measures 0 wide, which would make the
         derived height Infinity and blank the screen. Hold the last good box. */
      if (!scale) return;
      setBox({ scale, frameHeight: entry.contentRect.height / scale });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);

  return {
    ref,
    scale: box.scale,
    frameHeight: box.frameHeight,
    frameStyle: { transform: `scale(${box.scale})`, height: `${box.frameHeight}px` },
  };
}
