import { useEffect, useId, useRef, useState } from 'react';
import Button from './Button.jsx';
import badgeAppStore from '../assets/badge-appstore.svg';
import badgeGooglePlay from '../assets/badge-googleplay.svg';
import { APP_STORE_URL, PLAY_STORE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './NavAbout.css';

const COMING_SOON_URL = '/coming-soon/';

/*
 * "About" nav item — Figma node 5948:17100. Opens on hover and on click, so it
 * works for pointers, touch (which has no hover) and keyboard alike.
 *
 * It is a <button> rather than a link: it goes nowhere on its own, and the real
 * destinations live inside the panel.
 *
 * Below 600px it becomes the header's only control: the trigger renders as a
 * menu icon and the panel takes over the store button that no longer fits
 * beside it, so the small screen keeps every element the wide one has. `cta`
 * mirrors <Nav>'s prop so the coming-soon page doesn't gain a store button in
 * the menu that it deliberately drops from the bar.
 */
export default function NavAbout({ cta = true }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    /* pointerdown, not click: closes before the page can act on the press */
    const onDown = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <div
      className="navabout"
      ref={wrap}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      /*
       * Only a *move* of focus to something outside closes the menu. A null
       * relatedTarget means focus was lost to nothing at all — which is what a
       * mouse press on non-focusable panel content (the tile, the note) does.
       * Treating that as "focus left the menu" made the panel vanish the moment
       * you pressed on it. Genuine outside clicks are handled by the
       * pointerdown listener above.
       */
      onBlur={(e) => {
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="nav__link navabout__trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={id}
        /*
         * Toggles only where there is no hover. On a hover-capable pointer the
         * mouseenter above has already opened the panel by the time the click
         * lands, so toggling would close it on the very click meant to reach it;
         * there, hovering away, Escape and an outside press do the closing.
         * On touch nothing has opened it yet, so the tap toggles — which is what
         * makes tapping the close icon shut the menu.
         */
        onClick={() => setOpen((v) => (window.matchMedia('(hover: hover)').matches ? true : !v))}
      >
        {/* The word stays in the accessibility tree at every width — it is the
            control's name, and a menu icon alone would leave it unnamed. Only
            its visual presentation swaps for the icon on small screens. */}
        <span className="navabout__word">About</span>
        <span className="navabout__burger" aria-hidden="true">
          <span /><span /><span />
        </span>
      </button>

      <div className="navabout__panel" id={id} hidden={!open}>
        {/* the tile is the same destination as the "Coming Soon" link beside it;
            its own text gives the link its accessible name */}
        <a className="navabout__tile" href={COMING_SOON_URL}>
          <span className="navabout__wash" aria-hidden="true" />
          <p className="navabout__tile-text">Bravo 3.0<br />Coming Soon</p>
        </a>

        <div className="navabout__col">
          <div className="navabout__links">
            <a className="navabout__link" href="/blog/">Blog</a>
            <a className="navabout__link" href={COMING_SOON_URL}>Coming Soon</a>
          </div>

          <div className="navabout__store">
            <p className="navabout__note">Current version still available</p>
            <div className="navabout__badges">
              <a className="navabout__badge" href={APP_STORE_URL} {...EXTERNAL_LINK} aria-label="Download on the App Store">
                <img src={badgeAppStore} alt="" />
              </a>
              <a className="navabout__badge" href={PLAY_STORE_URL} {...EXTERNAL_LINK} aria-label="Get it on Google Play">
                <img src={badgeGooglePlay} alt="" />
              </a>
            </div>
          </div>

          {/* the header's store button, rehomed here at the width where it no
              longer fits beside the trigger — hidden by CSS above 600px, where
              it still sits in the bar */}
          {cta && (
            <div className="navabout__cta">
              <Button size="mid" full href={APP_STORE_URL} {...EXTERNAL_LINK}>
                Get the App
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
