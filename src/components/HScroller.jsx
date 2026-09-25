import { useRef } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';

// Full-bleed swipe row whose first card lines up with the page container.
// `relative` makes the row the containing block for absolutely-positioned descendants (the .sr-only text inside
// product cards): without it they escape the scroller's clipping and widen the whole page.
// Touch: native swipe + scroll-snap. Desktop: prev/next buttons (the row is also keyboard-focusable).
const gutters = 'px-4 sm:px-5 md:px-6 lg:px-8 min-[1200px]:px-[calc((100%-1200px)/2+2rem)]';

export default function HScroller({ label, children, className = '' }) {
  const ref = useRef(null);
  const step = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  return (
    <div>
      <ul
        ref={ref}
        data-scroller
        tabIndex={0}
        aria-label={label}
        className={`relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 scrollbar-hide md:gap-6 lg:gap-[30px] ${gutters} ${className}`}
      >
        {children}
      </ul>
      <div className="mt-6 hidden justify-center gap-3 lg:flex">
        <ArrowButton label={`Previous ${label}`} onClick={() => step(-1)}>
          <ArrowLeftIcon />
        </ArrowButton>
        <ArrowButton label={`Next ${label}`} onClick={() => step(1)}>
          <ArrowRightIcon />
        </ArrowButton>
      </div>
    </div>
  );
}

export function ArrowButton({ label, className = '', children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`grid size-11 place-items-center rounded-full border border-line bg-white text-ink transition-all duration-200 hover:bg-lime hover:text-white active:scale-95 lg:size-12 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
