// All copy, prices and image paths live here. Everything is placeholder content modelled on the
// reference design - swap freely. Images are in /public/images (regenerate with `npm run images`).

import edges from './aloknonda-edges.json';

export const SITE = {
  name: 'FulBari',
  currency: '$',
  // Paste an embeddable URL (e.g. https://www.youtube.com/embed/<id>) to make the play button open a real video.
  videoEmbedUrl: '',
};

// Real photos (see scripts/optimize-photos.mjs): a small and a large WebP so phones download the small one.
// `sizes` matches the product grid: 1 column under 375px, 2 columns under 768px, 3 under 1024px, then 4.
const GRID_SIZES = '(min-width: 1280px) 270px, (min-width: 1024px) 21vw, (min-width: 768px) 30vw, (min-width: 375px) 46vw, 90vw';
const photo = (prefix, name, sizes = GRID_SIZES) => ({
  image: `/images/${prefix}-${name}-800.webp`,
  srcSet: `/images/${prefix}-${name}-400.webp 400w, /images/${prefix}-${name}-800.webp 800w`,
  sizes,
});
// A photo used as a picture (gallery / promo / blog): the same files as the products, with its own `sizes`.
const shot = (prefix, name, alt, sizes, focus) => ({ ...photo(prefix, name, sizes), alt, focus });

// Aloknonda: studio photos on an off-white background. "tileBg" is the photo's own background colour, so the product
// tile matches it and the photo edges vanish.
const aloknonda = (colour) => ({ ...photo('aloknonda', colour), tileBg: edges[colour] });
// Full-frame photo sets (bouquets, roses, plants, gifts, wedding): the photo fills the whole tile (cover). `focus` = CSS object-position
// when the crop matters.
const fullFrame = (prefix) => (name, focus) => ({ ...photo(prefix, name), cover: true, focus });
const bouquet = fullFrame('bouquet');
const rose = fullFrame('rose');
const plant = fullFrame('plant');
const gift = fullFrame('gift');
const wedding = fullFrame('wedding');

// to: '/path' = route, '/#id' = section on the home page, '#id' = anchor on the current page.
export const NAV = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Shop', to: '/#shop' },
  { label: 'News', to: '/news' },
  { label: 'Pages', to: '/#gallery' },
  { label: 'Contact', to: '/contact' },
];

// "Get a Quote" opens the contact form with the quote topic already chosen.
export const QUOTE_LINK = '/contact?topic=quote';

// Profile-icon dropdown. guestOnly items are hidden once signed in (a "Sign out" action replaces them).
export const ACCOUNT_LINKS = [
  { label: 'Sign in', to: '/sign-in', guestOnly: true },
  { label: 'Register', to: '/register', guestOnly: true },
  { label: 'My Account', to: '/account' },
  { label: 'Wishlist', to: '/wishlist' },
];

export const HERO_SLIDES = [
  {
    eyebrow: '100% genuine Products',
    title: 'Golden Aloknonda In Full Bloom',
    text: 'Bright yellow trumpet flowers on glossy green leaves - a sun-loving shrub that fills your balcony or garden with colour, delivered in our FulBari pot.',
    cta: 'Explore Products',
    href: '#shop',
    // Transparent cut-out, shipped as small WebP files (see scripts/optimize-hero.mjs).
    image: '/images/hero-aloknonda-960.webp',
    srcSet: '/images/hero-aloknonda-320.webp 320w, /images/hero-aloknonda-640.webp 640w, /images/hero-aloknonda-960.webp 960w',
    sizes: '(min-width: 1024px) 470px, (min-width: 768px) 450px, (min-width: 640px) 360px, 300px',
    alt: 'A potted yellow Aloknonda (Allamanda) plant in full bloom, in a white FulBari pot',
  },
  {
    eyebrow: 'Fresh every morning',
    title: 'Bloom Into Every Occasion',
    text: 'Weddings, birthdays or just because - build a bouquet that fits the moment and we will have it ready the same day.',
    cta: 'Shop Bouquets',
    href: '#shop',
    // Transparent cut-out that sways in a light breeze (see WindPlant.jsx). potTop = where the fixed pot starts (0 = top, 1 = bottom).
    image: '/images/hero-plant-1000.webp',
    srcSet: '/images/hero-plant-640.webp 640w, /images/hero-plant-1000.webp 1000w, /images/hero-plant-1312.webp 1312w',
    sizes: '(min-width: 1024px) 470px, (min-width: 768px) 450px, (min-width: 640px) 360px, 300px',
    alt: 'A full Aloknonda plant covered in yellow trumpet flowers, in a white FulBari pot',
    animated: true,
    potTop: 0.735,
  },
];

