import fs from 'node:fs';
import path from 'node:path';
import { imageSize } from 'image-size';

/* The post content column, from .post in Blog.css. Body images fill it, so this
   is the width every derived aspect/width/height is expressed against. */
export const COLUMN = 980;

/* The hero's frame is fixed by CSS (.post__hero has aspect-ratio: 980/599)
   regardless of the source's own ratio, so it is a constant, not derived. */
export const HERO_HEIGHT = 599;

export function measure(absPath, describedAs) {
  if (!fs.existsSync(absPath)) {
    throw new Error(
      `${describedAs}: no such image — expected a file at ${path.relative(process.cwd(), absPath)}`,
    );
  }
  try {
    const { width, height } = imageSize(fs.readFileSync(absPath));
    if (!width || !height) throw new Error('no intrinsic dimensions');
    return { width, height };
  } catch (e) {
    throw new Error(`${describedAs}: could not read image dimensions — ${e.message}`);
  }
}

/*
 * Resolve a body image to the numbers the renderer needs.
 *
 * `aspect` defaults to the file's own ratio, which is what you want when photos
 * are simply dropped in. An explicit `aspect: W/H` in the markdown title slot
 * means the design crops deliberately; `focus` then says where to crop from.
 *
 * width/height are emitted from the DISPLAY aspect rather than the intrinsic
 * one, so the attributes agree with the CSS aspect-ratio instead of fighting it
 * — that is what actually holds the layout still while the image loads.
 */
export function resolveFigure(block, dir, describedAs) {
  const abs = path.join(dir, block.src);
  const intrinsic = measure(abs, `${describedAs}:${block.line}: image "${block.src}"`);

  const aspect = block.aspect ?? `${COLUMN} / ${Math.round((COLUMN * intrinsic.height) / intrinsic.width)}`;
  const [w, h] = aspect.split('/').map((n) => Number(n.trim()));

  return {
    ...block,
    abs,
    aspect,
    width: COLUMN,
    height: Math.round((COLUMN * h) / w),
    intrinsic,
  };
}

/*
 * The og:image is produced by `npm run images` (sips — macOS only), so it can't
 * be generated during a portable build. Assert it exists instead: shipping a
 * post whose social preview 404s is the mistake an explicit script invites.
 *
 * Existence only, deliberately not mtime: git does not preserve modification
 * times, so after a fresh clone the card and its hero get arbitrary relative
 * mtimes and an "is the card stale?" check would fail the build at random on
 * CI. Rebuilding a card is `npm run images --force`, a decision for a human.
 */
export function assertOgCard(file, describedAs) {
  if (!fs.existsSync(path.join(process.cwd(), 'public', file))) {
    throw new Error(`${describedAs}: og:image public/${file} is missing — run: npm run images`);
  }
  return `/${file}`;
}
