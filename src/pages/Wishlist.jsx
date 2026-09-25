import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { CloseIcon, HeartIcon } from '../components/Icons';
import PageBanner from '../components/PageBanner';
import Section from '../components/Section';
import StoreFeatures from '../components/StoreFeatures';
import { findProduct } from '../data/site';
import { money } from '../lib/cart';
import useDocumentTitle from '../lib/useDocumentTitle';
import { useStore } from '../store/StoreContext';

// Wishlist rows, like the reference: remove | picture | name | price | stock | Add to Cart.
// md and up: one grid row of six columns. Phones: picture on the left, details and the two buttons stacked beside it.
export default function Wishlist() {
  useDocumentTitle('Wishlist');
  const { wishlist } = useStore();
  const products = wishlist.map(findProduct).filter(Boolean);

  return (
    <>
      <PageBanner title="Wishlist" crumbs={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />
      <Section>
        {products.length === 0 ? (
          <EmptyState
            icon={HeartIcon}
            title="Your wishlist is empty"
            text="Tap the heart on any flower or plant to save it here for later."
            actionLabel="Browse products"
            actionTo="/#shop"
          />
        ) : (
          <>
            <h2 className="sr-only">
              {products.length} saved {products.length === 1 ? 'item' : 'items'}
            </h2>
            <ul aria-label="Saved items" className="border-t border-line">
              {products.map((product) => (
                <WishlistRow key={product.id} product={product} />
              ))}
            </ul>
          </>
        )}
      </Section>
      <StoreFeatures />
    </>
  );
}

function WishlistRow({ product }) {
  const { addToCart, toggleWishlist } = useStore();
  const [added, setAdded] = useState(false);

  // "Added" flashes for a moment, then the button goes back to "Add to Cart".
  useEffect(() => {
    if (!added) return undefined;
    const id = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(id);
  }, [added]);

  const { name, price, image, srcSet, tileBg, cover, focus } = product;
  const details = `/shop/${product.id}`;

  return (
    <li className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b border-line py-5 md:grid-cols-[44px_100px_minmax(0,1fr)_120px_120px_160px] md:gap-x-6 md:py-8 lg:gap-x-10">
      <Link
        to={details}
        tabIndex={-1}
        aria-hidden="true"
        className={`row-span-3 block aspect-[100/130] overflow-hidden md:col-start-2 md:row-span-1 md:row-start-1 ${tileBg ? '' : 'bg-tile'}`}
        style={tileBg ? { backgroundColor: tileBg } : undefined}
      >
        <img
          src={image}
          srcSet={srcSet}
          sizes="100px"
          alt=""
          width="100"
          height="130"
          loading="lazy"
          decoding="async"
          style={cover && focus ? { objectPosition: focus } : undefined}
          className={`size-full ${cover ? 'object-cover' : 'object-contain'}`}
        />
      </Link>

      <h3 className="min-w-0 font-display text-lg font-bold leading-tight md:col-start-3 md:row-start-1 md:text-center">
        <Link to={details} className="inline-flex min-h-11 items-center transition-colors duration-200 hover:text-lime md:justify-center">
          {name}
        </Link>
      </h3>

      {/* phones: price and stock share a line under the name; md+: they become their own columns */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base md:contents">
        <p className="font-semibold md:col-start-4 md:row-start-1 md:text-center md:font-normal">
          <span className="sr-only">Price </span>
          {money(price)}
        </p>
        <p className="md:col-start-5 md:row-start-1 md:text-center">In Stock</p>
      </div>

      <div className="flex items-center gap-3 md:contents">
        <button
          type="button"
          onClick={() => {
            addToCart(product);
            setAdded(true);
          }}
          className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center bg-ink px-6 text-base text-white transition-all duration-200 hover:bg-lime active:scale-95 md:col-start-6 md:row-start-1 md:flex-none"
        >
          {added ? 'Added' : 'Add to Cart'}
          <span className="sr-only">: {name}</span>
        </button>
        <button
          type="button"
          aria-label={`Remove ${name} from wishlist`}
          onClick={() => toggleWishlist(product)}
          className="grid size-11 shrink-0 place-items-center border border-line text-ink transition-colors duration-200 hover:border-lime hover:bg-lime hover:text-white active:scale-95 md:col-start-1 md:row-start-1 md:border-0 md:hover:bg-transparent md:hover:text-lime"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
    </li>
  );
}
