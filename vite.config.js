import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* package.json is `"type": "module"`, so this file is ESM and `__dirname` does
   not exist here — it only appears to work because Vite pre-bundles the config.
   Resolving against import.meta.url is the honest ESM equivalent. */
const page = (path) => fileURLToPath(new URL(path, import.meta.url));

/*
 * Multi-page, not a client-side router. Each page ships its own HTML with its
 * own <title>, description, canonical and JSON-LD, so crawlers and link-preview
 * scrapers get the right metadata without executing any JavaScript — which a
 * single-index SPA cannot do. It also means the blog pages never download the
 * landing page's phone-mockup code.
 *
 * Adding a post: one HTML file here plus an entry in src/lib/posts.js.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: page('./index.html'),
        blog: page('./blog/index.html'),
        'blog-ai-sessions-3': page('./blog/bravo-ai-sessions-vol-3/index.html'),
        'blog-ai-sessions-2': page('./blog/bravo-ai-sessions-vol-2/index.html'),
        'blog-ellipsis': page('./blog/ellipsis-opens-at-nine/index.html'),
      },
    },
  },
});
