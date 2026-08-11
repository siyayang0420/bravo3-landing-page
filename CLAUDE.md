# Working on this repo

React 18 + Vite, plain CSS (no Tailwind, no CSS-in-JS). One .css file per component,
imported from that component. Shared values live in `src/styles/tokens.css` — add a
variable there rather than hardcoding a new color or size.

Hard constraints from the brand:
- Fonts: Boldonse and Inter only.
- Boldonse: display use only (wordmark, hero, marquee, closing statement), max ~3 words per
  line, line-height >= 1.3.
- Yellow #FFD400 is an accent; never a section background.
- Copy is short, human, confident. Headlines create curiosity; they don't explain features.
- The page tells one story (one night out) — do not turn it into a feature grid.
