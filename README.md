# FulBari

Mobile-first flower shop - React 19 + Vite + Tailwind CSS v4 + React Router.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build -> dist/
npm run preview      # serve dist/ on http://localhost:4173
npm run qa           # responsive + behaviour QA in real Edge/Chrome (needs `npm run preview` running)
npm run images       # regenerate the illustrated artwork that is left (hero slide 2, video banner, page banner, avatars)
npm run hero         # re-make the responsive hero WebPs from assets/source/aloknonda-yellow.png
npm run photos       # re-make the product-photo WebPs (Aloknonda, bouquets, roses, plants, gifts, wedding) from assets/source/
```

## Pages

| Route | Page |
| --- | --- |
| `/` | Home (hero, gallery, shop, deal, featured, video, testimonials, blog, features) |
| `/shop/:id` | Shop details (photo, price, quantity, add to cart, description, care guide, related products) |
| `/cart` | Cart (quantities, totals, delivery). "Send order request" opens the contact form with the order filled in |
| `/about` | About (story, numbers, how we work, reviews) |
| `/news`, `/news/:slug` | News list (filter by topic) and single articles |
| `/search?q=` | Search results (products, news, pages). The header search icon opens a search bar with live suggestions; on phones it is the "Search..." row in the menu drawer. Search runs in the browser over `PRODUCTS`, `POSTS` and `SEARCH_PAGES` (`src/lib/search.js`) |
| `/contact` | Contact (details, form, FAQ). `/contact?topic=quote` preselects the quote topic - the Get a Quote button |
| `/sign-in` | Sign in |
| `/register` | Register |
| `/account`, `/account?tab=orders\|downloads\|address\|details` | My Account: sidebar (Dashboard, Orders, Downloads, Address, Account Details, Logout). Signed-in only; visitors are sent to `/sign-in` and back. Orders and Downloads are empty states - there is no order backend yet. Edit the `TABS` list in `src/pages/Account.jsx` to add or remove tabs |
| `/wishlist` | Wishlist as a list of rows (remove, picture, name, price, stock, Add to Cart) - the hearts on product cards |
| anything else | 404 |

Client-side routing means the host must serve `index.html` for unknown paths (Netlify: `/* /index.html 200`,
Vercel: a rewrite to `/index.html`, nginx: `try_files $uri /index.html`). `npm run dev` / `npm run preview` already do.

## Where things live

| What | Where |
| --- | --- |
| All copy, prices, nav, footer links, account-menu items, image paths | `src/data/site.js` |
| Brand tokens (lime, ink, cream, fonts), `scrollbar-hide`, `hoverable` variant | `src/index.css` |
| Cart lines, wishlist, signed-in user, quick-view (shared state) | `src/store/StoreContext.jsx` |
| **The only places that "talk to a server"**: sign in / register, and the contact form | `src/lib/auth.js`, `src/lib/contact.js` |
| Pages | `src/pages/*` (article copy, About copy, contact details and FAQ live in `src/data/site.js`) |
| One page container (max 1200px, 16/20/24/32px gutters) | `src/components/Container.jsx` |
| One product grid + one product card (Shop, Featured, Wishlist) | `ProductGrid.jsx`, `ProductCard.jsx` |
| Aloknonda tab (6 plants) | products live in `PRODUCTS` with `category: 'Aloknonda'`; the ALOKNONDA tab in "Our Products" is `CATEGORIES` in `src/data/site.js`; originals in `assets/source/`, web files generated into `public/images/` |
| Photo tabs: Bouquets, Roses, Plants, Gifts, Wedding | `PRODUCTS` entries `bouquet-*` / `rose-*` / `plant-*` / `gift-*` / `wedding-*` (`cover: true` fills the tile, `focus` = object-position); originals in `assets/source/{bouquet,rose,plant,gift,wedding}-*.png` |
| "We Have Done", the Sunflower Combo promo, Featured Products, Latest Blog | real photos, same files as the shop: `GALLERY`, `PROMO`, `FEATURED` (picked from `PRODUCTS` by id) and `POSTS` in `src/data/site.js` |
| Inner-page banner (Sign in / Register / Account / Wishlist / 404) | `src/components/PageBanner.jsx`; photo `assets/source/page-banner.png` -> `public/images/page-banner-*.webp` (`npm run photos`) |
| Hero slide 2 (the swaying plant) | `src/components/WindPlant.jsx` + slide 2 in `HERO_SLIDES`; photo `assets/source/hero-plant.png` -> `public/images/hero-plant-*.webp` (`npm run hero`). It is the still picture displaced by a wind wave on the GPU: pot and logo have zero movement, one 7 s seamless loop (`LOOP_SECONDS`), pauses when off-screen or hidden, plain picture for reduced-motion / no-WebGL. `potTop` in the slide = where the fixed pot begins |
| Images | `public/images/*` - replace with real photos of the same name. Keep full-size originals in `assets/source/`, **not** in `public/` (everything in `public/` is deployed) |

## Sign in / Register - important

There is **no backend**. `src/lib/auth.js` is a front-end stand-in: after a short delay it accepts any well-formed
input and returns `{ name, email }`, which is kept in `localStorage` so the session survives a reload. **Passwords are
passed to those two functions (so a real API call can send them) but are never stored or logged.** Replace the bodies
of `signInRequest` / `registerRequest` with `fetch()` calls; throw an `Error` and its message is shown on the form.
Do not ship the stand-in as real authentication. The contact form is a stand-in too: `src/lib/contact.js` sends nothing until you connect it to an email service or API.

The wishlist stores only product ids and the cart only `{ id, qty }` lines in `localStorage` (prices always come from the product data). There is no payment or checkout backend: the cart's "Send order request" opens the contact form with the order pre-filled, and `src/lib/contact.js` is still a stand-in.

## Responsive QA (`npm run qa`)

Loads every page state (home, sign in, register, account, wishlist empty / with items, 404) at 320, 360, 375, 390,
414, 430, 640, 768, 1024, 1280 and 1440px and checks: horizontal overflow (per element), header/burger state,
touch targets >= 44px, image loading and distortion, product-grid columns, form labels / 16px inputs, tabs, countdown,
testimonials, footer, text overlap. Then drives the flows: mobile drawer, account dropdown (all four items -> their
pages), shop tabs/paging/hover-vs-touch/cart/quick view, sign-in + register validation and success, sign out,
account details, session and wishlist persistence.
`BASE=<url>` targets another server, `SHOTS=<dir>` saves full-page screenshots, `ONLY=320,768` limits sizes.

Note: Playwright's *full-page* screenshot briefly flips touch emulation to hover-capable, so touch-only UI
(e.g. the always-visible product action row) can look different in those images. Viewport screenshots are exact.
