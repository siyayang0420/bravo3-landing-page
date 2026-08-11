# Bravo 3 Landing Page

React + Vite landing page for Bravo 3.0, built as a single-page product site with animated hero, marquee, Ask, Taste, Pay, and footer sections.

## Tech Stack

- React 18
- Vite 5
- Plain CSS modules by component

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

- `src/App.jsx` - page composition and section order
- `src/main.jsx` - React entry point
- `src/components/` - reusable page sections and visual components
- `src/styles/tokens.css` - shared color, spacing, and typography tokens
- `src/styles/global.css` - global reset, layout, type, and motion styles
- `src/assets/` - product screenshots, app store badges, and image assets

## Design Notes

- Keep the app as a focused landing page rather than adding routing unless the product scope changes.
- Use existing tokens in `src/styles/tokens.css` before introducing new colors, type scales, or spacing values.
- Keep motion subtle and respect `prefers-reduced-motion` for animated UI.
- Product screenshots and store badges live in `src/assets/`; update those assets in place when refreshing creative.
