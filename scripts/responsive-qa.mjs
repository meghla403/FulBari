// Responsive + behaviour QA: drives real Edge/Chrome at every size in the brief.
//   1) npm run build && npm run preview      (serves http://localhost:4173)
//   2) npm run qa                            (BASE=... other server, SHOTS=dir screenshots, ONLY=320,768 sizes)
// Layout checks run on every route; interaction flows cover menu, account dropdown, shop, auth and wishlist.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const BASE = process.env.BASE || 'http://localhost:4173';
const SHOTS = process.env.SHOTS || 'qa-shots';
const CHANNEL = process.env.BROWSER_CHANNEL || 'msedge';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
mkdirSync(SHOTS, { recursive: true });

const SIZES = [
  [320, 568], [360, 740], [375, 667], [390, 844], [414, 896], [430, 932],
  [640, 900], [768, 1024], [1024, 768], [1280, 800], [1440, 900],
].filter(([w]) => !ONLY || ONLY.includes(w));
const SHOT_WIDTHS = new Set([320, 375, 768, 1440]);

// Every page state that gets the layout checks.
const SPECS = [
  { name: '/', path: '/', kind: 'home', slug: 'home' },
  { name: '/sign-in', path: '/sign-in', kind: 'inner', slug: 'sign-in' },
  { name: '/register', path: '/register', kind: 'inner', slug: 'register' },
  { name: '/account (signed in)', path: '/account', kind: 'inner', slug: 'account', user: { name: 'Jane Doe', email: 'jane.doe@example.com' } },
  { name: '/account?tab=address', path: '/account?tab=address', kind: 'inner', slug: 'account-address', user: { name: 'Jane Doe', email: 'jane.doe@example.com' } },
  { name: '/account?tab=details', path: '/account?tab=details', kind: 'inner', slug: 'account-details', user: { name: 'Jane Doe', email: 'jane.doe@example.com' } },
  { name: '/account?tab=orders', path: '/account?tab=orders', kind: 'inner', slug: 'account-orders', user: { name: 'Jane Doe', email: 'jane.doe@example.com' } },
  { name: '/wishlist (empty)', path: '/wishlist', kind: 'inner', slug: 'wishlist-empty' },
  { name: '/wishlist (3 saved)', path: '/wishlist', kind: 'inner', slug: 'wishlist', wishlist: ['bouquet-ivory', 'aloknonda-pink', 'plant-orchid'] },
  { name: '/about', path: '/about', kind: 'inner', slug: 'about' },
  { name: '/news', path: '/news', kind: 'inner', slug: 'news' },
  { name: '/news/<article>', path: '/news/low-light-plants', kind: 'inner', slug: 'article' },
  { name: '/contact', path: '/contact', kind: 'inner', slug: 'contact' },
  { name: '/shop/<product>', path: '/shop/rose-crimson', kind: 'inner', slug: 'product' },
  { name: '/cart (empty)', path: '/cart', kind: 'inner', slug: 'cart-empty' },
  { name: '/cart (2 lines)', path: '/cart', kind: 'inner', slug: 'cart', cart: [{ id: 'rose-crimson', qty: 2 }, { id: 'plant-orchid', qty: 1 }] },
  { name: '/search?q=rose', path: '/search?q=rose', kind: 'inner', slug: 'search' },
  { name: '/search (empty)', path: '/search', kind: 'inner', slug: 'search-empty' },
  { name: '/404', path: '/no-such-page', kind: 'inner', slug: '404' },
];

const results = [];
const fail = (size, test, detail) => results.push({ size, test, detail });

/* ---------- checks that run inside the page ---------- */
function pageChecks({ kind, expectedWidth }) {
  const out = [];
  const vw = document.documentElement.clientWidth;
  const iw = window.innerWidth;
  const home = kind === 'home';
  const vis = (el) => el.checkVisibility({ visibilityProperty: true });
  const desc = (el) => {
    const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    const c = (typeof el.className === 'string' ? el.className : '').split(/\s+/).slice(0, 3).join('.');
    return `<${el.tagName.toLowerCase()}${c ? '.' + c : ''}>${t ? ' "' + t + '"' : ''}`;
  };
  const all = [...document.querySelectorAll('body *')].filter((el) => !el.closest('svg') || el.tagName === 'svg');
  const live = all.filter((el) => vis(el) && !el.closest('dialog:not([open]), [inert], .sr-only'));

  // 1. Horizontal overflow (per element, because overflow-x-clip on the wrapper would hide a scrollWidth signal).
  // On phones an overflowing page makes Chrome WIDEN the layout viewport, so also assert it still equals the device width.
  if (iw !== expectedWidth) out.push(['overflow', `layout viewport is ${iw}px instead of ${expectedWidth}px - something on the page is wider than the screen`]);
  if (document.documentElement.scrollWidth > iw + 1) out.push(['overflow', `documentElement.scrollWidth ${document.documentElement.scrollWidth} > ${iw}`]);
  window.scrollTo(300, 0);
  if (window.scrollX > 0) out.push(['overflow', `page scrolls horizontally (scrollX=${window.scrollX})`]);
  window.scrollTo(0, 0);
  // sr-only text is 1px and pulled 1px left by design, so for it only a position beyond the right edge counts.
  for (const el of all.filter((e) => vis(e) && !e.closest('dialog:not([open]), [inert]'))) {
    const srOnly = el.classList.contains('sr-only');
    const scroller = el.closest('[data-scroller]');
    if (scroller && !el.matches('[data-scroller]')) {
      if (!srOnly) continue; // intentional scroll content
      // sr-only text is absolutely positioned: it is only harmless if the scroller itself contains it
      // (its containing block is inside the scroller). If it escapes, it widens the page - that was the bug.
      if (scroller.contains(el.offsetParent)) continue;
    }
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    if (srOnly ? r.left > vw + 0.5 : r.right > vw + 0.5 || r.left < -0.5) out.push(['overflow', `${desc(el)} spans ${Math.round(r.left)}..${Math.round(r.right)} (viewport ${vw})`]);
  }

  // 4. Text clipped by its own box.
  for (const el of live) {
    if (el.matches('[data-scroller]') || el.closest('[data-scroller]')) continue;
    const cs = getComputedStyle(el);
    if (cs.overflowX !== 'visible' && cs.overflowX !== 'clip' && el.scrollWidth > el.clientWidth + 1 && (el.textContent || '').trim())
      out.push(['text', `${desc(el)} clips its content (${el.scrollWidth} > ${el.clientWidth})`]);
  }

  // 5. Images: loaded, not stretched, not outside their parent.
  for (const img of document.querySelectorAll('img')) {
    if (!vis(img)) continue;
    const r = img.getBoundingClientRect();
    if (!img.complete || !img.naturalWidth) { out.push(['image', `not loaded: ${img.getAttribute('src')}`]); continue; }
    const fit = getComputedStyle(img).objectFit;
    if (fit === 'fill') {
      const nat = img.naturalWidth / img.naturalHeight;
      if (Math.abs(r.width / r.height - nat) / nat > 0.03) out.push(['image', `stretched ${img.getAttribute('src')} ${Math.round(r.width)}x${Math.round(r.height)} vs ${nat.toFixed(2)}`]);
    }
    const p = img.parentElement.getBoundingClientRect();
    if (r.left < p.left - 1 || r.right > p.right + 1 || r.top < p.top - 1 || r.bottom > p.bottom + 1)
      if (getComputedStyle(img.parentElement).overflow === 'visible') out.push(['image', `${img.getAttribute('src')} escapes its parent`]);
  }

  // 3. Header layout.
  const burger = document.querySelector('header button[aria-controls="mobile-menu"]');
  const nav = document.querySelector('header nav[aria-label="Primary"]');
  const desktop = iw >= 1024;
  if (desktop && (!vis(nav) || vis(burger))) out.push(['header', 'desktop: nav should show and burger hide']);
  const quote = [...document.querySelectorAll('header a')].find((a) => a.textContent.trim() === 'Get a Quote');
  if (!quote) out.push(['header', 'Get a Quote button missing from the header']);
  if (desktop && quote && !vis(quote)) out.push(['header', 'Get a Quote should show on desktop']);
  if (quote && !desktop && vis(quote)) out.push(['header', 'Get a Quote must be hidden below lg (it lives in the drawer)']);
  if (!desktop && vis(document.querySelector('header button[aria-label="Search"]'))) out.push(['header', 'Search icon should be hidden below lg']);
  if (!vis(document.querySelector('header button[aria-label="My account"]'))) out.push(['header', 'profile icon should be visible at every size']);
  if (!desktop && (vis(nav) || !vis(burger))) out.push(['header', 'mobile/tablet: burger should show and nav hide']);
  if (desktop) {
    const box = document.querySelector('header > div');
    if (box.scrollWidth > box.clientWidth + 1) out.push(['header', `header content overflows ${box.scrollWidth} > ${box.clientWidth}`]);
    const parts = [document.querySelector('header a[aria-label$="home"]'), nav, ...document.querySelectorAll('header > div > div > *')].filter((e) => e && vis(e));
    const rs = parts.map((e) => [desc(e), e.getBoundingClientRect()]).sort((a, b) => a[1].left - b[1].left);
    for (let i = 1; i < rs.length; i++)
      if (rs[i][1].left < rs[i - 1][1].right - 0.5) out.push(['header', `${rs[i - 1][0]} overlaps ${rs[i][0]}`]);
  }

  // Inner pages: dark banner, light header text on top of it, breadcrumb, one h1.
  if (!home) {
    if (document.querySelectorAll('h1').length !== 1) out.push(['page', `expected exactly one <h1>, found ${document.querySelectorAll('h1').length}`]);
    const banner = document.querySelector('main img[src*="page-banner"]');
    if (!banner) out.push(['page', 'page banner image missing']);
    else {
      const sec = banner.closest('section');
      const br = banner.getBoundingClientRect();
      const sr = sec.getBoundingClientRect();
      if (!banner.complete || !banner.naturalWidth) out.push(['page', 'page banner photo did not load']);
      if (!/page-banner-(1000|1600|2172)\.webp$/.test(banner.currentSrc)) out.push(['page', `banner file is ${banner.currentSrc.split('/').pop()}`]);
      if (getComputedStyle(banner).objectFit !== 'cover') out.push(['page', 'banner photo must be object-fit: cover']);
      if (Math.abs(br.width - sr.width) > 1 || Math.abs(br.height - sr.height) > 1) out.push(['page', 'banner photo does not fill the whole banner']);
      if (iw < 1024 && !banner.currentSrc.endsWith('-1000.webp')) out.push(['page', 'phones and tablets should download the 1000px banner']);
      // Title and breadcrumb share the dark left side: stacked, left-aligned, breadcrumb below the title.
      const h1r = document.querySelector('h1').getBoundingClientRect();
      const cr = document.querySelector('nav[aria-label="Breadcrumb"]').getBoundingClientRect();
      if (Math.abs(cr.left - h1r.left) > 2) out.push(['page', 'breadcrumb should line up under the title (left side)']);
      if (cr.top < h1r.bottom - 1) out.push(['page', 'breadcrumb should sit below the title']);
      if (cr.left > vw / 2) out.push(['page', 'breadcrumb has drifted onto the flowers on the right']);
    }
    const wordmark = document.querySelector('header a[aria-label$="home"] span');
    if (getComputedStyle(wordmark).color !== 'rgb(255, 255, 255)') out.push(['page', 'logo should be white over the dark banner']);
    if (desktop && getComputedStyle(nav.querySelector('a')).color !== 'rgb(255, 255, 255)') out.push(['page', 'nav links should be white over the dark banner']);
    const crumbs = document.querySelectorAll('nav[aria-label="Breadcrumb"] li');
    if (crumbs.length < 2 || !crumbs[crumbs.length - 1].querySelector('[aria-current="page"]')) out.push(['page', 'breadcrumb should end with the current page']);
    const h1 = document.querySelector('h1').getBoundingClientRect();
    if (h1.top < 72) out.push(['page', 'banner title hides under the header']);
  }

  // Forms: labelled, >= 16px text (no iOS zoom), >= 44px tall.
  for (const input of document.querySelectorAll('main form input:not([type=checkbox]), main form select, main form textarea')) {
    if (!vis(input)) continue;
    if (!input.labels || !input.labels.length) out.push(['form', `${input.id || input.name} has no <label>`]);
    if (parseFloat(getComputedStyle(input).fontSize) < 16) out.push(['form', `${input.id} font < 16px (iOS zooms on focus)`]);
    if (input.getBoundingClientRect().height < 44) out.push(['form', `${input.id} is shorter than 44px`]);
  }

  // 6. Product grids: column count per breakpoint (never more columns than cards).
  const want = iw < 375 ? 1 : iw < 768 ? 2 : iw < 1024 ? 3 : 4;
  // Only product grids count (the Account page has a stat-card grid that is not one).
  const productGrid = (root) => [...root.querySelectorAll('ul.grid')].find((u) => u.querySelector('article button[aria-label^="Quick view"]'));
  const grids = home ? ['#shop', '#featured'] : productGrid(document.querySelector('main')) ? ['main'] : [];
  for (const sel of grids) {
    const ul = productGrid(document.querySelector(sel));
    const cards = [...ul.children].filter(vis);
    const cols = new Set(cards.map((li) => Math.round(li.getBoundingClientRect().left))).size;
    const expected = Math.min(want, cards.length);
    if (cols !== expected) out.push(['grid', `${sel} has ${cols} columns, expected ${expected}`]);
    const rows = {};
    cards.forEach((li) => { const t = Math.round(li.getBoundingClientRect().top); (rows[t] ||= []).push(li.getBoundingClientRect().height); });
    Object.values(rows).forEach((hs) => { if (Math.max(...hs) - Math.min(...hs) > 1) out.push(['grid', `${sel} cards in one row differ in height`]); });
  }

  // 7. Tap targets (>= 44px). Checkboxes count through their label row.
  for (const el of live.filter((e) => e.matches('a[href], button, input, select, textarea'))) {
    if (el.closest('[data-scroller]') === el || el.classList.contains('sr-only')) continue;
    const r = (el.type === 'checkbox' ? el.closest('label') : el).getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) out.push(['tap', `${desc(el)} is ${Math.round(r.width)}x${Math.round(r.height)}`]);
  }

  // 11. Footer (global).
  const input = document.getElementById('newsletter-email');
  const ir = input.getBoundingClientRect();
  const sub = document.querySelector('footer button[aria-label="Subscribe"]').getBoundingClientRect();
  if (ir.width < 180) out.push(['footer', `newsletter input only ${Math.round(ir.width)}px`]);
  if (sub.right > vw || sub.width < 44) out.push(['footer', 'subscribe button not fully visible']);
  const fcols = new Set([...document.querySelectorAll('footer nav')].map((n) => Math.round(n.getBoundingClientRect().left))).size;
  const wantF = iw < 640 ? 1 : 3;
  if (fcols !== wantF) out.push(['footer', `${fcols} link columns, expected ${wantF}`]);
  const brand = document.querySelector('footer a[aria-label$="home"]').getBoundingClientRect().top;
  const news = document.querySelector('footer form').getBoundingClientRect().top;
  const links = document.querySelector('footer nav').getBoundingClientRect().top;
  if (iw < 640 && !(brand < links && links < news)) out.push(['footer', 'mobile order should be brand -> links -> newsletter']);

  // 15. Text elements must not overlap each other.
  const texts = live.filter((el) => {
    if (el.closest('[aria-hidden="true"]') || el.classList.contains('sr-only') || el.closest('.sr-only')) return false;
    if (getComputedStyle(el).display === 'inline') return false; // inline boxes are covered by their parent
    return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  });
  const rects = texts.map((el) => [el, el.getBoundingClientRect()]);
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      const [a, ra] = rects[i], [b, rb] = rects[j];
      if (a.contains(b) || b.contains(a)) continue;
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (w > 2 && h > 2) out.push(['overlap', `${desc(a)} overlaps ${desc(b)}`]);
    }

  let info = null;
  if (home) {
    // 8. Category tabs.
    const tabs = document.querySelector('#shop [data-scroller]');
    const tabScroll = tabs.scrollWidth > tabs.clientWidth + 1;
    if (iw < 640 && !tabScroll) out.push(['tabs', 'tabs should scroll horizontally on small screens']);
    if (iw >= 1024) {
      if (tabScroll) out.push(['tabs', 'tabs should not scroll on desktop']);
      const list = tabs.firstElementChild.getBoundingClientRect();
      if (Math.abs(list.left + list.width / 2 - vw / 2) > 24) out.push(['tabs', 'tabs not centred']);
    }
    const btns = [...tabs.querySelectorAll('button')];
    if (btns.some((b) => b.getBoundingClientRect().height > 60)) out.push(['tabs', 'a tab label wraps onto two lines']);
    const active = btns.find((b) => b.getAttribute('aria-pressed') === 'true');
    if (!active || getComputedStyle(active).borderBottomColor === 'rgba(0, 0, 0, 0)') out.push(['tabs', 'active tab has no bottom border']);

    // 9. Countdown.
    const cd = document.querySelector('[role="timer"]');
    const circles = [...cd.querySelectorAll('span.grid')];
    const cdr = cd.getBoundingClientRect();
    const size = Math.round(circles[0].getBoundingClientRect().width);
    const wantSize = iw >= 1024 ? 100 : iw >= 640 ? 80 : 64;
    if (size !== wantSize) out.push(['countdown', `circle ${size}px, expected ${wantSize}px`]);
    circles.forEach((c) => { const r = c.getBoundingClientRect(); if (r.left < cdr.left - 1 || r.right > cdr.right + 1) out.push(['countdown', 'circle outside its box']); });
    const cdCols = new Set(circles.map((c) => Math.round(c.getBoundingClientRect().left))).size;
    if (cdCols !== (iw < 375 ? 2 : 4)) out.push(['countdown', `${cdCols} columns`]);

    // 10. Testimonials.
    document.querySelectorAll('#reviews li').forEach((li) => {
      if (li.getBoundingClientRect().width < 240) out.push(['testimonials', 'card narrower than 240px']);
      if (parseFloat(getComputedStyle(li.querySelector('blockquote')).fontSize) < 14) out.push(['testimonials', 'quote font < 14px']);
    });
    const r0 = document.querySelector('#reviews li').getBoundingClientRect();
    if (iw < 640 && Math.abs(r0.width / (vw - 32) - 0.85) > 0.03) out.push(['testimonials', 'card should be ~85% of the row on phones']);

    const fs = (sel) => { const e = document.querySelector(sel); return e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : null; };
    info = {
      h1: fs('h1'), h2: fs('#gallery h2'), body: fs('#home p:nth-of-type(2)'), nav: desktop ? fs('header nav a') : null,
      product: fs('#shop article h3'), price: fs('#shop article p span'),
      fontsLoaded: document.fonts.check('700 16px Rajdhani') && document.fonts.check('400 16px "Open Sans"'),
      pageHeight: document.documentElement.scrollHeight,
    };
  }
  return { out, info };
}