const GALLERY_SIZES = '(min-width: 1024px) 367px, (min-width: 640px) 300px, 240px';
export const GALLERY = [
  shot('wedding', 'burgundy', 'Burgundy velvet rose bouquet wrapped in wine and black paper', GALLERY_SIZES, '50% 25%'),
  shot('gift', 'heart', 'Heart-shaped gift box of peach tulips, cream roses and chocolates', GALLERY_SIZES),
  shot('wedding', 'peach', 'Peach and blush rose bouquet with a satin bow', GALLERY_SIZES),
  shot('bouquet', 'gerbera', 'Gerbera daisy bouquet in pink wrapping with a red ribbon', GALLERY_SIZES),
  shot('gift', 'orchid', 'Oval gift box of white orchids, lilac blooms and chocolates', GALLERY_SIZES),
  shot('rose', 'white', 'Cream rose bouquet in gold and ivory wrapping', GALLERY_SIZES),
];

// Tab order in "Our Products" (after ALL). Each name matches the `category` of the products it filters.
export const CATEGORIES = ['Bouquets', 'Roses', 'Plants', 'Aloknonda', 'Wedding', 'Gifts'];

// badge: 'NEW' | percent string | undefined. Order matters: the "All" tab shows the first items.
// Products with category 'Aloknonda' are what the ALOKNONDA tab filters to.
export const PRODUCTS = [
  { id: 'bouquet-ivory', name: 'Ivory Elegance Bouquet', category: 'Bouquets', price: 48, oldPrice: 62, rating: 4.5, reviews: 36, badge: '-23%', ...bouquet('ivory') },
  { id: 'rose-crimson', name: 'Crimson Velvet Rose Bouquet', category: 'Roses', price: 64, oldPrice: 78, rating: 5, reviews: 47, badge: '-18%', ...rose('crimson') },
  { id: 'plant-orchid', name: 'Pink Orchid Plant', category: 'Plants', price: 58, oldPrice: 70, rating: 5, reviews: 33, badge: '-17%', ...plant('orchid') },
  { id: 'wedding-peach', name: 'Peach Blush Rose Bouquet', category: 'Wedding', price: 84, oldPrice: 98, rating: 4.5, reviews: 23, badge: '-14%', ...wedding('peach') },
  { id: 'gift-hatbox', name: 'Rose & Chocolate Hat Box', category: 'Gifts', price: 78, oldPrice: 92, rating: 5, reviews: 41, badge: '-15%', ...gift('hatbox') },
  { id: 'bouquet-ruby', name: 'Ruby Romance Bouquet', category: 'Bouquets', price: 56, rating: 5, reviews: 52, badge: 'NEW', ...bouquet('ruby') },
  { id: 'rose-blush', name: 'Blush Pink Rose Bouquet', category: 'Roses', price: 59, rating: 4.5, reviews: 31, badge: 'NEW', ...rose('blush') },
  { id: 'plant-jade', name: 'Jade Bonsai Plant', category: 'Plants', price: 34, rating: 4.5, reviews: 28, badge: 'NEW', ...plant('jade') },
  { id: 'wedding-burgundy', name: 'Burgundy Velvet Rose Bouquet', category: 'Wedding', price: 92, rating: 5, reviews: 30, badge: 'NEW', ...wedding('burgundy') },
  { id: 'gift-heart', name: 'Heart Tulip & Chocolate Box', category: 'Gifts', price: 68, rating: 4.5, reviews: 27, badge: 'NEW', ...gift('heart') },
  { id: 'bouquet-gerbera', name: 'Rainbow Gerbera Bouquet', category: 'Bouquets', price: 39, oldPrice: 46, rating: 4, reviews: 18, badge: '-15%', ...bouquet('gerbera') },
  { id: 'rose-white', name: 'Pure White Rose Bouquet', category: 'Roses', price: 56, oldPrice: 68, rating: 4.5, reviews: 26, badge: '-18%', ...rose('white') },
  { id: 'plant-peace-lily', name: 'Peace Lily in Ceramic Pot', category: 'Plants', price: 38, oldPrice: 46, rating: 4.5, reviews: 22, badge: '-17%', ...plant('peace-lily') },
  { id: 'bouquet-lavender', name: 'Lavender Rose Bouquet', category: 'Bouquets', price: 52, oldPrice: 64, rating: 4.5, reviews: 24, badge: '-19%', ...bouquet('lavender', '72% 50%') },
  { id: 'bouquet-lily', name: 'Pink Lily Bouquet', category: 'Bouquets', price: 58, rating: 4.5, reviews: 29, badge: 'NEW', ...bouquet('lily') },
  { id: 'bouquet-sunflower', name: 'Golden Sunflower Bouquet', category: 'Bouquets', price: 36, oldPrice: 42, rating: 4, reviews: 21, badge: '-14%', ...bouquet('sunflower') },
  { id: 'rose-golden', name: 'Golden Sunshine Rose Bouquet', category: 'Roses', price: 62, rating: 4, reviews: 19, badge: 'NEW', ...rose('golden') },
  { id: 'rose-cocoa', name: 'Passion Red Rose Bouquet', category: 'Roses', price: 54, oldPrice: 65, rating: 4.5, reviews: 38, badge: '-17%', ...rose('cocoa') },
  { id: 'rose-wedding', name: 'Red Aloknonda Wedding Gift', category: 'Roses', price: 45, rating: 4, reviews: 14, badge: 'NEW', ...rose('wedding') },
  { id: 'plant-anthurium', name: 'Red Anthurium Plant', category: 'Plants', price: 42, rating: 4.5, reviews: 25, badge: 'NEW', ...plant('anthurium') },
  { id: 'plant-pothos', name: 'Golden Pothos Plant', category: 'Plants', price: 29, oldPrice: 35, rating: 4, reviews: 17, badge: '-17%', ...plant('pothos') },
  { id: 'plant-snake', name: 'Variegated Snake Plant', category: 'Plants', price: 27, rating: 4.5, reviews: 20, badge: 'NEW', ...plant('snake') },
  { id: 'gift-orchid', name: 'Orchid & Chocolate Gift Box', category: 'Gifts', price: 72, oldPrice: 85, rating: 4.5, reviews: 18, badge: '-15%', ...gift('orchid') },
  { id: 'gift-sunflower', name: 'Sunflower & Chocolate Crate', category: 'Gifts', price: 64, rating: 4, reviews: 16, badge: 'NEW', ...gift('sunflower') },
  { id: 'aloknonda-yellow', name: 'Golden Aloknonda', category: 'Aloknonda', price: 34, oldPrice: 42, rating: 4.5, reviews: 41, badge: '-19%', ...aloknonda('yellow') },
  { id: 'aloknonda-pink', name: 'Pink Aloknonda', category: 'Aloknonda', price: 36, rating: 4.5, reviews: 27, badge: 'NEW', ...aloknonda('pink') },
  { id: 'aloknonda-red', name: 'Ruby Red Aloknonda', category: 'Aloknonda', price: 38, oldPrice: 45, rating: 4, reviews: 19, badge: '-16%', ...aloknonda('red') },
  { id: 'aloknonda-crimson', name: 'Crimson Aloknonda', category: 'Aloknonda', price: 38, rating: 5, reviews: 33, badge: 'NEW', ...aloknonda('crimson') },
  { id: 'aloknonda-coral', name: 'Sunset Coral Aloknonda', category: 'Aloknonda', price: 40, oldPrice: 48, rating: 4.5, reviews: 22, badge: '-17%', ...aloknonda('coral') },
  { id: 'aloknonda-white', name: 'Pure White Aloknonda', category: 'Aloknonda', price: 42, rating: 4, reviews: 15, ...aloknonda('white') },
];

