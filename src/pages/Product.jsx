import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button';
import { GiftIcon, HeartIcon, SproutIcon, TruckIcon } from '../components/Icons';
import PageBanner from '../components/PageBanner';
import ProductGrid from '../components/ProductGrid';
import QuantityStepper from '../components/QuantityStepper';
import Section from '../components/Section';
import SectionHeading from '../components/SectionHeading';
import Stars from '../components/Stars';
import Container from '../components/Container';
import { CATEGORY_INFO, PRODUCTS, TRUST_POINTS, findProduct } from '../data/site';
import { money } from '../lib/cart';
import useDocumentTitle from '../lib/useDocumentTitle';
import { useStore } from '../store/StoreContext';
import NotFound from './NotFound';

const TRUST_ICONS = { truck: TruckIcon, sprout: SproutIcon, gift: GiftIcon };

// One product ("shop details"). Unknown ids get the normal 404 page; `key` resets quantity when moving between products.
export default function Product() {
  const { id } = useParams();
  const product = findProduct(id);
  return product ? <ProductView key={product.id} product={product} /> : <NotFound />;
}

function ProductView({ product }) {
  useDocumentTitle(product.name);
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(0);

  const { name, category, price, oldPrice, rating, reviews, badge, image, srcSet, tileBg, cover, focus } = product;
  const info = CATEGORY_INFO[category];
  const liked = wishlist.includes(product.id);
  // Same category first, then the rest of the shop: always four to show.
  const related = [...PRODUCTS.filter((p) => p.category === category && p.id !== product.id), ...PRODUCTS.filter((p) => p.category !== category)].slice(0, 4);

  return (
    <>
      <PageBanner
        size="sm"
        label={category}
        title={name}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/#shop' }, { label: 'Details' }]}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className={`relative aspect-square overflow-hidden ${tileBg ? '' : 'bg-tile'}`} style={tileBg ? { backgroundColor: tileBg } : undefined}>
            <img
              src={image}
              srcSet={srcSet}
              sizes="(min-width: 1024px) 560px, 92vw"
              alt={name}
              width="800"
              height="800"
              fetchPriority="high"
              style={cover && focus ? { objectPosition: focus } : undefined}
              className={`size-full ${cover ? 'object-cover' : 'object-contain p-4'}`}
            />
            {badge && (
              <span className="absolute right-4 top-4 rounded-[12px_2px_12px_2px] bg-lime px-3 py-2 text-xs font-bold leading-none text-white sm:text-sm">
                {badge}
              </span>
            )}
          </div>

          <div>
            <p className="font-display text-sm font-bold uppercase text-lime">{category}</p>
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={rating} className="size-4" />
              <span className="text-sm">{reviews ? `${reviews} reviews` : 'Not reviewed yet'}</span>
            </div>

            <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-display font-bold text-lime">
              <span className="text-[34px] leading-none sm:text-[40px]">{money(price)}</span>
              {oldPrice && (
                <>
                  <s className="text-xl opacity-50">
                    <span className="sr-only">Was </span>
                    {money(oldPrice)}
                  </s>
                  <span className="text-sm text-ink">You save {money(oldPrice - price)}</span>
                </>
              )}
            </p>

            <p className="mt-5 text-sm leading-[1.8] md:text-base">{info.blurb[0]}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QuantityStepper value={qty} onChange={setQty} label={name} />
              <Button
                as="button"
                type="button"
                size="lg"
                className="min-w-0 flex-1 sm:flex-none"
                onClick={() => {
                  addToCart(product, qty);
                  setAdded(qty);
                }}
              >
                Add to cart
              </Button>
              <button
                type="button"
                aria-pressed={liked}
                aria-label={liked ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
                onClick={() => toggleWishlist(product)}
                className={`grid size-11 shrink-0 place-items-center border border-line bg-white transition-all duration-200 hover:bg-lime hover:text-white active:scale-95 sm:size-[56px] ${liked ? 'text-lime' : ''}`}
              >
                <HeartIcon className="size-5" fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>

            <p role="status" className="mt-3 min-h-6 text-sm font-semibold">
              {added > 0 && (
                <>
                  <span className="text-lime">
                    {added > 1 ? `${added} x ` : ''}
                    {name} added to your cart.
                  </span>{' '}
                  <Link to="/cart" className="inline-flex min-h-11 items-center underline transition-colors duration-200 hover:text-lime">
                    View cart
                  </Link>
                </>
              )}
            </p>

            <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 border-t border-line pt-6 text-sm md:text-base">
              <dt className="font-bold">Category</dt>
              <dd>{category}</dd>
              <dt className="font-bold">Availability</dt>
              <dd className="font-semibold text-lime">In stock</dd>
              <dt className="font-bold">Delivery</dt>
              <dd>Same day when ordered before 2 pm</dd>
              <dt className="font-bold">Guarantee</dt>
              <dd>Replaced or refunded within 3 days</dd>
            </dl>
          </div>
        </div>
      </Section>

      <Section className="bg-cream">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-[28px] font-bold leading-tight sm:text-[34px]">Description</h2>
            {info.blurb.map((text) => (
              <p key={text} className="mt-4 text-sm leading-[1.8] md:text-base">
                {text}
              </p>
            ))}
          </div>
          <div>
            <h2 className="font-display text-[28px] font-bold leading-tight sm:text-[34px]">Care guide</h2>
            <ol className="mt-4 grid gap-3">
              {info.care.map((text, i) => (
                <li key={text} className="flex gap-4 text-sm leading-[1.8] md:text-base">
                  <span aria-hidden="true" className="font-display text-xl font-bold leading-[1.5] text-lime">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ul className="mt-12 grid gap-6 border-t border-line pt-10 sm:grid-cols-3 sm:gap-8">
          {TRUST_POINTS.map((t) => {
            const Icon = TRUST_ICONS[t.icon];
            return (
              <li key={t.title} className="flex items-start gap-4">
                <Icon className="mt-1 size-8 shrink-0 text-lime" />
                <div>
                  <h3 className="font-display text-lg font-bold leading-tight">{t.title}</h3>
                  <p className="mt-1 text-sm leading-[1.8] md:text-base">{t.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section>
        <SectionHeading title="You May Also Like" />
        <ProductGrid products={related} trimTabletOrphans />
      </Section>
    </>
  );
}