/* ---------- helpers ---------- */
const pathOf = (page) => new URL(page.url()).pathname;

async function open(page, spec) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ user, wishlist, cart }) => {
      localStorage.clear();
      if (cart) localStorage.setItem('fulbari.cart', JSON.stringify(cart));
      if (user) localStorage.setItem('fulbari.user', JSON.stringify(user));
      if (wishlist) localStorage.setItem('fulbari.wishlist', JSON.stringify(wishlist));
    },
    { user: spec.user || null, wishlist: spec.wishlist || null, cart: spec.cart || null },
  );
  await page.goto(BASE + spec.path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager')));
  await page.waitForFunction(() => [...document.images].filter((i) => i.checkVisibility()).every((i) => i.complete), null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(300);
}

const accountBtn = 'header button[aria-label="My account"]';
const menuItems = (page) => page.evaluate(() => [...document.querySelectorAll('#account-menu a, #account-menu button')].map((e) => e.textContent.trim()));

/* ---------- interactive behaviour ---------- */
async function menuTests(page, size, vw, vh) {
  const state = () =>
    page.evaluate(() => {
      const a = document.getElementById('mobile-menu');
      const r = a.getBoundingClientRect();
      return {
        visible: a.checkVisibility({ visibilityProperty: true }),
        left: Math.round(r.left), right: Math.round(r.right),
        overflow: getComputedStyle(document.body).overflow,
        expanded: document.querySelector('[aria-controls="mobile-menu"]').getAttribute('aria-expanded'),
        links: [...a.querySelectorAll('nav a, a[href="/contact?topic=quote"]')].filter((x) => x.closest('#mobile-menu')).map((x) => [x.textContent.trim(), Math.round(x.getBoundingClientRect().height), Math.round(x.getBoundingClientRect().bottom)]),
      };
    });
  const openMenu = async () => { await page.click('header button[aria-controls="mobile-menu"]'); await page.waitForTimeout(450); };

  await openMenu();
  let s = await state();
  if (!s.visible) fail(size, 'menu', 'does not open on burger click');
  if (s.expanded !== 'true') fail(size, 'menu', 'aria-expanded not true when open');
  if (s.overflow !== 'hidden') fail(size, 'menu', 'body scroll not locked while open');
  if (s.left < 0 || s.right > vw + 1) fail(size, 'menu', `drawer outside viewport (${s.left}..${s.right}/${vw})`);
  const names = s.links.map((l) => l[0]).join(',');
  if (names !== 'Home,About,Shop,News,Pages,Contact,Get a Quote') fail(size, 'menu', `items are: ${names}`);
  s.links.forEach(([n, h]) => h < 44 && fail(size, 'menu', `${n} touch height ${h}px`));
  if (s.links.some((l) => l[2] > vh)) fail(size, 'menu', 'an item is below the fold (drawer would need scrolling)');

  await page.click('button[aria-label="Close menu"]');
  await page.waitForTimeout(450);
  s = await state();
  if (s.visible || s.expanded !== 'false' || s.overflow === 'hidden') fail(size, 'menu', 'X button does not fully close the menu');

  await openMenu();
  await page.click('#mobile-menu >> text=Shop');
  await page.waitForTimeout(900);
  s = await state();
  const top = await page.evaluate(() => Math.round(document.getElementById('shop').getBoundingClientRect().top));
  if (s.visible || s.overflow === 'hidden') fail(size, 'menu', 'menu stays open after choosing an item');
  if (top > 140 || top < -400) fail(size, 'menu', `did not scroll to #shop (top=${top})`);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(500);

  await openMenu();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  if ((await state()).visible) fail(size, 'menu', 'Escape does not close the menu');

  await openMenu();
  await page.mouse.click(4, Math.round(vh / 2));
  await page.waitForTimeout(450);
  if ((await state()).visible) fail(size, 'menu', 'tapping the overlay does not close the menu');

  // Drawer links to home sections work from an inner page too.
  await page.goto(BASE + '/wishlist', { waitUntil: 'networkidle' });
  await openMenu();
  await page.click('#mobile-menu >> text=Shop');
  await page.waitForTimeout(1000);
  const landed = await page.evaluate(() => { const t = document.getElementById('shop')?.getBoundingClientRect().top; return t !== undefined && t < 200 && t > -400; });
  if (pathOf(page) !== '/' || !landed) fail(size, 'menu', 'Shop link from an inner page does not land on the home #shop section');
}

async function accountTests(page, size, vw, vh) {
  const state = () =>
    page.evaluate(() => {
      const btn = document.querySelector('header button[aria-label="My account"]');
      const menu = document.getElementById('account-menu');
      const b = btn.getBoundingClientRect();
      const m = menu && menu.getBoundingClientRect();
      return {
        expanded: btn.getAttribute('aria-expanded'), btnBg: getComputedStyle(btn).backgroundColor, open: Boolean(menu),
        items: menu ? [...menu.querySelectorAll('a, button')].map((a) => [a.textContent.trim(), Math.round(a.getBoundingClientRect().height)]) : [],
        panel: m && { left: Math.round(m.left), right: Math.round(m.right), top: Math.round(m.top) },
        btnBox: { right: Math.round(b.right), bottom: Math.round(b.bottom) },
      };
    });
  let s = await state();
  if (s.open || s.expanded !== 'false') fail(size, 'account', 'dropdown should start closed');
  await page.click(accountBtn);
  await page.waitForTimeout(250);
  s = await state();
  if (!s.open || s.expanded !== 'true') return fail(size, 'account', 'profile icon click does not open the dropdown');
  if (s.items.map((i) => i[0]).join(',') !== 'Sign in,Register,My Account,Wishlist') fail(size, 'account', `items are: ${s.items.map((i) => i[0])}`);
  s.items.forEach(([n, h]) => h < 44 && fail(size, 'account', `${n} is only ${h}px tall`));
  if (s.panel.left < 0 || s.panel.right > vw) fail(size, 'account', `panel outside the viewport (${s.panel.left}..${s.panel.right} of ${vw})`);
  if (Math.abs(s.panel.right - s.btnBox.right) > 1) fail(size, 'account', 'panel is not right-aligned to the profile button');
  if (Math.abs(s.panel.top - s.btnBox.bottom) > 1) fail(size, 'account', 'panel does not start at the bottom edge of the button');
  if (s.btnBg !== 'rgb(128, 181, 0)') fail(size, 'account', `open button should be lime, is ${s.btnBg}`);
  await page.click(accountBtn);
  await page.waitForTimeout(150);
  if ((await state()).open) fail(size, 'account', 'second click should close the dropdown');
  await page.click(accountBtn);
  await page.mouse.click(Math.round(vw / 2), Math.round(vh - 20));
  await page.waitForTimeout(150);
  if ((await state()).open) fail(size, 'account', 'clicking outside does not close the dropdown');
  await page.click(accountBtn);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const afterEsc = await page.evaluate(() => ({ open: !!document.getElementById('account-menu'), focused: document.activeElement?.getAttribute('aria-label') }));
  if (afterEsc.open || afterEsc.focused !== 'My account') fail(size, 'account', 'Escape should close the dropdown and refocus the button');

  // Each item goes to its own page (My Account bounces signed-out visitors to Sign in).
  for (const [label, path] of [['Sign in', '/sign-in'], ['Register', '/register'], ['My Account', '/sign-in'], ['Wishlist', '/wishlist']]) {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.click(accountBtn);
    await page.click(`#account-menu >> text="${label}"`);
    await page.waitForTimeout(250);
    if (pathOf(page) !== path) fail(size, 'account', `"${label}" went to ${pathOf(page)}, expected ${path}`);
    if (await page.evaluate(() => !!document.getElementById('account-menu'))) fail(size, 'account', `dropdown stays open after choosing ${label}`);
  }
}

async function shopTests(page, size, touch) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.click('#shop button:text-is("Roses")');
  const roses = await page.evaluate(() => document.querySelectorAll('#shop ul.grid > li').length);
  if (roses !== 6) fail(size, 'shop', `Roses tab shows ${roses} products, expected 6`);
  await page.click('#shop button:text-is("All")');
  const all1 = await page.evaluate(() => document.querySelectorAll('#shop ul.grid > li').length);
  await page.click('button[aria-label="Next products"]');
  const all2 = await page.evaluate(() => document.querySelectorAll('#shop ul.grid > li').length);
  await page.click('button[aria-label="Next products"]');
  const all3 = await page.evaluate(() => document.querySelectorAll('#shop ul.grid > li').length);
  if (all1 !== 8 || all2 !== 8 || all3 !== 8) fail(size, 'shop', `paging shows ${all1}, ${all2}, then ${all3} products, expected 8, 8, 8 (then 6 on page 4)`);
  await page.click('button[aria-label="Next products"]');
  const all4 = await page.evaluate(() => document.querySelectorAll('#shop ul.grid > li').length);
  if (all4 !== 6) fail(size, 'shop', `last page shows ${all4} products, expected 6`);
  for (let i = 0; i < 3; i++) await page.click('button[aria-label="Previous products"]');

  const opacity = () => page.evaluate(() => getComputedStyle(document.querySelector('#shop article div.absolute.inset-x-0')).opacity);
  await page.locator('#shop article').first().scrollIntoViewIfNeeded();
  if (touch) {
    if ((await opacity()) !== '1') fail(size, 'touch', 'product actions are hidden on a touch device');
    const b = await page.evaluate(() => [...document.querySelectorAll('#shop article div.absolute.inset-x-0 button')].map((x) => Math.round(x.getBoundingClientRect().width)));
    if (b.some((w) => w < 44)) fail(size, 'touch', `product action buttons ${b.join('/')}px`);
    const fits = await page.evaluate(() => { const a = document.querySelector('#shop article'); const ar = a.getBoundingClientRect(); return [...a.querySelectorAll('div.absolute.inset-x-0 button')].every((x) => { const r = x.getBoundingClientRect(); return r.left >= ar.left - 1 && r.right <= ar.right + 1; }); });
    if (!fits) fail(size, 'touch', 'product action row does not fit inside the card');
  } else {
    await page.mouse.move(2, 2);
    await page.waitForTimeout(300);
    if ((await opacity()) !== '0') fail(size, 'hover', 'actions should be hidden until hover on mouse devices');
    await page.locator('#shop article').first().hover();
    await page.waitForTimeout(350);
    if ((await opacity()) !== '1') fail(size, 'hover', 'actions should appear on hover');
  }

  await page.locator('#shop article button[aria-label^="Add "][aria-label$="to cart"]').first().click();
  const count = await page.evaluate(() => document.querySelector('header a[aria-label^="Cart"] span').textContent);
  if (count.trim() !== '1') fail(size, 'shop', `cart count is "${count}" after adding`);
  await page.locator('#shop article button[aria-label^="Quick view"]').first().click();
  await page.waitForTimeout(300);
  const dlg = await page.evaluate(() => { const d = document.querySelector('dialog[open]'); if (!d) return null; const r = d.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top }; });
  if (!dlg) fail(size, 'quickview', 'quick view did not open');
  else if (dlg.l < 0 || dlg.r > (await page.evaluate(() => innerWidth)) || dlg.t < 0) fail(size, 'quickview', 'dialog outside the viewport');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  if (await page.evaluate(() => !!document.querySelector('dialog[open]'))) fail(size, 'quickview', 'Esc does not close quick view');
}