// "Featured Products" are picked from the shop catalogue by id, so a featured card is the very same product
// (same photo, price, cart and wishlist) as in "Our Products".
export const FEATURED = ['rose-crimson', 'bouquet-lily', 'plant-anthurium', 'gift-hatbox'].map((id) => PRODUCTS.find((p) => p.id === id));

export const PROMO = {
  label: 'Todays Hot Deals',
  title: 'Fresh Sunflower Combo Package',
  cta: 'Shop Now',
  href: '#featured',
  ...shot('gift', 'sunflower', 'A wooden crate of sunflowers, eucalyptus and chocolates tied with a golden bow', '(min-width: 1280px) 400px, (min-width: 1024px) 360px, (min-width: 640px) 340px, 280px'),
};

export const TESTIMONIALS = [
  { name: 'Rosalina D. William', role: 'Founder', avatar: '/images/avatar-1.svg', text: 'The bouquet arrived fresher than anything I have ordered before, and the arrangement looked exactly like the photo. It made the whole anniversary.' },
  { name: 'Daniel K. Carter', role: 'Event Planner', avatar: '/images/avatar-2.svg', text: 'We booked all the table centrepieces for a 200-guest wedding. Every single one was delivered on time and the couple could not stop talking about them.' },
  { name: 'Amelia S. Hart', role: 'Customer', avatar: '/images/avatar-3.svg', text: 'Ordering was easy, the same-day delivery was real, and the flowers lasted more than two weeks. This is now my go-to florist for gifts.' },
];

