import { Link } from 'react-router-dom';
import { SITE } from '../data/site';

// light = white wordmark, for the transparent header over a dark page banner.
export default function Logo({ className = '', light = false }) {
  return (
    <Link to="/" className={`inline-flex min-h-11 items-center gap-2 ${className}`} aria-label={`${SITE.name} home`}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <path d="M14 29C6 27 2 20 4 11c8 0 13 6 10 18z" fill={light ? '#5aa363' : '#2f7a3d'} />
        <path d="M17 27C15 15 19 6 29 3c2 10-2 20-12 24z" fill="#80b500" />
      </svg>
      <span
        className={`font-display text-[26px] font-bold leading-none tracking-tight transition-colors duration-200 lg:text-[30px] ${
          light ? 'text-white' : ''
        }`}
      >
        {SITE.name}
      </span>
    </Link>
  );
}