// Tabs whose products are full-frame photos: they fill their tile (object-cover), are never stretched, and the
// cards behave like every other product card.
const PHOTO_TABS = [
  { tab: 'Bouquets', prefix: 'bouquet', names: ['Ivory Elegance Bouquet', 'Ruby Romance Bouquet', 'Rainbow Gerbera Bouquet', 'Lavender Rose Bouquet', 'Pink Lily Bouquet', 'Golden Sunflower Bouquet'] },
  { tab: 'Gifts', prefix: 'gift', names: ['Rose & Chocolate Hat Box', 'Heart Tulip & Chocolate Box', 'Orchid & Chocolate Gift Box', 'Sunflower & Chocolate Crate'] },
  { tab: 'Wedding', prefix: 'wedding', names: ['Peach Blush Rose Bouquet', 'Burgundy Velvet Rose Bouquet'] },
  { tab: 'Plants', prefix: 'plant', names: ['Pink Orchid Plant', 'Jade Bonsai Plant', 'Peace Lily in Ceramic Pot', 'Red Anthurium Plant', 'Golden Pothos Plant', 'Variegated Snake Plant'] },
  { tab: 'Roses', prefix: 'rose', names: ['Crimson Velvet Rose Bouquet', 'Blush Pink Rose Bouquet', 'Pure White Rose Bouquet', 'Golden Sunshine Rose Bouquet', 'Passion Red Rose Bouquet', 'Red Aloknonda Wedding Gift'] },
];

async function photoTabTests(page, size, vw, { tab, prefix, names }) {
  const label = `${tab} tab`;
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.click(`#shop button:text-is("${tab}")`);
  await page.evaluate(() => document.querySelectorAll('#shop img[loading="lazy"]').forEach((i) => (i.loading = 'eager')));
  await page.waitForFunction((n) => { const imgs = [...document.querySelectorAll('#shop article img')]; return imgs.length === n && imgs.every((i) => i.complete && i.currentSrc); }, names.length, { timeout: 8000 }).catch(() => {});
  const g = await page.evaluate(() => {
    const ul = document.querySelector('#shop ul.grid');
    return [...ul.children].map((li) => {
      const a = li.querySelector('article');
      const img = a.querySelector('img');
      const tile = img.parentElement.getBoundingClientRect();
      const r = img.getBoundingClientRect();
      return {
        name: a.querySelector('h3').textContent.trim(),
        src: img.currentSrc.split('/').pop(),
        fit: getComputedStyle(img).objectFit,
        loaded: img.complete && img.naturalWidth > 0,
        fills: Math.abs(r.width - tile.width) < 1.5 && Math.abs(r.height - tile.height) < 1.5,
        left: Math.round(li.getBoundingClientRect().left),
      };
    });
  });
  if (g.map((x) => x.name).join(',') !== names.join(',')) fail(size, label, `shows: ${g.map((x) => x.name).join(', ')}`);
  const fileRe = new RegExp(`^${prefix}-[a-z-]+-(400|800)\\.webp$`);
  if (g.some((x) => !fileRe.test(x.src))) fail(size, label, `unexpected image files: ${g.map((x) => x.src)}`);
  if (vw < 640 && g.some((x) => !x.src.endsWith('-400.webp'))) fail(size, label, 'phones should download the small 400px files');
  if (g.some((x) => x.fit !== 'cover')) fail(size, label, 'photos must fill the tile with object-fit: cover');
  if (g.some((x) => !x.fills)) fail(size, label, 'a photo does not fill its whole tile');
  if (g.some((x) => !x.loaded)) fail(size, label, 'a photo failed to load');
  const wantCols = Math.min(names.length, vw < 375 ? 1 : vw < 768 ? 2 : vw < 1024 ? 3 : 4);
  const cols = new Set(g.map((x) => x.left)).size;
  if (cols !== wantCols) fail(size, label, `${cols} columns, expected ${wantCols}`);
  const cart = () => page.evaluate(() => Number(document.querySelector('header a[aria-label^="Cart"] span').textContent));
  const before = await cart();
  await page.locator('#shop article button[aria-label^="Add "][aria-label$="to cart"]').first().click();
  if ((await cart()) !== before + 1) fail(size, label, 'add to cart does not work on these cards');
  await page.locator('#shop article button[aria-label^="Quick view"]').nth(1).click();
  await page.waitForTimeout(300);
  const qv = await page.evaluate(() => { const d = document.querySelector('dialog[open]'); const i = d?.querySelector('img'); return d ? { text: d.innerText, fit: getComputedStyle(i).objectFit, w: Math.round(i.getBoundingClientRect().width) } : null; });
  if (!qv || !qv.text.includes(names[1]) || qv.fit !== 'cover' || qv.w < 150) fail(size, label, 'quick view of a photo product is wrong');
  await page.keyboard.press('Escape');
}

// Gallery, deal, featured products and blog use the real photos (never the old illustrations): the right file in the
// right place, filling its frame, never stretched, and no photo repeated across these four sections.
async function sectionPhotoTests(page, size, vw) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager')));
  await page.waitForFunction(() => [...document.querySelectorAll('#gallery img, #deal img, #featured img, #news img')].every((i) => i.complete && i.currentSrc), null, { timeout: 8000 }).catch(() => {});
  const s = await page.evaluate(() => {
    const info = (id) =>
      [...document.querySelectorAll(`#${id} img`)]
        .filter((i) => i.checkVisibility())
        .map((i) => {
          const r = i.getBoundingClientRect();
          const p = i.parentElement.getBoundingClientRect();
          return {
            file: i.currentSrc.split('/').pop().replace(/-(400|800)\.webp$/, ''),
            ext: i.currentSrc.split('.').pop(),
            res: (i.currentSrc.match(/-(400|800)\./) || [])[1],
            fit: getComputedStyle(i).objectFit,
            ratio: r.width / r.height,
            fills: Math.abs(r.width - p.width) < 1.5 && Math.abs(r.height - p.height) < 1.5,
            loaded: i.complete && i.naturalWidth > 0,
          };
        });
    return { gallery: info('gallery'), deal: info('deal'), featured: info('featured'), news: info('news') };
  });
  const tablet = vw >= 768 && vw < 1024;
  const want = {
    gallery: ['wedding-burgundy', 'gift-heart', 'wedding-peach', 'bouquet-gerbera', 'gift-orchid', 'rose-white'],
    deal: ['gift-sunflower'],
    featured: ['rose-crimson', 'bouquet-lily', 'plant-anthurium', 'gift-hatbox'].slice(0, tablet ? 3 : 4), // 3-column tablet grid drops the orphan
    news: ['bouquet-lavender', 'rose-golden', 'bouquet-ivory', 'plant-snake'].slice(0, tablet ? 4 : 3), // the 4th post only fills the 2-column tablet grid
  };
  const all = [];
  for (const [section, items] of Object.entries(s)) {
    const files = items.map((x) => x.file);
    if (files.join(',') !== want[section].join(',')) fail(size, 'sections', `${section} shows: ${files.join(', ')} (expected ${want[section].join(', ')})`);
    if (items.some((x) => x.ext !== 'webp')) fail(size, 'sections', `${section} still has a non-photo image (${items.map((x) => x.ext)})`);
    if (items.some((x) => !x.loaded)) fail(size, 'sections', `${section}: a photo failed to load`);
    if (items.some((x) => x.fit !== 'cover')) fail(size, 'sections', `${section}: photos must fill their frame (object-fit: cover)`);
    if (section !== 'gallery' && items.some((x) => !x.fills)) fail(size, 'sections', `${section}: a photo does not fill its frame`);
    if (vw < 640 && items.some((x) => x.res !== '400')) fail(size, 'sections', `${section}: phones should download the small 400px files`);
    all.push(...files);
  }
  if (s.gallery.some((x) => Math.abs(x.ratio - 1.5) > 0.03)) fail(size, 'sections', 'gallery photos are not 3:2');
  if (s.news.some((x) => Math.abs(x.ratio - 37 / 24) > 0.03)) fail(size, 'sections', 'blog photos do not share one aspect ratio');
  if (new Set(all).size !== all.length) fail(size, 'sections', `a photo is repeated across the four sections: ${all.filter((f, i) => all.indexOf(f) !== i)}`);
  // A featured card is the very same product as in the shop (same cart / wishlist).
  await page.locator('#featured article button[aria-pressed]').first().click();
  const liked = await page.evaluate(() => JSON.parse(localStorage.getItem('fulbari.wishlist') || '[]'));
  if (liked.join(',') !== 'rose-crimson') fail(size, 'sections', `hearting the first featured card saved: ${liked}`);
}