const BLOG_SIZES = '(min-width: 1024px) 370px, (min-width: 768px) 46vw, 92vw';

// Placeholder articles - replace the copy freely. `sections` = subheading + paragraphs; the photo is one of the shop photos.
export const POSTS = [
  {
    slug: 'keep-cut-flowers-fresh',
    title: 'How to keep cut flowers fresh for two weeks',
    author: 'Admin',
    tag: 'Care Tips',
    date: 'September 9, 2026',
    excerpt: 'A clean vase, fresh cuts and cool water: three small habits that add days to every bouquet.',
    sections: [
      { heading: 'Start with a clean vase', paragraphs: [
        'Bacteria are the biggest enemy of cut flowers. Wash the vase with hot, soapy water before you use it, and rinse it well so no soap film is left behind.',
        'Fill it with lukewarm water and stir in the flower food that came with your bouquet. It feeds the stems and keeps the water clear for longer.',
      ] },
      { heading: 'Trim the stems', paragraphs: [
        'Cut 2-3 cm off the bottom of every stem at an angle, using sharp scissors or a knife. Blunt kitchen scissors crush the stem and stop it drinking.',
        'Strip any leaves that would sit under the waterline - they rot quickly and cloud the water. Trim again every two days to keep the stems drinking.',
      ] },
      { heading: 'Choose the right spot', paragraphs: [
        'Keep the vase out of direct sun and away from radiators, draughts and the fruit bowl - ripening fruit gives off a gas that ages flowers faster.',
        'Change the water every two days. Most bouquets stay fresh for a week; with this routine many last close to two.',
      ] },
    ],
    ...photo('bouquet', 'lavender', BLOG_SIZES),
    focus: '50% 12%',
  },
  {
    slug: 'choosing-the-right-roses',
    title: 'Choosing the right roses for every occasion',
    author: 'Admin',
    tag: 'Guides',
    date: 'August 22, 2026',
    excerpt: 'What each rose colour says, how many stems to send and how to spot a really fresh rose.',
    sections: [
      { heading: 'Pick a colour with meaning', paragraphs: [
        'Red roses say love and passion, pink says gratitude and admiration, and white stands for new beginnings and remembrance. Yellow is friendship and celebration, while peach and coral say thank you.',
        'When you are not sure, cream or blush roses suit nearly every occasion, and a mixed bouquet is always a safe choice.',
      ] },
      { heading: 'How many stems?', paragraphs: [
        'A single stem is a sweet, simple gesture. A dozen is the classic for anniversaries, and a larger arrangement makes a statement for a big birthday or a proposal.',
      ] },
      { heading: 'How to spot a fresh rose', paragraphs: [
        'Look for firm, tightly furled buds with a little colour showing, healthy green leaves and no browning at the petal edges. Roses that are already wide open will not last as long.',
      ] },
    ],
    ...photo('rose', 'golden', BLOG_SIZES),
    focus: '50% 30%',
  },
  {
    slug: 'wedding-flowers-guide',
    title: 'Wedding flowers: seasonal picks and budgets',
    author: 'Admin',
    tag: 'Weddings',
    date: 'July 23, 2026',
    excerpt: 'Book early, buy in season and spend where it shows - a simple plan for wedding flowers.',
    sections: [
      { heading: 'Book early', paragraphs: [
        'Speak to your florist three to six months before the big day, especially for peak-season weekends. Early booking gives you the most choice and the best price.',
      ] },
      { heading: 'Choose what is in season', paragraphs: [
        'Seasonal flowers are fresher and cheaper. Peonies and tulips shine in spring, dahlias and sunflowers in late summer, and roses are lovely all year round.',
      ] },
      { heading: 'Spend where it shows', paragraphs: [
        'Put most of the budget into the bridal bouquet and the ceremony focal point, then move the ceremony arrangements to the reception tables so you get twice the use.',
        'Smaller touches such as buttonholes and a few posies by the candles keep the look cohesive without the cost.',
      ] },
    ],
    ...photo('bouquet', 'ivory', BLOG_SIZES),
    focus: '50% 55%',
  },
  {
    slug: 'low-light-plants',
    title: 'Five indoor plants that thrive in low light',
    author: 'Admin',
    tag: 'Plants',
    date: 'June 24, 2026',
    excerpt: 'Snake plants, pothos and peace lilies: easy plants that cope with dim corners.',
    sections: [
      { heading: 'Five plants for shady rooms', paragraphs: [
        'Snake plant, ZZ plant, pothos, peace lily and cast iron plant all cope with dim rooms and forgive the odd missed watering. Snake plants and pothos are the easiest to start with, and peace lilies even flower in lower light.',
      ] },
      { heading: 'Water less than you think', paragraphs: [
        'Low light means slow growth and soil that dries out slowly, so water only when the top few centimetres feel dry. Overwatering is the most common reason indoor plants fail.',
      ] },
      { heading: 'Give them a turn', paragraphs: [
        'Rotate the pot a quarter turn each week so every side gets a little light, and wipe the leaves now and then - clean leaves absorb more of the light that is available.',
      ] },
    ],
    ...photo('plant', 'snake', BLOG_SIZES),
  },
  {
    slug: 'unpack-your-flower-delivery',
    title: 'How to unpack and revive your flower delivery',
    author: 'Admin',
    tag: 'Care Tips',
    date: 'June 3, 2026',
    excerpt: 'Open the box, re-cut the stems and give your bouquet a long drink - the first hour matters most.',
    sections: [
      { heading: 'Unpack straight away', paragraphs: [
        'Take the bouquet out of the box as soon as it arrives and remove the outer wrapping. Flowers travel without much water and are thirsty when they reach you.',
      ] },
      { heading: 'Re-cut and drink', paragraphs: [
        'Trim 2-3 cm off the stems at an angle and stand the flowers in a clean vase of lukewarm water with flower food.',
      ] },
      { heading: 'Give buds time', paragraphs: [
        'Some blooms arrive tightly closed on purpose - roses and lilies in particular - so they travel safely. Give them a day or two in a cool, bright room to open fully.',
      ] },
    ],
    ...photo('rose', 'cocoa', BLOG_SIZES),
  },
  {
    slug: 'flowers-and-chocolate-gifts',
    title: 'Flowers and chocolates: gifts that say thank you',
    author: 'Admin',
    tag: 'Gifts',
    date: 'May 14, 2026',
    excerpt: 'Pairing flowers with something sweet turns a nice gesture into a memorable gift.',
    sections: [
      { heading: 'Match the mood', paragraphs: [
        'Blush roses with milk chocolate feel warm and romantic, bright sunflowers with caramel are cheerful and casual, and white orchids with dark chocolate are elegant and calm.',
      ] },
      { heading: 'Think about the box', paragraphs: [
        'A hat box or a wooden crate keeps everything together and doubles as a keepsake once the flowers have faded.',
      ] },
      { heading: 'Add a note', paragraphs: [
        'A short handwritten message costs nothing and is often what people remember. Tell us what to write and we will tuck a card in for you.',
      ] },
    ],
    ...photo('gift', 'orchid', BLOG_SIZES),
  },
];

