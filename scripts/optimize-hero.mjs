// Turns the original hero cut-outs (transparent PNGs in assets/source/) into small WebP files with alpha for
// responsive <img srcset>. Re-run with `npm run hero` after replacing a source.
//   aloknonda-yellow.png -> hero-aloknonda-{320,640,960}.webp   (hero slide 1)
//   hero-plant.png       -> hero-plant-{640,1000,1312}.webp     (hero slide 2, the animated plant)
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'images');
mkdirSync(out, { recursive: true });

const SETS = [
  { source: 'aloknonda-yellow.png', name: 'hero-aloknonda', widths: [320, 640, 960] },
  { source: 'hero-plant.png', name: 'hero-plant', widths: [640, 1000, 1312] },
];

for (const { source, name, widths } of SETS) {
  for (const width of widths) {
    const file = join(out, `${name}-${width}.webp`);
    const info = await sharp(join(root, 'assets', 'source', source)).resize({ width }).webp({ quality: 84, alphaQuality: 92, effort: 6 }).toFile(file);
    console.log(`${name}-${width}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}