// About / News / Article / Contact: real pages, reachable from the header, the drawer, the footer and the home page.
async function pagesFlow(page, size, vw) {
  const pathname = () => new URL(page.url()).pathname;
  const search = () => new URL(page.url()).search;
  const h1 = async () => ((await page.locator('main h1').first().textContent()) || '').trim();
  const nav = async () => {
    if (vw < 1024) {
      await page.click('header button[aria-controls="mobile-menu"]');
      await page.waitForTimeout(450);
      return '#mobile-menu';
    }
    return 'header';
  };
  const go = async (label, path) => {
    await page.goto(BASE + '/wishlist', { waitUntil: 'networkidle' }); // start away from the target
    const scope = await nav();
    await page.click(`${scope} a:text-is("${label}")`);
    await page.waitForTimeout(400);
    if (pathname() !== path) fail(size, 'pages', `${label} in the ${vw < 1024 ? 'drawer' : 'header'} went to ${pathname()}, expected ${path}`);
    else if ((await h1()) !== label) fail(size, 'pages', `${path} h1 is "${await h1()}"`);
  };

  /* navigation */
  await go('About', '/about');
  await go('News', '/news');
  await go('Contact', '/contact');
  await page.goto(BASE + '/news', { waitUntil: 'networkidle' });
  const scope = await nav();
  await page.click(`${scope} a:text-is("Get a Quote")`);
  await page.waitForTimeout(400);
  const topic = await page.locator('#topic').inputValue().catch(() => '');
  if (pathname() !== '/contact' || search() !== '?topic=quote' || topic !== 'quote') fail(size, 'pages', `Get a Quote went to ${pathname()}${search()} with topic "${topic}"`);
  for (const [label, path] of [['About', '/about'], ['Blog', '/news'], ['Contact us', '/contact']]) {
    await page.goto(BASE + '/wishlist', { waitUntil: 'networkidle' });
    await page.click(`footer nav[aria-label="Company"] a:text-is("${label}")`);
    await page.waitForTimeout(300);
    if (pathname() !== path) fail(size, 'pages', `footer "${label}" went to ${pathname()}, expected ${path}`);
  }

  /* home: latest blog links into the articles, "View all news" into the News page */
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.click('#news a:text-is("View all news")');
  await page.waitForTimeout(300);
  if (pathname() !== '/news') fail(size, 'pages', `"View all news" went to ${pathname()}`);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const homeCards = await page.locator('#news article').count();
  if (homeCards !== 4) fail(size, 'pages', `home blog has ${homeCards} cards, expected 4`);

  /* News: filter + read more */
  await page.goto(BASE + '/news', { waitUntil: 'networkidle' });
  const cards = () => page.locator('main ul.grid > li').count();
  const tabs = (await page.locator('main [data-scroller] button').allInnerTexts()).join(',');
  if (tabs !== 'ALL,CARE TIPS,GUIDES,WEDDINGS,PLANTS,GIFTS') fail(size, 'news', `topic tabs are: ${tabs}`);
  if ((await cards()) !== 6) fail(size, 'news', `${await cards()} articles, expected 6`);
  for (const [tab, n] of [['Care Tips', 2], ['Guides', 1], ['Weddings', 1], ['Plants', 1], ['Gifts', 1], ['All', 6]]) {
    await page.click(`main button:text-is("${tab}")`);
    if ((await cards()) !== n) fail(size, 'news', `${tab} tab shows ${await cards()} articles, expected ${n}`);
  }
  const status = await page.locator('main [role="status"]').first().textContent();
  if (!status.includes('6 of 6')) fail(size, 'news', `screen-reader status says "${status}"`);
  const cols = new Set(await page.locator('main ul.grid > li').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)))).size;
  const wantCols = vw < 768 ? 1 : vw < 1024 ? 2 : 3;
  if (cols !== wantCols) fail(size, 'news', `${cols} columns, expected ${wantCols}`);
  await page.locator('main article a:has-text("Read more")').first().click();
  await page.waitForTimeout(300);
  if (pathname() !== '/news/keep-cut-flowers-fresh' || (await h1()) !== 'How to keep cut flowers fresh for two weeks') fail(size, 'news', `Read more opened ${pathname()} ("${await h1()}")`);
  const title = await page.title();
  if (!title.startsWith('How to keep cut flowers fresh')) fail(size, 'news', `article page title is "${title}"`);
  const paras = await page.locator('main article p').count();
  const heads = await page.locator('main article h2').count();
  if (heads !== 3 || paras < 6) fail(size, 'news', `article has ${heads} sections and ${paras} paragraphs`);
  const more = await page.locator('main ul.grid > li:visible').count();
  if (more !== (vw >= 768 && vw < 1024 ? 2 : 3)) fail(size, 'news', `"More Articles" shows ${more} cards`);
  const titles = await page.locator('main ul.grid article h3').allInnerTexts();
  if (titles.some((t) => t.includes('How to keep cut flowers fresh'))) fail(size, 'news', 'the current article is listed under "More Articles"');
  await page.click('main a:text-is("Back to all news")');
  await page.waitForTimeout(300);
  if (pathname() !== '/news') fail(size, 'news', '"Back to all news" did not return to /news');
  await page.goto(BASE + '/news/no-such-article', { waitUntil: 'networkidle' });
  if ((await h1()) !== 'Page not found') fail(size, 'news', `unknown article shows "${await h1()}" instead of the 404 page`);

  /* About */
  await page.goto(BASE + '/about', { waitUntil: 'networkidle' });
  const about = await page.evaluate(() => ({
    stats: document.querySelectorAll('main dl > div').length,
    steps: document.querySelectorAll('main ol.grid > li').length,
    story: !!document.querySelector('main img[alt*="pink roses"]'),
    reviews: document.querySelectorAll('#reviews li').length,
  }));
  if (about.stats !== 4 || about.steps !== 3 || !about.story || about.reviews !== 3) fail(size, 'about', `story ${about.story}, ${about.stats} stats, ${about.steps} steps, ${about.reviews} reviews`);
  await page.click('main section.bg-ink a:text-is("Get a quote")');
  await page.waitForTimeout(300);
  if (pathname() !== '/contact' || search() !== '?topic=quote') fail(size, 'about', 'the closing "Get a quote" button did not open the quote form');
  await page.goto(BASE + '/about', { waitUntil: 'networkidle' });
  await page.click('main section.bg-ink a:text-is("Shop now")');
  await page.waitForTimeout(700);
  if (pathname() !== '/' || !(await page.evaluate(() => { const t = document.getElementById('shop')?.getBoundingClientRect().top; return t !== undefined && t < 200 && t > -400; }))) fail(size, 'about', 'the closing "Shop now" button did not land on the shop');

  /* Contact */
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
  const info = await page.evaluate(() => ({
    tel: !!document.querySelector('main a[href="tel:+15550102030"]'),
    mail: !!document.querySelector('main a[href="mailto:hello@fulbari.example"]'),
    hours: document.querySelectorAll('main ul ul > li').length,
    faq: document.querySelectorAll('main details').length,
    topic: document.getElementById('topic').value,
  }));
  if (!info.tel || !info.mail || info.hours !== 2 || info.faq !== 4 || info.topic !== 'general') fail(size, 'contact', `contact details incomplete: ${JSON.stringify(info)}`);
  await page.goto(BASE + '/contact?topic=wedding', { waitUntil: 'networkidle' });
  if ((await page.locator('#topic').inputValue()) !== 'wedding') fail(size, 'contact', '?topic=wedding is not preselected');
  await page.goto(BASE + '/contact?topic=nonsense', { waitUntil: 'networkidle' });
  if ((await page.locator('#topic').inputValue()) !== 'general') fail(size, 'contact', 'an unknown ?topic should fall back to "General question"');
  const errorCount = () => page.locator('main [id$="-error"]').count();
  await page.click('main form button[type=submit]');
  if ((await errorCount()) !== 3) fail(size, 'contact', `empty form shows ${await errorCount()} errors, expected 3`);
  if ((await page.evaluate(() => document.activeElement?.id)) !== 'name') fail(size, 'contact', 'the first invalid field is not focused');
  await page.fill('#name', 'Sam Rivera');
  await page.fill('#email', 'not-an-email');
  await page.fill('#message', 'Hello');
  await page.click('main form button[type=submit]');
  if (!(await page.locator('#email-error').textContent()).includes('valid email') || (await errorCount()) !== 1) fail(size, 'contact', 'an invalid email is not explained (or other errors remain)');
  await page.fill('#email', 'sam@example.com');
  await page.selectOption('#topic', 'quote');
  await page.click('main form button[type=submit]');
  await page.locator('main [role="status"]').first().waitFor({ timeout: 4000 }).catch(() => {});
  if (!((await page.locator('main [role="status"]').first().textContent()) || '').includes('Thank you, Sam Rivera!')) fail(size, 'contact', 'no thank-you message after sending');
  await page.click('main button:text-is("Send another message")');
  if ((await page.locator('#name').inputValue()) !== '' || (await page.locator('#topic').inputValue()) !== 'quote') fail(size, 'contact', 'sending another message should clear the text and keep the topic');
  // FAQ accordion
  await page.locator('main details summary').first().click();
  const open = await page.evaluate(() => { const d = document.querySelector('main details'); return d.open && d.querySelector('p').checkVisibility(); });
  if (!open) fail(size, 'contact', 'clicking a FAQ question does not reveal its answer');
  const summaryH = await page.locator('main details summary').first().evaluate((e) => e.getBoundingClientRect().height);
  if (summaryH < 44) fail(size, 'contact', `FAQ question is only ${Math.round(summaryH)}px tall`);
}

// Shop details page: opened from cards, quantity, add to cart, wishlist, related products, 404.
async function productFlow(page, size, vw) {
  const pathname = () => new URL(page.url()).pathname;
  const h1 = async () => ((await page.locator('main h1').first().textContent()) || '').trim();
  const count = () => page.evaluate(() => Number(document.querySelector('header a[aria-label^="Cart"] span').textContent));

  await open(page, { path: '/' });
  const card = page.locator('#shop article').first();
  const name = ((await card.locator('h3').textContent()) || '').trim();
  const id = await card.locator('h3 a').evaluate((a) => a.getAttribute('href').split('/').pop());
  await card.locator('h3 a').click();
  await page.waitForTimeout(300);
  if (pathname() !== `/shop/${id}` || (await h1()) !== name) fail(size, 'product', `title link opened ${pathname()} ("${await h1()}")`);
  if (!(await page.title()).startsWith(name)) fail(size, 'product', `page title is "${await page.title()}"`);

  // the picture is a link too (the big tap target on the card)
  await open(page, { path: '/' });
  await page.locator('#shop article').first().scrollIntoViewIfNeeded();
  const imgLink = await page.locator('#shop article a[aria-hidden="true"]').first().evaluate((a) => ({ href: a.getAttribute('href'), w: a.getBoundingClientRect().width, h: a.getBoundingClientRect().height }));
  if (imgLink.href !== `/shop/${id}` || imgLink.w < 100 || imgLink.h < 150) fail(size, 'product', `card picture link is ${JSON.stringify(imgLink)}`);

  // quick view -> View details
  await page.locator('#shop article button[aria-label^="Quick view"]').first().click();
  await page.waitForTimeout(300);
  await page.click('dialog[open] a:text-is("View details")');
  await page.waitForTimeout(300);
  if (pathname() !== `/shop/${id}`) fail(size, 'product', `quick view "View details" opened ${pathname()}`);
  if (await page.evaluate(() => !!document.querySelector('dialog[open]'))) fail(size, 'product', 'quick view stays open after "View details"');

  // content
  const c = await page.evaluate(() => ({
    price: !!document.querySelector('main p.font-display span'),
    care: document.querySelectorAll('main ol li').length,
    desc: [...document.querySelectorAll('main h2')].map((h) => h.textContent.trim()),
    stars: !!document.querySelector('main [role="img"][aria-label^="Rated"]'),
    img: (() => { const i = document.querySelector('main img'); return { ok: i.complete && i.naturalWidth > 0, file: i.currentSrc.split('/').pop() }; })(),
  }));
  if (!c.price || !c.stars || c.care < 3 || !c.desc.includes('Description') || !c.desc.includes('Care guide') || !c.img.ok) fail(size, 'product', `details incomplete: ${JSON.stringify(c)}`);
  const related = await page.locator('main section:has(h2:text-is("You May Also Like")) ul.grid > li:visible').count();
  if (related !== (vw >= 768 && vw < 1024 ? 3 : 4)) fail(size, 'product', `"You May Also Like" shows ${related} products`);
  const relatedNames = await page.locator('main section:has(h2:text-is("You May Also Like")) ul.grid article h3').allInnerTexts();
  if (relatedNames.map((n) => n.trim()).includes(name)) fail(size, 'product', 'the current product is listed under "You May Also Like"');

  // quantity + add to cart + status + view cart
  const before = await count();
  for (let i = 0; i < 2; i++) await page.click(`button[aria-label="Increase quantity of ${name}"]`);
  if ((await page.locator(`input[aria-label="Quantity of ${name}"]`).inputValue()) !== '3') fail(size, 'product', 'the + button does not raise the quantity');
  const stepper = await page.evaluate(() => [...document.querySelectorAll('main button[aria-label*="quantity"]')].map((b) => [Math.round(b.getBoundingClientRect().width), Math.round(b.getBoundingClientRect().height)]));
  if (stepper.some(([w, h]) => w < 44 || h < 44)) fail(size, 'product', `quantity buttons are ${JSON.stringify(stepper)}`);
  await page.click('main button:text-is("Add to cart")');
  if ((await count()) !== before + 3) fail(size, 'product', `cart count is ${await count()} after adding 3 (was ${before})`);
  const status = ((await page.locator('main [role="status"]').first().textContent()) || '');
  if (!status.includes('added to your cart') || !status.includes('View cart')) fail(size, 'product', `status says "${status}"`);
  await page.click('main a:text-is("View cart")');
  await page.waitForTimeout(300);
  if (pathname() !== '/cart' || (await page.locator('main input[aria-label^="Quantity of"]').first().inputValue()) !== '3') fail(size, 'product', 'View cart did not open the cart with 3 items');

  // wishlist heart + related product resets the quantity
  await page.goto(BASE + `/shop/${id}`, { waitUntil: 'networkidle' });
  await page.click(`button[aria-label="Add ${name} to wishlist"]`);
  const liked = await page.evaluate(() => JSON.parse(localStorage.getItem('fulbari.wishlist') || '[]'));
  if (!liked.includes(id) || (await page.locator(`button[aria-label="Remove ${name} from wishlist"]`).getAttribute('aria-pressed')) !== 'true') fail(size, 'product', 'the heart does not add to the wishlist');
  await page.click(`button[aria-label="Increase quantity of ${name}"]`);
  const next = await page.locator('main ul.grid article h3 a').first();
  const nextName = ((await next.textContent()) || '').trim();
  await next.click();
  await page.waitForTimeout(400);
  if ((await h1()) !== nextName || (await page.locator(`input[aria-label="Quantity of ${nextName}"]`).inputValue()) !== '1') fail(size, 'product', 'opening a related product did not open it with quantity 1');

  await page.goto(BASE + '/shop/no-such-product', { waitUntil: 'networkidle' });
  if ((await h1()) !== 'Page not found') fail(size, 'product', `unknown product shows "${await h1()}" instead of the 404 page`);
}