// "Latest Blog" on the home page shows the newest four.
export const LATEST_POSTS = POSTS.slice(0, 4);

// About page copy (placeholder - replace with your own story).
export const ABOUT = {
  story: {
    label: '// Our story',
    title: 'Flowers grown, arranged and delivered with care',
    paragraphs: [
      'FulBari means "house of flowers" - ful is flower, bari is home - and that is how we run the shop: like a home for people who love flowers.',
      'We started with a single stall and one simple rule: only sell flowers we would be happy to give ourselves. Today our florists still choose every stem by hand, build each bouquet to order and wrap it with ribbon and, if you like, a handwritten card.',
      'From everyday bouquets and potted plants to wedding flowers and gift boxes, everything we make is fresh, honest and made to be enjoyed.',
    ],
    ...shot('rose', 'blush', 'A bouquet of blush pink roses with baby\'s breath in pink wrapping', '(min-width: 1024px) 560px, (min-width: 640px) 92vw, 92vw'),
  },
  stats: [
    { value: '12k+', label: 'Bouquets delivered' },
    { value: '30+', label: 'Flowers & plants' },
    { value: '4.9/5', label: 'Average rating' },
    { value: 'Same day', label: 'Local delivery' },
  ],
  steps: [
    { title: 'Sourced fresh', text: 'Flowers and plants reach our studio every morning and are chosen stem by stem for colour, scent and shape.' },
    { title: 'Arranged by hand', text: 'Our florists build each bouquet to order, wrapping it in paper and ribbon that suit the flowers.' },
    { title: 'Delivered with care', text: 'Your order travels in a box made to keep it fresh, and arrives on the day you choose.' },
  ],
  cta: {
    title: 'Ready to send something beautiful?',
    text: 'Browse the shop, or tell us what you have in mind and we will make it.',
  },
};

