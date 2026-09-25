// Generates the remaining illustrated artwork in /public/images: the video banner
// and the testimonial portraits. (Every product, gallery, promo and blog picture is a real photo now - see
// scripts/optimize-photos.mjs.) Deterministic (seeded) so re-running gives identical files.
// Swap any file for a real photo with the same name - or edit src/data/site.js.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');
mkdirSync(OUT, { recursive: true });

/* ---------- helpers ---------- */
const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const n = (v) => +v.toFixed(1);
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>\n`;
const save = (name, w, h, body) => writeFileSync(join(OUT, name), svg(w, h, body));

const PAL = {
  rose: { petal: '#d9536f', dark: '#a92f4c', light: '#f2909f' },
  red: { petal: '#c9313f', dark: '#8f1c2a', light: '#e5606a' },
  blush: { petal: '#f5a9bb', dark: '#dc7f97', light: '#fcd3dd' },
  peach: { petal: '#f7a77c', dark: '#e0804d', light: '#fdd2b8' },
  sun: { petal: '#f8ca45', dark: '#dc9f14', light: '#fde68f' },
  sunflower: { petal: '#f9c31f', dark: '#d8960a', light: '#fde68f', ctr: '#5b3a17', ctrR: 0.42 },
  lilac: { petal: '#a88bd6', dark: '#7d5cb5', light: '#d5c4f0' },
  white: { petal: '#fbf9f3', dark: '#d9d1c0', light: '#ffffff' },
  coral: { petal: '#f0705f', dark: '#c9483a', light: '#f9a99c' },
  orange: { petal: '#f79a3e', dark: '#d4741a', light: '#fcc98a' },
  sky: { petal: '#9cc3ee', dark: '#6b9bd0', light: '#cfe2f8' },
};
const GREEN = ['#3f8a4b', '#2f7a3d', '#5aa363', '#276a35'];

/* ---------- flower parts ---------- */
const rose = (x, y, r, p) => {
  let s = `<g transform="translate(${n(x)} ${n(y)})"><circle r="${n(r)}" fill="${p.dark}"/>`;
  for (let i = 0; i < 6; i++)
    s += `<ellipse cy="${n(-r * 0.52)}" rx="${n(r * 0.42)}" ry="${n(r * 0.5)}" fill="${p.petal}" transform="rotate(${i * 60})"/>`;
  for (let i = 0; i < 5; i++)
    s += `<ellipse cy="${n(-r * 0.3)}" rx="${n(r * 0.3)}" ry="${n(r * 0.36)}" fill="${p.light}" opacity=".85" transform="rotate(${i * 72 + 36})"/>`;
  return s + `<circle r="${n(r * 0.2)}" fill="${p.dark}"/><circle r="${n(r * 0.09)}" fill="${p.petal}"/></g>`;
};
const daisy = (x, y, r, p) => {
  let s = `<g transform="translate(${n(x)} ${n(y)})">`;
  for (let i = 0; i < 12; i++)
    s += `<ellipse cy="${n(-r * 0.62)}" rx="${n(r * 0.17)}" ry="${n(r * 0.4)}" fill="${p.petal}" stroke="${p.dark}" stroke-width=".7" transform="rotate(${i * 30})"/>`;
  return s + `<circle r="${n(r * (p.ctrR || 0.24))}" fill="${p.ctr || '#f2b632'}"/><circle r="${n(r * 0.09)}" fill="${p.dark}" opacity=".5"/></g>`;
};
const cluster = (x, y, r, p, rnd) => {
  let s = `<g transform="translate(${n(x)} ${n(y)})"><circle r="${n(r * 0.92)}" fill="${p.dark}" opacity=".35"/>`;
  for (let i = 0; i < 22; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.8;
    s += `<circle cx="${n(Math.cos(a) * d)}" cy="${n(Math.sin(a) * d)}" r="${n(r * (0.16 + rnd() * 0.08))}" fill="${[p.petal, p.light, p.dark][i % 3]}"/>`;
  }
  return s + '</g>';
};
const head = (type, x, y, r, p, rnd) =>
  type === 'daisy' ? daisy(x, y, r, p) : type === 'cluster' ? cluster(x, y, r, p, rnd) : rose(x, y, r, p);

const leaf = (x, y, len, ang, col, wide = 0.28) =>
  `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})"><path d="M0 0Q${n(len * 0.35)} ${n(-len * wide)} ${n(len)} 0Q${n(len * 0.35)} ${n(len * wide)} 0 0Z" fill="${col}"/><path d="M0 0L${n(len * 0.9)} 0" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/></g>`;

/* ---------- bouquet (400x400, transparent background) ---------- */
const makeHeads = (layout, { seed, pals, types }) => {
  const rnd = rng(seed);
  const heads = layout.map(([x, y, r], i) => ({
    x: x + (rnd() - 0.5) * 8,
    y: y + (rnd() - 0.5) * 8,
    r: r * (0.94 + rnd() * 0.12),
    p: pals[i % pals.length],
    t: types[i % types.length],
  }));
  return { rnd, heads, order: [...heads].sort((a, b) => a.y - b.y) };
};
const drawHeads = (order, rnd) => order.map((h) => head(h.t, h.x, h.y, h.r, h.p, rnd)).join('');

