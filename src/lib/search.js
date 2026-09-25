import { POSTS, PRODUCTS, SEARCH_PAGES } from '../data/site';

// Site search: runs in the browser over the product list, the articles and a short list of pages - no server involved.
// Every word you type must match the start of a word in the item ("ros" finds Roses, "wed gift" finds wedding gifts),
// and plurals work both ways ("roses" finds "rose", "bouquet" finds "bouquets").

const normalise = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stem = (w) => (w.length > 3 ? w.replace(/(es|s)$/, '') : w);

const tokens = (query) => normalise(query).split(' ').filter(Boolean);

// 0 = no match. Higher = better: whole-word hits beat prefix hits, and the item's title beats the rest of its text.
function score(queryTokens, title, extra) {
  const titleWords = normalise(title).split(' ');
  const otherWords = normalise(extra).split(' ');
  let total = 0;
  for (const token of queryTokens) {
    const s = stem(token);
    const inTitle = (w) => w === token || w === s || w.startsWith(token) || w.startsWith(s) || (s.length > 2 && stem(w) === s);
    const inOther = (w) => w.startsWith(token) || w.startsWith(s) || (s.length > 2 && stem(w) === s);
    if (titleWords.some(inTitle)) total += titleWords.some((w) => w === token || w === s) ? 4 : 3;
    else if (otherWords.some(inOther)) total += 1;
    else return 0; // every word has to match something
  }
  return total;
}

const rank = (items, scoreOf) =>
  items
    .map((item, i) => ({ item, i, s: scoreOf(item) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.item);

export function search(query) {
  const q = tokens(query);
  if (!q.length) return { products: [], posts: [], pages: [] };
  return {
    products: rank(PRODUCTS, (p) => score(q, p.name, `${p.category} ${p.badge === 'NEW' ? 'new' : ''}`)),
    posts: rank(POSTS, (p) => score(q, p.title, `${p.tag} ${p.excerpt}`)),
    pages: rank(SEARCH_PAGES, (p) => score(q, p.label, p.keywords)),
  };
}

export const totalResults = (r) => r.products.length + r.posts.length + r.pages.length;