// Site search: pages that can be found, and the "popular searches" offered before you type.
export const SEARCH_PAGES = [
  { label: 'About us', to: '/about', keywords: 'story florist team how we work stem doorstep' },
  { label: 'News', to: '/news', keywords: 'blog articles care tips guides' },
  { label: 'Contact', to: '/contact', keywords: 'phone email address opening hours faq questions help delivery message' },
  { label: 'Get a quote', to: '/contact?topic=quote', keywords: 'custom arrangement price event' },
  { label: 'Cart', to: '/cart', keywords: 'basket checkout order shopping' },
  { label: 'Wishlist', to: '/wishlist', keywords: 'saved favourites favorites hearts' },
  { label: 'My account', to: '/account', keywords: 'profile address orders details dashboard logout' },
  { label: 'Sign in', to: '/sign-in', keywords: 'login log in' },
  { label: 'Register', to: '/register', keywords: 'sign up create account join' },
];
export const POPULAR_SEARCHES = ['Roses', 'Aloknonda', 'Wedding', 'Gift', 'Orchid', 'Sunflower'];

// Delivery cost used by the cart: free from `freeOver`, otherwise a flat `fee`.
export const SHIPPING = { freeOver: 100, fee: 8 };

// Copy for the product details page, by product category (placeholder - replace freely).
const CUT_FLOWER_CARE = [
  'Trim 2-3 cm off the stems at an angle and stand them in clean lukewarm water with the flower food.',
  'Keep away from direct sun, radiators and ripening fruit.',
  'Change the water every two days and re-trim the stems.',
];
export const CATEGORY_INFO = {
  Bouquets: {
    blurb: [
      'Hand-tied by our florists from the freshest stems of the morning and wrapped in paper and a satin ribbon, ready to give.',
      'Every bouquet comes with flower food and a care card. Tell us what to write and we will tuck a handwritten note in.',
    ],
    care: CUT_FLOWER_CARE,
  },
  Roses: {
    blurb: [
      'Roses chosen for firm buds and rich colour, arranged with soft greenery and wrapped by hand.',
      'Roses open slowly over a day or two after they arrive, so you get the fullest bloom just when you want it.',
    ],
    care: ['Remove any leaves that would sit under the waterline, then re-cut the stems at an angle.', ...CUT_FLOWER_CARE.slice(1)],
  },
  Plants: {
    blurb: [
      'A healthy, well-rooted plant in a ceramic pot, ready to display the day it arrives.',
      'Easy to look after, and a gift that lasts long after cut flowers would have faded.',
    ],
    care: [
      'Bright, indirect light suits most plants. Turn the pot a quarter turn each week.',
      'Water when the top few centimetres of soil feel dry, and never leave the pot standing in water.',
      'Wipe the leaves now and then so they can take in more light.',
    ],
  },
  Aloknonda: {
    blurb: [
      'A sun-loving climbing shrub covered in trumpet-shaped flowers, delivered in our FulBari pot.',
      'Aloknonda (Allamanda) flowers from spring to autumn and looks wonderful on a sunny balcony, terrace or garden fence.',
    ],
    care: [
      'Give it at least six hours of sun a day.',
      'Water deeply once the top of the soil has dried, and feed every few weeks while it is flowering.',
      'Give it a small trellis or stake to climb. The sap can irritate skin, so wear gloves when pruning.',
    ],
  },
  Wedding: {
    blurb: [
      'Designed for the big day: full, romantic and finished with satin ribbon and premium wrapping.',
      'Want to match your colours or add table arrangements? Get in touch and we will put a package together.',
    ],
    care: CUT_FLOWER_CARE,
  },
  Gifts: {
    blurb: [
      'A ready-to-give arrangement of flowers and chocolates, presented in a keepsake box.',
      'Add a handwritten note and we will tuck it in. Best enjoyed within a week for the freshest flowers.',
    ],
    care: [
      'Keep the box in a cool spot away from sun and heat so the chocolates stay perfect.',
      'Top up the flower foam with a little water each day.',
      'Enjoy the chocolates first, and keep the box afterwards.',
    ],
  },
};