// Cart: quantities, totals, delivery, persistence, stale data, order request.
async function cartFlow(page, size, vw) {
  const pathname = () => new URL(page.url()).pathname;
  const count = () => page.evaluate(() => Number(document.querySelector('header a[aria-label^="Cart"] span').textContent));
  const summary = () => page.locator('aside[aria-label="Order summary"]').innerText();
  const rows = () => page.locator('main ul > li').count();
  const $ = (n) => `$${n.toFixed(2)}`;

  await open(page, { path: '/cart' });
  if (!((await page.locator('main h2').first().textContent()) || '').includes('empty')) fail(size, 'cart', 'an empty cart has no empty state');

  // add the same product twice from a card -> ONE line with quantity 2
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const card = page.locator('#shop article').first();
  const price = parseFloat(((await card.locator('p.mt-auto > span').first().textContent()) || '').replace('$', ''));
  const name = ((await card.locator('h3').textContent()) || '').trim();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  const add = card.locator('button[aria-label^="Add "][aria-label$="to cart"]');
  await add.click();
  await add.click();
  if ((await count()) !== 2) fail(size, 'cart', `header count is ${await count()} after adding one product twice`);
  const label = await page.getAttribute('header a[aria-label^="Cart"]', 'aria-label');
  if (label !== 'Cart, 2 items') fail(size, 'cart', `cart link label is "${label}"`);
  await page.click('header a[aria-label^="Cart"]');
  await page.waitForTimeout(300);
  if (pathname() !== '/cart') fail(size, 'cart', 'the header cart icon does not open /cart');
  if ((await rows()) !== 1 || (await page.locator('main input[aria-label^="Quantity of"]').inputValue()) !== '2') fail(size, 'cart', 'adding one product twice should give one line with quantity 2');
  let text = await summary();
  const sub = price * 2;
  const ship = sub >= 100 ? 0 : 8;
  if (!text.includes($(sub)) || !text.includes(ship ? $(8) : 'Free') || !text.includes($(sub + ship))) fail(size, 'cart', `summary is wrong for 2 x ${$(price)}: ${text.replace(/\s+/g, ' ')}`);

  // + / typing / minus
  await page.click(`button[aria-label="Increase quantity of ${name}"]`);
  if ((await count()) !== 3 || !(await summary()).includes($(price * 3 + (price * 3 >= 100 ? 0 : 8)))) fail(size, 'cart', 'the + button does not update the count and totals');
  await page.fill(`input[aria-label="Quantity of ${name}"]`, '5');
  await page.keyboard.press('Enter');
  if ((await count()) !== 5) fail(size, 'cart', 'typing a quantity (then Enter) does not update the cart');
  await page.fill(`input[aria-label="Quantity of ${name}"]`, '0');
  await page.keyboard.press('Tab');
  if ((await page.locator(`input[aria-label="Quantity of ${name}"]`).inputValue()) !== '1' || (await count()) !== 1) fail(size, 'cart', 'a quantity of 0 should become 1');
  if (!(await page.locator(`button[aria-label="Decrease quantity of ${name}"]`).isDisabled())) fail(size, 'cart', 'the - button should be disabled at quantity 1');
  await page.reload({ waitUntil: 'networkidle' });
  if ((await count()) !== 1 || (await rows()) !== 1) fail(size, 'cart', 'the cart did not survive a reload');
  await page.click(`button[aria-label="Remove ${name} from cart"]`);
  if (!((await page.locator('main h2').first().textContent()) || '').includes('empty') || (await count()) !== 0) fail(size, 'cart', 'removing the last line should show the empty cart');

  // delivery rules: under $100 costs $8 and shows how much is missing; from $100 it is free
  await open(page, { path: '/cart', cart: [{ id: 'plant-jade', qty: 1 }] });
  text = await summary();
  if (!text.includes('$8.00') || !text.includes('$42.00') || !text.includes('Add $66.00 more for free delivery')) fail(size, 'cart', `under-$100 summary is wrong: ${text.replace(/\s+/g, ' ')}`);
  await open(page, { path: '/cart', cart: [{ id: 'gift-hatbox', qty: 2 }] });
  text = await summary();
  if (!text.includes('Free') || !text.includes('$156.00') || !text.includes('You have free delivery.')) fail(size, 'cart', `over-$100 summary is wrong: ${text.replace(/\s+/g, ' ')}`);

  // stale / hand-edited storage is cleaned: unknown product dropped, quantity clamped to 99
  await open(page, { path: '/cart', cart: [{ id: 'no-such-product', qty: 3 }, { id: 'rose-crimson', qty: 500 }] });
  if ((await rows()) !== 1 || (await count()) !== 99) fail(size, 'cart', `stale cart shows ${await rows()} lines / count ${await count()}, expected 1 / 99`);

  // tap targets and font size inside the cart
  await open(page, { path: '/cart', cart: [{ id: 'rose-crimson', qty: 2 }, { id: 'plant-orchid', qty: 1 }] });
  const tap = await page.evaluate(() => [...document.querySelectorAll('main button, main input')].filter((e) => e.checkVisibility()).map((e) => { const r = e.getBoundingClientRect(); return [e.getAttribute('aria-label') || e.textContent.trim(), Math.round(r.width), Math.round(r.height), parseFloat(getComputedStyle(e).fontSize)]; }));
  tap.filter(([, w, h]) => w < 44 || h < 44).forEach(([l, w, h]) => fail(size, 'cart', `${l} is only ${w}x${h}px`));
  if (tap.some(([l, , , f]) => l.startsWith('Quantity') && f < 16)) fail(size, 'cart', 'quantity input font < 16px (iOS zooms on focus)');
  const cols = await page.evaluate(() => { const li = document.querySelector('main ul > li'); return getComputedStyle(li).gridTemplateColumns.split(' ').length; });
  if (cols !== (vw >= 768 ? 6 : 2)) fail(size, 'cart', `line layout has ${cols} columns, expected ${vw >= 768 ? 6 : 2}`);

  // order request -> contact form with the order filled in
  await page.click('main a:text-is("Send order request")');
  await page.waitForTimeout(400);
  const msg = await page.locator('#message').inputValue().catch(() => '');
  if (pathname() !== '/contact' || (await page.locator('#topic').inputValue()) !== 'delivery' || !msg.includes('2 x Crimson Velvet Rose Bouquet') || !msg.includes('1 x Pink Orchid Plant') || !msg.includes('total $186.00')) fail(size, 'cart', `order request opened ${pathname()} with message "${msg.replace(/\n/g, ' | ')}"`);
  await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
  await page.click('main button:text-is("Clear cart")');
  if ((await count()) !== 0) fail(size, 'cart', '"Clear cart" did not empty the cart');
}

// ALOKNONDA is a category tab inside "Our Products" - not a section of its own.
async function aloknondaTabTests(page, size, vw) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const tabInfo = () =>
    page.evaluate(() => {
      const tabs = [...document.querySelectorAll('#shop [data-scroller] button')];
      const style = (b) => {
        const cs = getComputedStyle(b);
        return [cs.fontFamily, cs.fontSize, cs.fontWeight, cs.textTransform, cs.paddingLeft, cs.paddingRight, cs.minHeight, cs.borderBottomWidth, cs.whiteSpace].join('|');
      };
      return {
        labels: tabs.map((b) => b.innerText.trim()),
        styles: tabs.map(style),
        // every tab after the first has a divider line in front of it, exactly like the existing tabs
        dividers: tabs.map((b) => (b.closest('li').querySelector('span[aria-hidden="true"]') ? 1 : 0)),
        sectionExists: !!document.getElementById('aloknonda'),
        collectionText: /collection/i.test(document.body.innerText),
        aloknondaHeadings: [...document.querySelectorAll('main h2')].filter((h) => /aloknonda/i.test(h.textContent)).length,
      };
    });
  const activeInfo = (label) =>
    page.evaluate((label) => {
      const b = [...document.querySelectorAll('#shop [data-scroller] button')].find((x) => x.textContent.trim() === label);
      const cs = getComputedStyle(b);
      const scroller = b.closest('[data-scroller]').getBoundingClientRect();
      const r = b.getBoundingClientRect();
      return { pressed: b.getAttribute('aria-pressed'), color: cs.color, border: cs.borderBottomColor, borderWidth: cs.borderBottomWidth, visible: r.left >= scroller.left - 1 && r.right <= scroller.right + 1 };
    }, label);

  const s = await tabInfo();
  if (s.labels.join(',') !== 'ALL,BOUQUETS,ROSES,PLANTS,ALOKNONDA,WEDDING,GIFTS') fail(size, 'aloknonda', `tabs are: ${s.labels.join(' | ')}`);
  if (new Set(s.styles).size !== 1) fail(size, 'aloknonda', 'the ALOKNONDA tab is not styled exactly like the others');
  if (s.dividers.join('') !== '0111111') fail(size, 'aloknonda', `divider lines are ${s.dividers.join('')}, expected 0111111`);
  if (s.sectionExists || s.aloknondaHeadings) fail(size, 'aloknonda', 'there must be no separate Aloknonda section');
  if (s.collectionText) fail(size, 'aloknonda', 'the word "Collection" appears on the page');

  // The reference active state (PLANTS): green text + green underline.
  await page.click('#shop button:text-is("Plants")');
  await page.waitForTimeout(500); // let the 200ms colour transition finish before measuring
  const plants = await activeInfo('Plants');
  await page.click('#shop button:text-is("Aloknonda")');
  await page.evaluate(() => document.querySelectorAll('#shop img[loading="lazy"]').forEach((i) => (i.loading = 'eager'))); // the filtered grid mounts new lazy images
  await page.waitForTimeout(500);
  const alo = await activeInfo('Aloknonda');
  const plantsNow = await activeInfo('Plants');
  if (alo.pressed !== 'true' || plantsNow.pressed !== 'false') fail(size, 'aloknonda', 'clicking ALOKNONDA does not make it the only active tab');
  if (alo.color !== plants.color || alo.border !== plants.border || alo.borderWidth !== plants.borderWidth) fail(size, 'aloknonda', 'active ALOKNONDA does not look like active PLANTS (green text + green underline)');
  if (alo.color !== 'rgb(128, 181, 0)' || alo.border !== 'rgb(128, 181, 0)') fail(size, 'aloknonda', `active colours are ${alo.color} / ${alo.border}, expected lime`);
  if (plantsNow.color === 'rgb(128, 181, 0)') fail(size, 'aloknonda', 'PLANTS stays green after choosing ALOKNONDA');
  if (!alo.visible) fail(size, 'aloknonda', 'the ALOKNONDA tab is not scrolled into view after tapping it');

  // Filtering: only the six Aloknonda plants, in the existing grid + card.
  await page.waitForFunction(() => { const imgs = [...document.querySelectorAll('#shop article img')]; return imgs.length === 6 && imgs.every((i) => i.complete && i.currentSrc); }, null, { timeout: 8000 }).catch(() => {});
  const g = await page.evaluate(() => {
    const ul = document.querySelector('#shop ul.grid');
    const cards = [...ul.children];
    return {
      names: cards.map((c) => c.querySelector('h3').textContent.trim()),
      cols: new Set(cards.map((c) => Math.round(c.getBoundingClientRect().left))).size,
      rights: cards.map((c) => Math.round(c.getBoundingClientRect().right)),
      srcs: cards.map((c) => c.querySelector('img').currentSrc.split('/').pop()),
      pager: !!document.querySelector('button[aria-label="Next products"]'),
      status: document.querySelector('#shop [role="status"]').textContent.trim(),
    };
  });
  const wantCols = Math.min(6, vw < 375 ? 1 : vw < 768 ? 2 : vw < 1024 ? 3 : 4);
  if (g.names.length !== 6 || g.names.some((n) => !/aloknonda/i.test(n))) fail(size, 'aloknonda', `tab shows: ${g.names.join(', ')}`);
  if (g.cols !== wantCols) fail(size, 'aloknonda', `${g.cols} columns, expected ${wantCols}`);
  if (g.rights.some((r) => r > vw)) fail(size, 'aloknonda', 'a plant card runs past the right edge of the screen');
  if (g.srcs.some((f) => !/^aloknonda-[a-z]+-(400|800)\.webp$/.test(f))) fail(size, 'aloknonda', `unexpected image files: ${g.srcs}`);
  if (g.pager) fail(size, 'aloknonda', 'six products should not show the pager');
  if (!g.status.includes('6 of 6') || !g.status.includes('Aloknonda')) fail(size, 'aloknonda', `screen-reader status says "${g.status}"`);

  // The cards behave like every other product card: cart, wishlist, quick view.
  const cart = () => page.evaluate(() => Number(document.querySelector('header a[aria-label^="Cart"] span').textContent));
  const before = await cart();
  await page.locator('#shop article button[aria-label^="Add "][aria-label$="to cart"]').first().click();
  if ((await cart()) !== before + 1) fail(size, 'aloknonda', 'add to cart does not work on an Aloknonda card');
  await page.locator('#shop article button[aria-pressed]').first().click();
  if ((await page.locator('#shop article button[aria-pressed="true"]').count()) !== 1) fail(size, 'aloknonda', 'wishlist heart does not work on an Aloknonda card');
  await page.locator('#shop article button[aria-label^="Quick view"]').first().click();
  await page.waitForTimeout(300);
  const qv = await page.evaluate(() => document.querySelector('dialog[open]')?.innerText || '');
  if (!/Golden Aloknonda/i.test(qv) || !/aloknonda/i.test(qv.split('\n')[0] || '')) fail(size, 'aloknonda', 'quick view of an Aloknonda card shows the wrong details');
  await page.keyboard.press('Escape');

  // Switching away and back keeps the other categories intact.
  await page.click('#shop button:text-is("Wedding")');
  if ((await page.locator('#shop ul.grid > li').count()) !== 2) fail(size, 'aloknonda', 'Wedding tab no longer shows its 2 products');
  await page.click('#shop button:text-is("Aloknonda")');
  if ((await page.locator('#shop ul.grid > li').count()) !== 6) fail(size, 'aloknonda', 'ALOKNONDA tab does not show 6 products the second time');
}