function bouquet({ seed, pals, types = ['rose'], paper = ['#e4cfa6', '#f4e8cc'], ribbon = '#d9536f' }) {
  const layout = [[200, 118, 40], [150, 140, 37], [250, 140, 37], [108, 180, 33], [292, 180, 33], [176, 80, 31], [226, 82, 31], [200, 172, 38], [146, 208, 29], [254, 208, 29]];
  const { rnd, heads, order } = makeHeads(layout, { seed, pals, types });
  let s = `<ellipse cx="200" cy="389" rx="64" ry="6" fill="#1d2a22" opacity=".1"/>`;
  [-170, -150, -125, -55, -30, -10, -105, -75].forEach((a, i) => {
    s += leaf(200, 236, 82 + rnd() * 40, a, GREEN[i % 4]);
  });
  heads.forEach((h) => {
    s += `<path d="M200 300Q${n((200 + h.x) / 2)} ${n((300 + h.y) / 2 + 20)} ${n(h.x)} ${n(h.y)}" stroke="#2f7a3d" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  });
  s += `<path d="M92 190L308 190L230 386L170 386Z" fill="${paper[0]}"/>`;
  s += `<path d="M130 200L184 384M270 200L216 384M200 198L200 384" stroke="#000" stroke-opacity=".06" stroke-width="2"/>`;
  s += `<path d="M116 210Q200 238 284 210L228 386L172 386Z" fill="${paper[1]}"/>`;
  s += `<path d="M148 300Q200 316 252 300L249 318Q200 334 151 318Z" fill="${ribbon}"/>`;
  s += `<ellipse cx="176" cy="322" rx="22" ry="10" transform="rotate(-22 176 322)" fill="${ribbon}"/><ellipse cx="224" cy="322" rx="22" ry="10" transform="rotate(22 224 322)" fill="${ribbon}"/><circle cx="200" cy="322" r="7" fill="#000" fill-opacity=".18"/>`;
  return s + drawHeads(order, rnd);
}

/* ---------- scene / frame builders ---------- */
const gradient = (id, a, b, vertical = true) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 1}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;

// Dense field of blooms that fills the whole frame (safe to crop with object-cover).
function meadow({ w, h, seed, bg, pals, types = ['rose', 'daisy'], count = 26, rmin = 26, rmax = 60 }) {
  const rnd = rng(seed);
  let s = gradient('g', bg[0], bg[1]) + `<rect width="${w}" height="${h}" fill="url(#g)"/>`;
  for (let i = 0; i < count * 1.4; i++)
    s += leaf(rnd() * w, rnd() * h, 60 + rnd() * 60, rnd() * 360, GREEN[i % 4]);
  const items = Array.from({ length: count }, (_, i) => ({
    x: rnd() * w, y: rnd() * h, r: rmin + rnd() * (rmax - rmin),
    p: pals[i % pals.length], t: types[i % types.length],
  })).sort((a, b) => a.y - b.y);
  return s + items.map((o) => head(o.t, o.x, o.y, o.r, o.p, rnd)).join('');
}

const P = PAL;

/* ---------- video banner ---------- */
save('video.svg', 1280, 720,
  meadow({ w: 1280, h: 720, seed: 61, bg: ['#f4d9df', '#e8b9c5'], pals: [P.rose, P.blush, P.peach, P.white, P.sun], count: 46, rmin: 38, rmax: 84 }));

/* ---------- testimonial portraits (160x187 @2x) ---------- */
const person = ({ bg, skin, hair, shirt, style }) =>
  `<rect width="320" height="374" fill="${bg}"/>` +
  `<path d="M30 374C30 300 90 266 160 266S290 300 290 374Z" fill="${shirt}"/>` +
  `<rect x="140" y="226" width="40" height="52" rx="16" fill="${skin}"/>` +
  (style === 'long' ? `<path d="M96 200C90 120 130 90 160 90S230 120 224 200L230 300 90 300Z" fill="${hair}"/>` : '') +
  (style === 'bun' ? `<circle cx="160" cy="84" r="30" fill="${hair}"/>` : '') +
  `<ellipse cx="160" cy="184" rx="56" ry="66" fill="${skin}"/>` +
  (style === 'short' ? `<path d="M104 176C100 116 130 100 160 100S222 116 216 176C200 150 182 140 160 140S120 150 104 176Z" fill="${hair}"/>` : `<path d="M104 178C104 118 130 108 160 108S216 118 216 178C200 146 180 138 160 138S120 146 104 178Z" fill="${hair}"/>`) +
  `<circle cx="140" cy="190" r="4.5" fill="#2a2a2a"/><circle cx="180" cy="190" r="4.5" fill="#2a2a2a"/><path d="M144 216Q160 230 176 216" stroke="#8a4b3c" stroke-width="4" fill="none" stroke-linecap="round"/>`;
save('avatar-1.svg', 320, 374, person({ bg: '#e9d3d9', skin: '#f0c9a8', hair: '#3b2a24', shirt: '#2f7a3d', style: 'bun' }));
save('avatar-2.svg', 320, 374, person({ bg: '#f5dfd8', skin: '#e2b08a', hair: '#1f1b1a', shirt: '#3a76c4', style: 'short' }));
save('avatar-3.svg', 320, 374, person({ bg: '#dfe9d0', skin: '#c98d66', hair: '#241812', shirt: '#d9536f', style: 'long' }));

console.log(`Generated images in ${OUT}`);
