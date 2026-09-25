// Makes small responsive WebP files for the product photos from the full-size originals in assets/source/
// (1-2 MB PNGs -> ~15-80 KB WebPs). Re-run with `npm run photos` after replacing a source photo.
//   400w covers phones at 1x/2x, 800w covers desktop/retina and the quick-view dialog.
//   aloknonda-*  studio photos on an off-white background: the product tile is coloured to match (edge colours ->
//                src/data/aloknonda-edges.json), so the photo edges vanish.
//   bouquet-*, rose-*, plant-*, gift-*, wedding-*   full-frame photos: they fill the tile (object-cover), so no edge colour is needed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'images');
mkdirSync(out, { recursive: true });

const SETS = [
  // yellow is a transparent cut-out (also used by the hero); the rest are photos on an off-white background.
  { prefix: 'aloknonda', names: ['yellow', 'pink', 'red', 'crimson', 'coral', 'white'], edges: true },
  { prefix: 'bouquet', names: ['ivory', 'ruby', 'gerbera', 'lavender', 'lily', 'sunflower'] },
  { prefix: 'rose', names: ['crimson', 'blush', 'white', 'golden', 'cocoa', 'wedding'] },
  { prefix: 'plant', names: ['orchid', 'jade', 'peace-lily', 'anthurium', 'pothos', 'snake'] },
  { prefix: 'gift', names: ['orchid', 'heart', 'hatbox', 'sunflower'] },
  { prefix: 'wedding', names: ['burgundy', 'peach'] },
];

const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
async function edgeColour(file) {
  const { data, info } = await sharp(file).resize(400).flatten({ background: '#fdfaf5' }).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const ring = 6;
  const sum = [0, 0, 0];
  let n = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (x < ring || y < ring || x >= w - ring || y >= h - ring) {
        const i = (y * w + x) * ch;
        sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2];
        n++;
      }
  return hex(sum.map((v) => v / n));
}

for (const { prefix, names, edges: wantEdges } of SETS) {
  const edges = {};
  for (const name of names) {
    const src = join(root, 'assets', 'source', `${prefix}-${name}.png`);
    for (const width of [400, 800]) {
      const file = join(out, `${prefix}-${name}-${width}.webp`);
      const info = await sharp(src).resize({ width }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(file);
      console.log(`${prefix}-${name}-${width}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
    }
    // Measure the *encoded* file (what the browser shows): lossy WebP shifts colours by a level or two vs the PNG.
    if (wantEdges) edges[name] = name === 'yellow' ? '#fdfaf5' : await edgeColour(join(out, `${prefix}-${name}-800.webp`)); // yellow is transparent: any matching cream works
  }
  if (wantEdges) {
    writeFileSync(join(root, 'src', 'data', `${prefix}-edges.json`), `${JSON.stringify(edges, null, 2)}\n`);
    console.log(`${prefix} edge colours:`, JSON.stringify(edges));
  }
}

// Wide page banner (Sign in / Register / My Account / Wishlist): three widths for <img srcset>.
// The banner is cropped to a wide frame, so the browser scales the picture to the frame's HEIGHT (about 790-1000px wide
// on phones/tablets, 1262px+ on desktop) - hence these widths, not 640/1280.
const BANNERS = [{ name: 'page-banner', widths: [1000, 1600, 2172] }];
for (const { name, widths } of BANNERS) {
  const src = join(root, 'assets', 'source', `${name}.png`);
  for (const width of widths) {
    const info = await sharp(src).resize({ width }).webp({ quality: 80, effort: 6 }).toFile(join(out, `${name}-${width}.webp`));
    console.log(`${name}-${width}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}