async function authFlow(page, size) {
  const errorCount = () => page.locator('main [id$="-error"]').count();
  const greeting = async () => (((await page.locator('main p', { hasText: 'Hello' }).first().innerText()) || '').replace(/\s+/g, ' ')).trim();
  const sidebar = 'main nav[aria-label="Account"]';
  await open(page, { path: '/account' }); // signed out
  if (pathOf(page) !== '/sign-in') fail(size, 'auth', `/account while signed out ended at ${pathOf(page)}, expected /sign-in`);

  // Sign in: validation
  await page.click('main button[type=submit]');
  if ((await errorCount()) !== 2) fail(size, 'auth', `empty sign-in shows ${await errorCount()} errors, expected 2`);
  if ((await page.evaluate(() => document.activeElement?.id)) !== 'email') fail(size, 'auth', 'first invalid field is not focused');
  await page.fill('#email', 'nope');
  await page.fill('#password', 'x');
  await page.click('main button[type=submit]');
  if (!(await page.locator('#email-error').textContent()).includes('valid email')) fail(size, 'auth', 'invalid email not explained');
  await page.click('button[aria-label="Show password"]');
  if ((await page.getAttribute('#password', 'type')) !== 'text') fail(size, 'auth', 'show-password toggle does not reveal the password');
  await page.click('button[aria-label="Hide password"]');

  // Sign in: success
  await page.fill('#email', 'jane.doe@example.com');
  await page.fill('#password', 'secret-pass-123');
  await page.click('main button[type=submit]');
  await page.waitForURL('**/account', { timeout: 5000 }).catch(() => {});
  if (pathOf(page) !== '/account') return fail(size, 'auth', `sign-in ended at ${pathOf(page)}, expected /account`);
  if ((await greeting()) !== 'Hello Jane Doe (not Jane Doe? Log out)') fail(size, 'auth', `account greeting is "${await greeting()}"`);
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  if (stored.includes('secret-pass-123')) fail(size, 'auth', 'the password was persisted to localStorage');

  // Signed-in dropdown + details form + sign out
  await page.click(accountBtn);
  if ((await menuItems(page)).join(',') !== 'My Account,Wishlist,Sign out') fail(size, 'auth', `signed-in dropdown is: ${(await menuItems(page)).join(',')}`);
  await page.keyboard.press('Escape');
  await page.click(`${sidebar} a:text-is("Account Details")`);
  if ((await page.locator('#name').inputValue()) !== 'Jane Doe' || (await page.locator('#email').inputValue()) !== 'jane.doe@example.com') fail(size, 'auth', 'the details form is not pre-filled with the account');
  await page.fill('#name', 'Jane Q Doe');
  await page.click('main button[type=submit]');
  if (!(await page.locator('main [role=status]').first().textContent()).includes('Details saved')) fail(size, 'auth', 'saving account details gives no confirmation');
  await page.click(`${sidebar} a:text-is("Dashboard")`);
  if ((await greeting()) !== 'Hello Jane Q Doe (not Jane Q Doe? Log out)') fail(size, 'auth', 'greeting did not update after saving');
  await page.reload({ waitUntil: 'networkidle' });
  if ((await greeting()) !== 'Hello Jane Q Doe (not Jane Q Doe? Log out)') fail(size, 'auth', 'session did not survive a reload');
  await page.click(accountBtn);
  await page.click('#account-menu >> text=Sign out');
  await page.waitForTimeout(250);
  if (pathOf(page) !== '/') fail(size, 'auth', `sign out ended at ${pathOf(page)}, expected /`);
  await page.click(accountBtn);
  if ((await menuItems(page)).join(',') !== 'Sign in,Register,My Account,Wishlist') fail(size, 'auth', 'dropdown did not go back to guest items after sign out');
  await page.keyboard.press('Escape');

  // Register
  await open(page, { path: '/register' });
  await page.click('main button[type=submit]');
  if ((await errorCount()) !== 5) fail(size, 'auth', `empty register shows ${await errorCount()} errors, expected 5`);
  await page.fill('#name', 'Sam Rivera');
  await page.fill('#email', 'sam@example.com');
  await page.fill('#password', 'password1');
  await page.fill('#confirm', 'password2');
  await page.check('#terms');
  await page.click('main button[type=submit]');
  if (!(await page.locator('#confirm-error').textContent()).includes('do not match')) fail(size, 'auth', 'mismatched passwords not flagged');
  await page.fill('#password', 'short');
  await page.fill('#confirm', 'short');
  await page.click('main button[type=submit]');
  if (!(await page.locator('#password-error').textContent()).includes('at least 8')) fail(size, 'auth', 'short password not flagged');
  await page.fill('#password', 'password1');
  await page.fill('#confirm', 'password1');
  await page.click('main button[type=submit]');
  await page.waitForURL('**/account', { timeout: 5000 }).catch(() => {});
  if (pathOf(page) !== '/account' || (await greeting()) !== 'Hello Sam Rivera (not Sam Rivera? Log out)') fail(size, 'auth', 'registering did not land on the account page with the new name');
  await page.click(`${sidebar} button:text-is("Logout")`);
  await page.waitForTimeout(250);
  if (pathOf(page) !== '/') fail(size, 'auth', 'Logout in the account sidebar did not return home');
}

