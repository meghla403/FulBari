import { StarIcon } from './Icons';

// Full / half / empty stars, like the reference (3.5 -> three full, one half, one outline).
export default function Stars({ rating, className = 'size-3 sm:size-3.5 lg:size-4' }) {
  return (
    <span role="img" aria-label={`Rated ${rating} out of 5`} className="flex items-center gap-0.5 text-star lg:gap-1">
      {[1, 2, 3, 4, 5].map((i) =>
        rating >= i ? (
          <StarIcon key={i} className={className} />
        ) : rating >= i - 0.5 ? (
          <span key={i} className="relative inline-flex">
            <StarIcon filled={false} className={className} />
            <StarIcon className={`absolute inset-0 ${className}`} style={{ clipPath: 'inset(0 50% 0 0)' }} />
          </span>
        ) : (
          <StarIcon key={i} filled={false} className={className} />
        ),
      )}
    </span>
  );
}
