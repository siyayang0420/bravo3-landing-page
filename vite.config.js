import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { buildContent } from './scripts/build-content.js';

/* package.json is `"type": "module"`, so this file is ESM and `__dirname` does
   not exist here — it only appears to work because Vite pre-bundles the config.
   Resolving against import.meta.url is the honest ESM equivalent. */
const page = (p) => fileURLToPath(new URL(p, import.meta.url));
const ROOT = fileURLToPath(new URL('.', import.meta.url));

/*
 * Multi-page, not a client-side router. Each page ships its own HTML with its
 * own <title>, description, canonical and JSON-LD, so crawlers and link-preview
 * scrapers get the right metadata without executing any JavaScript — which a
 * single-index SPA cannot do. It also means the blog pages never download the
 * landing page's phone-mockup code.
 *
 * The blog's HTML files are generated from content/ — see scripts/build-content.js.
 * Adding a post means adding content/posts/<slug>/index.md and its images; the
 * entry below is discovered from the filesystem, so nothing here changes.
 */
function blogContent() {
  return {
    name: 'bravo-blog-content',

    /* Generating in config() rather than a "prebuild" npm script is what keeps
       `vite` and `vite build` on one code path — there is no invocation order in
       which the dev server can serve content the build wouldn't produce.
       The entry map is RETURNED from this hook rather than written in the config
       object below, because that object is constructed before any hook runs:
       reading blog/ from there would list the pages as they were *before*
       generation, so a brand-new post would need a second build to appear. */
    config() {
      buildContent({ silent: true });
      return {
        build: {
          rollupOptions: {
            input: {
              home: page('./index.html'),
              'coming-soon': page('./coming-soon/index.html'),
              blog: page('./blog/index.html'),
              ...blogEntries(),
            },
          },
        },
      };
    },

    configureServer(server) {
      server.watcher.add(path.join(ROOT, 'content'));
      const regenerate = (file) => {
        if (!file.includes(`${path.sep}content${path.sep}`)) return;
        try {
          const { changed } = buildContent({ silent: true });
          if (!changed.length) return;
          server.ws.send({ type: 'full-reload' });
        } catch (e) {
          /* surface the validation message in the browser overlay instead of
             killing the dev server */
          server.ws.send({ type: 'error', err: { message: e.message, stack: '' } });
        }
      };
      server.watcher.on('add', regenerate);
      server.watcher.on('change', regenerate);
      server.watcher.on('unlink', regenerate);
    },
  };
}

/* Every blog/<slug>/index.html is an entry. Reading them off disk rather than
   codegen-ing this file means the input map can never go stale, and the config
   stays hand-written. */
function blogEntries() {
  const dir = path.join(ROOT, 'blog');
  if (!fs.existsSync(dir)) return {};
  return Object.fromEntries(
    fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'index.html')))
      .map((e) => [`blog-${e.name}`, path.join(dir, e.name, 'index.html')]),
  );
}

export default defineConfig({
  plugins: [blogContent(), react()],
  build: {
    /*
     * Vite inlines any asset under 4 KB as a base64 data URI. That is right for
     * the icon SVGs, but wrong for photographs and logos: a data URI can't be
     * cached separately, can't be lazy-loaded (it is already in the bundle by
     * the time the parser sees it), and costs ~33% in base64 overhead — which
     * the JS bundle then pays on every page that shares the chunk, whether or
     * not it renders the image. Keep raster assets as real files; let SVG keep
     * the default behaviour.
     */
    assetsInlineLimit: (filePath) => (/\.(webp|png|jpe?g|gif|avif)$/i.test(filePath) ? false : undefined),
    /* rollupOptions.input is supplied by the blogContent() plugin's config()
       hook — see the comment there for why it cannot live here. */
  },
});