// My Account, like the reference: sidebar (Dashboard, Orders, Downloads, Address, Account Details, Logout) + content.
async function accountFlow(page, size, vw) {
  const sidebar = 'main nav[aria-label="Account"]';
  const greeting = async () => (((await page.locator('main p', { hasText: 'Hello' }).first().innerText()) || '').replace(/\s+/g, ' ')).trim();
  const errorCount = () => page.locator('main [id$="-error"]').count();
  const user = { name: 'Jane Doe', email: 'jane.doe@example.com' };
  await open(page, { path: '/account', user });

  const nav = await page.evaluate((sel) => {
    const items = [...document.querySelectorAll(`${sel} li > a, ${sel} li > button`)];
    const ul = document.querySelector(`${sel} ul`);
    const content = ul.closest('div.grid').lastElementChild.getBoundingClientRect();
    const rs = items.map((e) => e.getBoundingClientRect());
    return {
      labels: items.map((e) => e.textContent.trim()),
      current: items.map((e) => e.getAttribute('aria-current')),
      heights: rs.map((r) => Math.round(r.height)),
      widths: rs.map((r) => Math.round(r.width)),
      lefts: new Set(rs.map((r) => Math.round(r.left))).size,
      tops: new Set(rs.map((r) => Math.round(r.top))).size,
      activeBg: getComputedStyle(items[0]).backgroundColor,
      activeColor: getComputedStyle(items[0]).color,
      otherBg: getComputedStyle(items[1]).backgroundColor,
      scrollable: ul.scrollWidth > ul.clientWidth + 1,
      ulRight: Math.round(ul.getBoundingClientRect().right),
      ulBottom: Math.round(ul.getBoundingClientRect().bottom),
      contentLeft: Math.round(content.left),
      contentTop: Math.round(content.top),
      contentRight: Math.round(content.right),
      vw: document.documentElement.clientWidth,
      icons: items.map((e) => !!e.querySelector('svg') && e.querySelector('svg').checkVisibility()),
    };
  }, sidebar);
  if (nav.labels.join(',') !== 'Dashboard,Orders,Downloads,Address,Account Details,Logout') fail(size, 'account', `sidebar is: ${nav.labels.join(',')}`);
  if (nav.current.join(',') !== 'page,,,,,') fail(size, 'account', `aria-current is: ${nav.current.join('|')}`);
  if (nav.activeBg !== 'rgb(7, 28, 31)' || nav.activeColor !== 'rgb(255, 255, 255)' || nav.otherBg === 'rgb(7, 28, 31)') fail(size, 'account', `active tab should be dark with white text (is ${nav.activeBg} / ${nav.activeColor})`);
  if (nav.heights.some((h) => h < 44) || nav.widths.some((w) => w < 44)) fail(size, 'account', `sidebar items are ${nav.widths.map((w, i) => w + 'x' + nav.heights[i]).join(', ')}`);
  if (nav.contentRight > nav.vw + 1) fail(size, 'account', `content runs past the screen (${nav.contentRight} > ${nav.vw})`);
  if (vw >= 1024) {
    if (nav.lefts !== 1 || nav.tops !== 6) fail(size, 'account', 'on desktop the sidebar must be one vertical list');
    if (nav.contentLeft <= nav.ulRight) fail(size, 'account', 'on desktop the content must sit to the right of the sidebar');
    if (nav.icons.some((v) => !v)) fail(size, 'account', 'every sidebar item should have an icon on desktop');
  } else {
    if (nav.tops !== 1) fail(size, 'account', 'below lg the sidebar must become one row of tabs');
    if (nav.contentTop < nav.ulBottom - 1) fail(size, 'account', 'below lg the content must sit under the tab row');
    if (vw < 640 && !nav.scrollable) fail(size, 'account', 'on phones the tab row should scroll sideways');
  }

  // Dashboard content
  const dash = await page.evaluate(() => {
    const ps = [...document.querySelectorAll('main p')].filter((p) => /Hello|From your account dashboard/.test(p.textContent));
    return { n: ps.length, bg: ps.map((p) => getComputedStyle(p).backgroundColor), text: ps[1]?.textContent || '', cards: document.querySelectorAll('main ul.grid > li a').length };
  });
  if ((await greeting()) !== 'Hello Jane Doe (not Jane Doe? Log out)') fail(size, 'account', `greeting is "${await greeting()}"`);
  if (dash.n !== 2 || dash.bg.some((c) => c !== 'rgb(247, 245, 235)') || !dash.text.includes('recent orders') || dash.cards !== 3) fail(size, 'account', `dashboard content is wrong: ${JSON.stringify(dash)}`);

  // Every tab: URL, active state and content
  const go = async (label) => { await page.click(`${sidebar} a:text-is("${label}")`); await page.waitForTimeout(250); };
  const active = () => page.evaluate((sel) => document.querySelector(`${sel} [aria-current="page"]`)?.textContent.trim(), sidebar);
  for (const [label, query, heading] of [['Orders', '?tab=orders', 'No orders yet'], ['Downloads', '?tab=downloads', 'No downloads yet'], ['Address', '?tab=address', 'Delivery address'], ['Account Details', '?tab=details', 'Account details'], ['Dashboard', '', '']]) {
    await go(label);
    const q = new URL(page.url()).search;
    if (q !== query) fail(size, 'account', `${label} tab URL query is "${q}", expected "${query}"`);
    if ((await active()) !== label) fail(size, 'account', `after clicking ${label} the active tab is "${await active()}"`);
    if (heading && !(await page.locator('main h2', { hasText: heading }).first().isVisible())) fail(size, 'account', `${label} tab does not show "${heading}"`);
  }
  await page.goto(BASE + '/account?tab=bogus', { waitUntil: 'networkidle' });
  if ((await active()) !== 'Dashboard') fail(size, 'account', 'an unknown ?tab= should fall back to Dashboard');

  // Switching tabs must not jump the page back to the top
  await page.evaluate(() => window.scrollTo({ top: 240, behavior: 'instant' }));
  const before = await page.evaluate(() => Math.round(scrollY));
  await go('Orders');
  const after = await page.evaluate(() => Math.round(scrollY));
  if (Math.abs(after - before) > 60) fail(size, 'account', `switching tabs moved the page from ${before}px to ${after}px`);

  // Phones: the chosen tab is scrolled into view inside the row
  await page.goto(BASE + '/account?tab=details', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const visible = await page.evaluate((sel) => { const a = document.querySelector(`${sel} [aria-current="page"]`); const u = a.closest('ul').getBoundingClientRect(); const r = a.getBoundingClientRect(); return r.left >= u.left - 1 && r.right <= u.right + 1; }, sidebar);
  if (!visible) fail(size, 'account', 'the active tab is not visible inside the tab row');

  // Address: validation, saving, persistence, and the cart's order request uses it
  await page.goto(BASE + '/account?tab=address', { waitUntil: 'networkidle' });
  await page.click('main form button[type=submit]');
  if ((await errorCount()) !== 3 || (await page.evaluate(() => document.activeElement?.id)) !== 'street') fail(size, 'account', `empty address shows ${await errorCount()} errors / focus on ${await page.evaluate(() => document.activeElement?.id)}`);
  await page.fill('#street', '12 Rose Lane');
  await page.fill('#city', 'Springfield');
  await page.fill('#postcode', '12345');
  await page.click('main form button[type=submit]');
  if (!((await page.locator('main [role=status]').first().textContent()) || '').includes('Address saved')) fail(size, 'account', 'saving the address gives no confirmation');
  await page.reload({ waitUntil: 'networkidle' });
  if ((await page.locator('#street').inputValue()) !== '12 Rose Lane' || (await page.locator('#postcode').inputValue()) !== '12345') fail(size, 'account', 'the saved address did not survive a reload');
  const inputs = await page.evaluate(() => [...document.querySelectorAll('main form input')].map((i) => [i.id, Math.round(i.getBoundingClientRect().height), parseFloat(getComputedStyle(i).fontSize), !!(i.labels && i.labels.length)]));
  if (inputs.some(([, h, f, l]) => h < 44 || f < 16 || !l)) fail(size, 'account', `address inputs are not 44px / 16px / labelled: ${JSON.stringify(inputs)}`);
  await page.evaluate(() => localStorage.setItem('fulbari.cart', JSON.stringify([{ id: 'plant-jade', qty: 1 }])));
  await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
  await page.click('main a:text-is("Send order request")');
  await page.waitForTimeout(400);
  const msg = await page.locator('#message').inputValue().catch(() => '');
  if (!msg.includes('12 Rose Lane, Springfield, 12345')) fail(size, 'account', `the order request does not include the saved address: ${msg.replace(/\n/g, ' | ')}`);

  // Dashboard quick links, features band, Log out, Logout
  await page.goto(BASE + '/account', { waitUntil: 'networkidle' });
  const fb = await page.evaluate(() => document.querySelectorAll('#about ul > li').length);
  if (fb !== 4) fail(size, 'account', `the feature band above the footer has ${fb} items, expected 4`);
  await page.click('main ul.grid a:has-text("Wishlist")');
  await page.waitForTimeout(250);
  if (pathOf(page) !== '/wishlist') fail(size, 'account', 'the Wishlist card does not open /wishlist');
  await page.goto(BASE + '/account', { waitUntil: 'networkidle' });
  await page.click('main p button:text-is("Log out")');
  await page.waitForTimeout(300);
  if (pathOf(page) !== '/') fail(size, 'account', `the "Log out" link ended at ${pathOf(page)}`);
  await open(page, { path: '/account', user });
  await page.click(`${sidebar} button:text-is("Logout")`);
  await page.waitForTimeout(300);
  if (pathOf(page) !== '/' || (await page.evaluate(() => localStorage.getItem('fulbari.user'))) !== null) fail(size, 'account', 'Logout did not sign out and go home');
}

// Wishlist, like the reference: remove | picture | name | price | stock | Add to Cart.
async function wishlistFlow(page, size, vw) {
  const rows = () => page.locator('main ul[aria-label="Saved items"] > li').count();
  const heading = async () => (await page.locator('main h2').first().textContent()).trim();
  await open(page, { path: '/wishlist' });
  if (!(await heading()).includes('empty')) fail(size, 'wishlist', 'empty wishlist has no empty state');

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  for (const i of [0, 1]) {
    const card = page.locator('#shop article').nth(i);
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    await card.locator('button[aria-pressed]').click();
  }
  const pressed = await page.locator('#shop article button[aria-pressed="true"]').count();
  if (pressed !== 2) fail(size, 'wishlist', `${pressed} hearts pressed, expected 2`);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.click(accountBtn);
  await page.click('#account-menu >> text=Wishlist');
  await page.waitForTimeout(300);
  if (pathOf(page) !== '/wishlist' || (await rows()) !== 2) fail(size, 'wishlist', `wishlist page shows ${await rows()} items, expected 2`);
  if (!(await page.locator('main h2.sr-only').first().textContent()).includes('2 saved items')) fail(size, 'wishlist', 'screen-reader heading does not say "2 saved items"');
  if ((await page.locator('main ul[aria-label="Saved items"] li').first().locator('img').count()) !== 1) fail(size, 'wishlist', 'a wishlist row has no picture');

  // row layout
  const row = await page.evaluate(() => {
    const li = document.querySelector('main ul[aria-label="Saved items"] > li');
    const q = (sel) => li.querySelector(sel).getBoundingClientRect();
    const btns = [...li.querySelectorAll('button')].map((b) => [b.textContent.trim(), b.getAttribute('aria-label') || '', Math.round(b.getBoundingClientRect().width), Math.round(b.getBoundingClientRect().height)]);
    const link = li.querySelector('h3 a');
    const price = [...li.querySelectorAll('p')].find((p) => /\$/.test(p.textContent));
    const stock = [...li.querySelectorAll('p')].find((p) => p.textContent.trim() === 'In Stock');
    const r = (e) => e.getBoundingClientRect();
    const add = [...li.querySelectorAll('button')].find((b) => b.textContent.includes('Add to Cart'));
    const rm = li.querySelector('button[aria-label^="Remove"]');
    return {
      cols: getComputedStyle(li).gridTemplateColumns.split(' ').length,
      btns,
      href: link.getAttribute('href'),
      name: link.textContent.trim(),
      thumb: { w: Math.round(q('a[aria-hidden="true"]').width), h: Math.round(q('a[aria-hidden="true"]').height) },
      xs: { rm: Math.round(r(rm).left), th: Math.round(r(li.querySelector('a[aria-hidden="true"]')).left), name: Math.round(r(link).left), price: Math.round(r(price).left), stock: Math.round(r(stock).left), add: Math.round(r(add).left) },
      tops: { rm: Math.round(r(rm).top), add: Math.round(r(add).top), name: Math.round(r(link).top) },
      addBg: getComputedStyle(add).backgroundColor,
      hasStock: !!stock,
      priceText: price.textContent,
      right: Math.round(li.getBoundingClientRect().right),
    };
  });
  if (!row.hasStock || !/\$\d+\.\d\d/.test(row.priceText)) fail(size, 'wishlist', `row has no price / stock: ${row.priceText}`);
  if (!row.href.startsWith('/shop/')) fail(size, 'wishlist', `the name links to ${row.href}`);
  if (row.btns.some(([, , w, h]) => w < 44 || h < 44)) fail(size, 'wishlist', `row buttons are ${JSON.stringify(row.btns)}`);
  if (row.addBg !== 'rgb(7, 28, 31)') fail(size, 'wishlist', `Add to Cart should be dark (is ${row.addBg})`);
  if (vw >= 768) {
    const x = row.xs;
    if (row.cols !== 6 || !(x.rm < x.th && x.th < x.name && x.name < x.price && x.price < x.stock && x.stock < x.add)) fail(size, 'wishlist', `md+ row should read remove | picture | name | price | stock | button: ${JSON.stringify(x)}`);
    if (Math.abs(row.tops.rm - row.tops.add) > 60) fail(size, 'wishlist', 'md+ row items are not on one line');
    if (row.thumb.w !== 100 || row.thumb.h !== 130) fail(size, 'wishlist', `picture is ${row.thumb.w}x${row.thumb.h}, expected 100x130`);
  } else {
    if (row.cols !== 2 || row.thumb.w !== 80) fail(size, 'wishlist', `phone row should be picture + details (cols ${row.cols}, picture ${row.thumb.w}px)`);
    if (row.tops.add <= row.tops.name) fail(size, 'wishlist', 'on phones the buttons should sit under the name');
  }

  // Add to Cart from the wishlist: cart count rises, the row stays, the label flashes "Added"
  const count = () => page.evaluate(() => Number(document.querySelector('header a[aria-label^="Cart"] span').textContent));
  const before = await count();
  const add = page.locator('main ul[aria-label="Saved items"] > li').first().locator('button').first(); // the row's Add to Cart button (its label flips to "Added")
  await add.click();
  if ((await count()) !== before + 1 || (await rows()) !== 2) fail(size, 'wishlist', 'Add to Cart on a row should add to the cart and keep the row');
  if (!((await add.textContent()) || '').includes('Added')) fail(size, 'wishlist', 'the button does not say "Added"');
  await page.waitForTimeout(2200);
  if (!((await add.textContent()) || '').includes('Add to Cart')) fail(size, 'wishlist', 'the button did not go back to "Add to Cart"');

  // details page, features band, persistence, removal
  const fb = await page.evaluate(() => document.querySelectorAll('#about ul > li').length);
  if (fb !== 4) fail(size, 'wishlist', `the feature band above the footer has ${fb} items, expected 4`);
  await page.reload({ waitUntil: 'networkidle' });
  if ((await rows()) !== 2) fail(size, 'wishlist', 'wishlist did not survive a reload');
  await page.locator('main ul[aria-label="Saved items"] h3 a').first().click();
  await page.waitForTimeout(300);
  if (!pathOf(page).startsWith('/shop/')) fail(size, 'wishlist', 'a row name does not open the product page');
  await page.goBack({ waitUntil: 'networkidle' });
  await page.locator('main button[aria-label^="Remove"]').first().click();
  if ((await rows()) !== 1) fail(size, 'wishlist', 'the remove button does not remove the row');
  await page.locator('main button[aria-label^="Remove"]').first().click();
  if (!(await heading()).includes('empty')) fail(size, 'wishlist', 'removing the last item does not show the empty state');
}

// Hero slide 2: the new Aloknonda plant replaces the illustrated bouquet, sways in the wind (WebGL wind warp), keeps the pot
// and logo perfectly still, loops seamlessly, and stays a plain picture for visitors who asked for reduced motion.
async function heroFlow(page, size, vw, vh) {
  await open(page, { path: '/' });
  const s1 = await page.evaluate(() => ({
    h1: document.querySelector('#home h1')?.textContent.trim(),
    src: document.querySelector('#home h1')?.closest('.grid')?.querySelector('img')?.currentSrc.split('/').pop(),
    wind: document.querySelectorAll('#home [data-wind]').length,
    old: [...document.querySelectorAll('#home img')].some((i) => /hero-[12]\.svg/.test(i.currentSrc || i.src)),
  }));
  if (s1.h1 !== 'Golden Aloknonda In Full Bloom' || !/^hero-aloknonda-/.test(s1.src)) fail(size, 'hero', `slide 1 is "${s1.h1}" / ${s1.src}`);
  if (s1.old) fail(size, 'hero', 'the old illustrated bouquet is still on the page');

  await page.click('button[aria-label="Show slide 2"]');
  await page.waitForFunction(() => document.querySelector('#home [data-wind]')?.dataset.wind === 'live', null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(500);
  const s2 = await page.evaluate(() => {
    const w = document.querySelector('#home [data-wind]');
    const slide = w.closest('.grid');
    const img = w.querySelector('img');
    const cv = w.querySelector('canvas');
    const wr = w.getBoundingClientRect();
    const cr = cv.getBoundingClientRect();
    return {
      wind: w.dataset.wind,
      title: slide.querySelector('h2')?.textContent.trim(),
      cta: slide.querySelector('a')?.textContent.trim(),
      src: img.currentSrc.split('/').pop(),
      alt: img.alt,
      imgOpacity: getComputedStyle(img).opacity,
      hidden: cv.getAttribute('aria-hidden'),
      pad: [Math.round(wr.left - cr.left), Math.round(wr.top - cr.top), Math.round(cr.right - wr.right), Math.round(cr.bottom - wr.bottom)],
      canvasInsideScreen: cr.left >= -0.5 && cr.right <= document.documentElement.clientWidth + 0.5,
      cw: cv.width, ch: cv.height,
      boxH: Math.round(wr.height), boxW: Math.round(wr.width),
      loaded: img.complete && img.naturalWidth > 0,
    };
  });
  if (s2.title !== 'Bloom Into Every Occasion') fail(size, 'hero', `slide 2 title is "${s2.title}"`);
  if (!/^hero-plant-(640|1000|1312)\.webp$/.test(s2.src) || !s2.loaded || !/FulBari/.test(s2.alt)) fail(size, 'hero', `slide 2 picture is ${s2.src} / alt "${s2.alt}"`);
  if (vw < 640 && s2.src !== 'hero-plant-640.webp') fail(size, 'hero', `phones should download the 640px plant, got ${s2.src}`);
  if (s2.wind !== 'live') fail(size, 'hero', `the plant is "${s2.wind}" - the WebGL wind animation did not start`);
  else {
    if (s2.imgOpacity !== '0' || s2.hidden !== 'true') fail(size, 'hero', 'while animating, the still <img> must be hidden behind the canvas and the canvas aria-hidden');
    if (s2.pad.some((p) => p !== 12)) fail(size, 'hero', `the canvas should extend 12px around the picture, is ${s2.pad}`);
    if (!s2.canvasInsideScreen) fail(size, 'hero', 'the wind canvas runs past the edge of the screen');
    if (s2.cw < s2.boxW || s2.ch < s2.boxH) fail(size, 'hero', 'the wind canvas is lower resolution than the picture box');
  }

  // Wind: fixed pot + logo, loops seamlessly, plant really moves. Uses a frozen page clock so frames are exact.
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
  const wp = await ctx.newPage();
  try {
    await wp.clock.install({ time: 0 });
    await wp.goto(BASE + '/', { waitUntil: 'load' });
    await wp.click('button[aria-label="Show slide 2"]');
    await wp.waitForFunction(() => document.querySelector('#home [data-wind]')?.dataset.wind === 'live', null, { timeout: 8000 });
    await wp.waitForTimeout(700);
    await wp.clock.pauseAt(30000);
    const el = wp.locator('#home [data-wind]');
    const grab = async () => el.screenshot({ animations: 'allow' });
    const f0 = await grab();
    await wp.clock.runFor(1750);
    const f1 = await grab();
    await wp.clock.runFor(1750);
    const f2 = await grab();
    await wp.clock.runFor(3500);
    const f7 = await grab(); // one full loop after f0
    const meta = await sharp(f0).metadata();
    const ar = 1312 / 1199;
    const dw = Math.min(meta.width, meta.height * ar);
    const dh = dw / ar;
    const ox = (meta.width - dw) / 2;
    const oy = (meta.height - dh) / 2;
    const zone = (v0, v1) => ({ left: Math.round(ox), top: Math.round(oy + dh * v0), width: Math.round(dw), height: Math.round(dh * (v1 - v0)) });
    const raw = (buf, r) => sharp(buf).extract(r).ensureAlpha().raw().toBuffer();
    const diff = (a, b) => {
      let max = 0;
      let n = 0;
      for (let i = 0; i < a.length; i += 4) {
        const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]), Math.abs(a[i + 3] - b[i + 3]));
        if (d > 6) n += 1;
        if (d > max) max = d;
      }
      return { max, n };
    };
    const pot = zone(0.76, 1);
    const canopy = zone(0, 0.7);
    const potBase = await raw(f0, pot);
    for (const [name, f] of [['1.75s', f1], ['3.5s', f2], ['7s', f7]]) {
      const d = diff(potBase, await raw(f, pot));
      if (d.max !== 0) fail(size, 'hero', `the pot and logo moved at ${name} (${d.n} pixels changed, max ${d.max})`);
    }
    const canopyBase = await raw(f0, canopy);
    const moved1 = diff(canopyBase, await raw(f1, canopy));
    const moved2 = diff(canopyBase, await raw(f2, canopy));
    if (moved1.n < 800 || moved2.n < 800) fail(size, 'hero', `the plant is not visibly moving (${moved1.n} / ${moved2.n} pixels changed)`);
    const loop = diff(canopyBase, await raw(f7, canopy));
    // Frames are 16 ms apart on the test clock, so one loop later can differ by a hair - but nothing like a seam.
    if (loop.max > 45 || loop.n > moved1.n * 0.05) fail(size, 'hero', `the loop is not seamless: after 7s ${loop.n} pixels differ (max ${loop.max}) while a quarter of the way through ${moved1.n} do`);
  } catch (e) {
    fail(size, 'hero', `wind test failed: ${e.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }

  // Reduced motion: no animation, the ordinary picture stays.
  const rctx = await browser.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'reduce' });
  const rp = await rctx.newPage();
  await rp.goto(BASE + '/', { waitUntil: 'networkidle' });
  await rp.click('button[aria-label="Show slide 2"]');
  await rp.waitForTimeout(900);
  const rm = await rp.evaluate(() => { const w = document.querySelector('#home [data-wind]'); const c = w.querySelector('canvas'); return { wind: w.dataset.wind, op: getComputedStyle(w.querySelector('img')).opacity, drawn: c.width > 300 }; });
  if (rm.wind !== 'static' || rm.op !== '1' || rm.drawn) fail(size, 'hero', `reduced motion should keep the plain picture (wind=${rm.wind}, img opacity ${rm.op}, canvas drawn ${rm.drawn})`);
  await rctx.close();

  // It sleeps when its slide is hidden: switching back to slide 1 stops the loop; coming back restarts it.
  await page.click('button[aria-label="Show slide 1"]');
  await page.waitForTimeout(400);
  const hiddenState = await page.evaluate(() => { const w = document.querySelector('#home [data-wind]'); return { inert: w.closest('.grid').inert, live: w.dataset.wind }; });
  if (!hiddenState.inert) fail(size, 'hero', 'the hidden slide should be inert');
}

// Header search: the icon opens a bar under the header (phones: the "Search..." row in the menu drawer), with live
// results, keyboard control, a results page, and it closes on Esc / X / backdrop / navigation.
async function searchFlow(page, size, vw, vh) {
  const pathname = () => new URL(page.url()).pathname;
  const desktop = vw >= 1024;
  const opts = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('#search-results [role=option]')].map((o) => {
        const a = o.querySelector('a');
        const r = a.getBoundingClientRect();
        return { text: o.textContent.replace(/\s+/g, ' ').trim(), sel: o.getAttribute('aria-selected'), h: Math.round(r.height), href: a.getAttribute('href'), bottom: Math.round(r.bottom) };
      }),
    );
  const bar = () =>
    page.evaluate(() => {
      const el = document.getElementById('site-search');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const i = document.getElementById('site-search-input');
      const trigger = document.querySelector('header button[aria-label="Search"]');
      const chips = [...el.querySelectorAll('ul button')];
      return {
        top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right),
        headerBottom: Math.round(document.querySelector('header').getBoundingClientRect().bottom),
        inputH: Math.round(i.getBoundingClientRect().height), inputFont: parseFloat(getComputedStyle(i).fontSize),
        focused: document.activeElement === i, expanded: trigger.checkVisibility() ? trigger.getAttribute('aria-expanded') : 'n/a',
        vw: document.documentElement.clientWidth, chips: chips.length, chipH: chips.map((b) => Math.round(b.getBoundingClientRect().height)),
        active: i.getAttribute('aria-activedescendant'), value: i.value,
        drawerOpen: document.getElementById('mobile-menu').checkVisibility({ visibilityProperty: true }),
        scrollW: document.documentElement.scrollWidth,
      };
    });
  const openBar = async (path = '/') => {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    if (!desktop) {
      await page.click('header button[aria-controls="mobile-menu"]');
      await page.waitForTimeout(450);
      await page.click('#mobile-menu button:has-text("Search")');
    } else await page.click('header button[aria-label="Search"]');
    await page.waitForTimeout(500); // the drawer takes 300ms to finish sliding away
  };

  /* opening */
  await openBar();
  let b = await bar();
  if (!b) return fail(size, 'search', 'the search bar does not open');
  const headerH = desktop ? 98 : 72;
  if (b.top !== headerH || b.headerBottom !== headerH) fail(size, 'search', `the bar should start right under the header (top ${b.top}, header bottom ${b.headerBottom}, expected ${headerH})`);
  if (b.left !== 0 || b.right !== b.vw || b.scrollW > b.vw) fail(size, 'search', `the bar should span the screen without overflow (${b.left}..${b.right} of ${b.vw}, page ${b.scrollW})`);
  if (!b.focused) fail(size, 'search', 'the input is not focused when the bar opens');
  if (b.inputH < 44 || b.inputFont < 16) fail(size, 'search', `input is ${b.inputH}px tall / ${b.inputFont}px text (needs 44px / 16px so iOS does not zoom)`);
  if (desktop && b.expanded !== 'true') fail(size, 'search', 'the search button should report aria-expanded=true');
  if (b.drawerOpen) fail(size, 'search', 'the menu drawer should close when Search is chosen');
  if (b.chips !== 6 || b.chipH.some((h) => h < 44)) fail(size, 'search', `popular searches: ${b.chips} chips, heights ${b.chipH}`);
  await page.click('#site-search ul button:text-is("Aloknonda")');
  b = await bar();
  const chipOpts = await opts();
  if (b.value !== 'Aloknonda' || !chipOpts.length || !chipOpts.at(-1).text.startsWith('See all')) fail(size, 'search', 'clicking a popular search should fill the box and show results');
  await page.fill('#site-search-input', '');

  /* live results */
  await page.fill('#site-search-input', 'rose');
  let o = await opts();
  if (o.length < 6 || !o[0].text.toLowerCase().includes('rose') || !o.at(-1).text.startsWith('See all') || o.at(-1).href !== '/search?q=rose') fail(size, 'search', `results for "rose": ${o.map((x) => x.text).join(' | ')}`);
  if (o.some((x) => x.h < 44)) fail(size, 'search', `a result row is only ${Math.min(...o.map((x) => x.h))}px tall`);
  b = await bar();
  if (o.at(-1).bottom > vh || b.bottom > vh) fail(size, 'search', `"See all" is not visible on screen (bottom ${o.at(-1).bottom}, screen ${vh})`);
  if (!o.some((x) => x.text.includes('Choosing the right roses'))) fail(size, 'search', 'a matching news article is missing from the results');
  for (const variant of ['roses', 'ROSE', 'ros']) {
    await page.fill('#site-search-input', variant);
    const v = await opts();
    if (!v.length || !v[0].text.toLowerCase().includes('rose')) fail(size, 'search', `"${variant}" should still find the roses`);
  }
  await page.fill('#site-search-input', 'wedding gift');
  o = await opts();
  if (!o.length || !o[0].text.includes('Wedding Gift')) fail(size, 'search', `"wedding gift" should put the wedding gift first: ${o.map((x) => x.text).join(' | ')}`);
  await page.fill('#site-search-input', 'rose');

  /* keyboard */
  await page.keyboard.press('ArrowDown');
  o = await opts();
  b = await bar();
  if (o[0].sel !== 'true' || b.active !== 'search-opt-0') fail(size, 'search', 'ArrowDown should highlight the first result');
  await page.keyboard.press('ArrowUp');
  o = await opts();
  if (o.at(-1).sel !== 'true') fail(size, 'search', 'ArrowUp from the first result should wrap to the last one');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  if (!pathname().startsWith('/shop/') || (await bar())) fail(size, 'search', `Enter on a result went to ${pathname()} (bar ${(await bar()) ? 'still open' : 'closed'})`);

  /* no results, results page */
  await openBar('/about');
  if (desktop) {
    const logo = await page.evaluate(() => getComputedStyle(document.querySelector('header a[aria-label$="home"] span')).color);
    if (logo !== 'rgb(7, 28, 31)') fail(size, 'search', `while the bar is open over a dark banner the header should turn light (logo is ${logo})`);
  }
  await page.fill('#site-search-input', 'zzzzqq');
  const none = await page.evaluate(() => ({ text: document.getElementById('site-search').innerText, list: !!document.getElementById('search-results') }));
  if (!none.text.includes('Nothing found') || none.list) fail(size, 'search', 'no-result message is wrong');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  if (pathname() !== '/search' || new URL(page.url()).searchParams.get('q') !== 'zzzzqq' || !((await page.locator('main h2').first().textContent()) || '').includes('No results')) fail(size, 'search', 'Enter on your own words should open the results page with "No results"');
  await openBar('/');
  await page.keyboard.press('Enter');
  if (!(await bar())) fail(size, 'search', 'Enter on an empty box should not close the bar');

  /* closing */
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  if (await bar()) fail(size, 'search', 'Esc does not close the bar');
  if (desktop && (await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))) !== 'Search') fail(size, 'search', 'Esc should give focus back to the search button');
  await openBar('/');
  await page.click('button[aria-label="Close search"]');
  if (await bar()) fail(size, 'search', 'the X button does not close the bar');
  await openBar('/');
  await page.mouse.click(Math.round(vw / 2), Math.round(vh - 8));
  await page.waitForTimeout(200);
  if (await bar()) fail(size, 'search', 'clicking outside the bar does not close it');
  if (desktop) {
    await openBar('/');
    await page.click('header button[aria-label="Search"]');
    if (await bar()) fail(size, 'search', 'clicking the search button again should close the bar');
  }

  /* results page */
  await page.goto(BASE + '/search?q=aloknonda', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager')));
  const sp = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent.trim(),
    title: document.title,
    input: document.getElementById('search-page-input').value,
    status: document.querySelector('main [role=status]').textContent.trim(),
    cards: document.querySelectorAll('main ul.grid article').length,
    heads: [...document.querySelectorAll('main h2')].map((h) => h.textContent.trim().replace(/\s+/g, ' ')),
    cols: new Set([...document.querySelectorAll('main ul.grid > li')].filter((li) => li.querySelector('button[aria-label^="Quick view"]')).map((li) => Math.round(li.getBoundingClientRect().left))).size,
  }));
  const wantCols = Math.min(sp.cards, vw < 375 ? 1 : vw < 768 ? 2 : vw < 1024 ? 3 : 4);
  if (sp.h1 !== 'Search' || sp.title !== 'Search: aloknonda - FulBari' || sp.input !== 'aloknonda') fail(size, 'search', `results page: h1 "${sp.h1}", title "${sp.title}", box "${sp.input}"`);
  if (sp.cards !== 7 || !sp.status.includes('7 results') || sp.heads[0] !== 'Products (7)') fail(size, 'search', `"aloknonda" should show 7 products: ${sp.cards} cards, "${sp.status}", ${sp.heads}`);
  if (sp.cols !== wantCols) fail(size, 'search', `${sp.cols} product columns, expected ${wantCols}`);
  await page.fill('#search-page-input', 'orchid');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (new URL(page.url()).searchParams.get('q') !== 'orchid' || !((await page.locator('main article h3').allInnerTexts()).join('|')).includes('Pink Orchid Plant')) fail(size, 'search', 'searching again on the results page does not update the results');
  await page.goto(BASE + '/search?q=wedding', { waitUntil: 'networkidle' });
  const wed = await page.evaluate(() => [...document.querySelectorAll('main h2')].map((h) => h.textContent.trim().replace(/\s+/g, ' ')));
  if (!wed.some((h) => h.startsWith('Products')) || !wed.some((h) => h.startsWith('News'))) fail(size, 'search', `"wedding" should show products and news: ${wed}`);
  await page.goto(BASE + '/search?q=contact', { waitUntil: 'networkidle' });
  if (!(await page.evaluate(() => [...document.querySelectorAll('main h2')].some((h) => h.textContent.startsWith('Pages'))))) fail(size, 'search', '"contact" should list the Contact page');
  await page.goto(BASE + '/search', { waitUntil: 'networkidle' });
  if (!((await page.locator('main [role=status]').first().textContent()) || '').includes('Type what you are looking for')) fail(size, 'search', 'an empty search page has no hint');
  await page.click('main ul a:text-is("Roses")');
  await page.waitForTimeout(300);
  if (new URL(page.url()).searchParams.get('q') !== 'Roses') fail(size, 'search', 'a popular-search link on the results page does not search');
}

/* ---------- run ---------- */
const browser = await chromium.launch({ channel: CHANNEL });
for (const [w, h] of SIZES) {
  const size = `${w}x${h}`;
  const touch = w < 1024;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && errors.push(m.text()));
  page.on('response', (r) => r.status() >= 400 && !/fonts\.(googleapis|gstatic)/.test(r.url()) && !r.url().endsWith('/no-such-page') && errors.push(`${r.status()} ${r.url()}`));

  let info = null;
  for (const spec of SPECS) {
    await open(page, spec);
    const res = await page.evaluate(pageChecks, { kind: spec.kind, expectedWidth: w });
    if (spec.kind === 'home') info = res.info;
    const seen = new Set();
    res.out.forEach(([t, d]) => { const k = t + d; if (!seen.has(k)) { seen.add(k); fail(size, `${spec.name} ${t}`, d); } });
    if (SHOT_WIDTHS.has(w)) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: join(SHOTS, `${spec.slug}-${w}.png`), fullPage: true });
    }
  }

  await open(page, { path: '/' });
  if (touch) await menuTests(page, size, w, h);
  await open(page, { path: '/' });
  await accountTests(page, size, w, h);
  await shopTests(page, size, touch);
  for (const t of PHOTO_TABS) await photoTabTests(page, size, w, t);
  await sectionPhotoTests(page, size, w);
  await aloknondaTabTests(page, size, w);
  await authFlow(page, size);
  await wishlistFlow(page, size, w);
  await accountFlow(page, size, w);
  await pagesFlow(page, size, w);
  await productFlow(page, size, w);
  await cartFlow(page, size, w);
  await heroFlow(page, size, w, h);
  await searchFlow(page, size, w, h);
  errors.forEach((e) => fail(size, 'console', e));

  const mine = results.filter((r) => r.size === size).length;
  console.log(`${mine ? 'FAIL' : ' ok '} ${size.padEnd(9)} h1=${info.h1}px h2=${info.h2}px body=${info.body}px nav=${info.nav ?? '-'} card=${info.product}px price=${info.price}px  fonts:${info.fontsLoaded ? 'web' : 'FALLBACK'}  height=${info.pageHeight}px`);
  await ctx.close();
}
await browser.close();

if (results.length) {
  console.log('\nIssues:');
  const grouped = new Map();
  for (const r of results) { const k = `${r.test}: ${r.detail}`; (grouped.get(k) || grouped.set(k, []).get(k)).push(r.size); }
  for (const [k, sizes] of grouped) console.log(`  [${sizes.join(' ')}] ${k}`);
  console.log(`\n${results.length} issue(s) found.`);
  process.exit(1);
}
console.log('\nAll checks passed at every size (layout on every page + menu, account, shop, auth and wishlist flows).');