export const TRUST_POINTS = [
  { icon: 'truck', title: 'Same-day delivery', text: 'Order before 2 pm and we deliver today' },
  { icon: 'sprout', title: 'Fresh guarantee', text: 'Not perfect within 3 days? We replace it' },
  { icon: 'gift', title: 'Free delivery', text: 'On every order over $100' },
];

export const FEATURES = [
  { icon: 'gift', title: 'Curated Products', text: 'Hand-picked blooms for every order over $100' },
  { icon: 'hand', title: 'Handmade', text: 'Every bouquet is arranged by our own florists' },
  { icon: 'sprout', title: 'Fresh Guarantee', text: 'Return within 3 days if your flowers are not perfect' },
  { icon: 'truck', title: 'Free home delivery', text: 'We ensure the quality that you can trust, delivered easily' },
];

// Placeholder details - replace with the real address, phone, email and opening hours.
export const CONTACT = {
  address: 'Brooklyn, New York, United States',
  phone: '+1 (555) 010-2030',
  phoneHref: 'tel:+15550102030',
  email: 'hello@fulbari.example',
  hours: [
    ['Monday - Saturday', '8:00 - 19:00'],
    ['Sunday', '9:00 - 16:00'],
  ],
};

// Topics offered by the contact form. "quote" is what the Get a Quote button preselects.
export const CONTACT_TOPICS = [
  { value: 'general', label: 'General question' },
  { value: 'quote', label: 'Get a quote' },
  { value: 'wedding', label: 'Wedding & events' },
  { value: 'delivery', label: 'Delivery & orders' },
];

