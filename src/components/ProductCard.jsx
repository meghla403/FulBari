import { Link } from 'react-router-dom';
import { money } from '../lib/cart';
import { useStore } from '../store/StoreContext';
import { CartIcon, EyeIcon, HeartIcon } from './Icons';
import Stars from './Stars';

export { money };

function ActionButton({ label, pressed, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`grid size-11 place-items-center rounded-full bg-white shadow-[0_4px_14px_rgba(7,28,31,0.14)] transition-all duration-200 hover:bg-lime hover:text-white active:scale-95 lg:size-[50px] ${
        pressed ? 'text-lime' : 'text-ink'
      }`}
    >
      {children}
    </button>
  );
}

// One card for every breakpoint - it adapts through Tailwind classes only (no mobile-specific markup).
export default function ProductCard({ product }) {
  const { addToCart, openQuickView, wishlist, toggleWishlist } = useStore();
  const liked = wishlist.includes(product.id);
  const { name, price, oldPrice, rating, reviews, badge, image, srcSet, sizes, tileBg, cover, focus } = product;

  return (
    <article className="group flex h-full flex-col bg-white transition-shadow duration-200 focus-within:shadow-[0_15px_45px_rgba(7,28,31,0.1)] hover:shadow-[0_15px_45px_rgba(7,28,31,0.1)]">
      <div
        className={`relative h-[190px] overflow-hidden min-[375px]:h-[200px] sm:h-[230px] md:h-[250px] lg:h-[300px] xl:h-[340px] ${
          tileBg ? '' : 'bg-tile'
        }`}
        style={tileBg ? { backgroundColor: tileBg } : undefined}
      >
        {/* The title below is the keyboard/screen-reader link; this one is the big tap target on the picture. */}
        <Link to={`/shop/${product.id}`} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
          <img
            src={image}
            srcSet={srcSet}
            sizes={sizes}
            alt={name}
            width="400"
            height="400"
            loading="lazy"
            decoding="async"
            style={cover && focus ? { objectPosition: focus } : undefined}
            // Cut-outs / illustrations sit inside the tile (contain); full-frame photos fill it (cover).
            // Touch: contain keeps the product clear of the always-visible action row. Mouse: full-size image.
            className={`h-full w-full transition-transform duration-300 hoverable:group-hover:scale-105 ${
              cover ? 'object-cover' : 'object-contain p-3 pb-[60px] hoverable:p-5'
            }`}
          />
        </Link>

        {badge && (
          <span className="absolute right-3 top-3 rounded-[12px_2px_12px_2px] bg-lime px-2.5 py-1.5 text-[11px] font-bold leading-none text-white sm:text-[13px] lg:right-[18px] lg:top-[18px]">
            {badge}
          </span>
        )}

        {/* Always visible on touch devices; on mouse devices they fade in on hover / keyboard focus. */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 transition-all duration-200 hoverable:translate-y-3 hoverable:opacity-0 hoverable:group-focus-within:translate-y-0 hoverable:group-focus-within:opacity-100 hoverable:group-hover:translate-y-0 hoverable:group-hover:opacity-100">
          <ActionButton label={`Quick view ${name}`} onClick={() => openQuickView(product)}>
            <EyeIcon className="size-[18px]" />
          </ActionButton>
          <ActionButton label={`Add ${name} to cart`} onClick={() => addToCart(product)}>
            <CartIcon className="size-[18px]" />
          </ActionButton>
          <ActionButton
            label={liked ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
            pressed={liked}
            onClick={() => toggleWishlist(product)}
          >
            <HeartIcon className="size-[18px]" fill={liked ? 'currentColor' : 'none'} />
          </ActionButton>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center px-2 pb-5 pt-4 text-center lg:px-6 lg:pb-7 lg:pt-6">
        <div className="flex items-center gap-1.5">
          <Stars rating={rating} />
          {reviews && <span className="text-xs text-lime lg:text-sm">({reviews})</span>}
        </div>
        <h3 className="font-display text-[15px] font-semibold leading-tight sm:text-base">
          <Link to={`/shop/${product.id}`} className="flex min-h-11 items-center justify-center transition-colors duration-200 hover:text-lime">
            {name}
          </Link>
        </h3>
        <p className="mt-auto flex flex-wrap items-baseline justify-center gap-x-2 pt-2 font-bold text-lime">
          <span className="text-base lg:text-xl">{money(price)}</span>
          {oldPrice && (
            <s className="text-sm opacity-50 lg:text-base">
              <span className="sr-only">Was </span>
              {money(oldPrice)}
            </s>
          )}
        </p>
      </div>
    </article>
  );
}