export const FAQ = [
  { q: 'Do you offer same-day delivery?', a: 'Yes. Order before 2 pm and we will deliver the same day inside our delivery area.' },
  { q: 'Can I ask for a custom arrangement?', a: 'Of course. Tell us the occasion, colours and budget through the form and we will reply with a quote.' },
  { q: 'How long will my flowers last?', a: 'With a clean vase and fresh water every two days, most bouquets stay lovely for 7-14 days. Our News page has more care tips.' },
  { q: 'What if my order arrives damaged?', a: 'Send us a photo within 3 days and we will replace it or refund you.' },
];

export const FOOTER = {
  about: 'FulBari grows, arranges and delivers fresh flowers, plants and gifts - made by hand, sent with care.',
  contact: [
    { icon: 'pin', text: CONTACT.address },
    { icon: 'phone', text: CONTACT.phone, href: CONTACT.phoneHref },
    { icon: 'mail', text: CONTACT.email, href: `mailto:${CONTACT.email}` },
  ],
  // Links without a page yet point at the home page ('/') - swap in real routes as you build them.
  columns: [
    {
      title: 'Company',
      links: [
        { label: 'About', to: '/about' },
        { label: 'Blog', to: '/news' },
        { label: 'All Products', to: '/#shop' },
        { label: 'Locations Map', to: '/' },
        { label: 'FAQ', to: '/' },
        { label: 'Contact us', to: '/contact' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'Order tracking', to: '/' },
        { label: 'Wish List', to: '/wishlist' },
        { label: 'Login', to: '/sign-in' },
        { label: 'My account', to: '/account' },
        { label: 'Terms & Conditions', to: '/' },
        { label: 'Promotional Offers', to: '/#deal' },
      ],
    },
    {
      title: 'Customer Care',
      links: [
        { label: 'Login', to: '/sign-in' },
        { label: 'My account', to: '/account' },
        { label: 'Wish List', to: '/wishlist' },
        { label: 'Order tracking', to: '/' },
        { label: 'FAQ', to: '/' },
        { label: 'Contact us', to: '/contact' },
      ],
    },
  ],
};

// Every product a wishlist can reference (shop + featured).
export const ALL_PRODUCTS = PRODUCTS;
export const findProduct = (id) => ALL_PRODUCTS.find((p) => p.id === id);
