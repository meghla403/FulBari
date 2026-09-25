import { Link } from 'react-router-dom';
import Container from './Container';

// Title banner for inner pages (the header sits transparently over its top edge).
// The artwork is dark green with flowers in the top-left and bottom-right corners, so the text stays on the dark
// left side (title, then breadcrumb underneath) and never runs over the bottom-right flowers.
// crumbs: [{ label, to }, ..., { label }]  - the last one is the current page.
const SRC_SET = [1000, 1600, 2172].map((w) => `/images/page-banner-${w}.webp ${w}w`).join(', ');
// The frame is much wider than tall, so the photo is scaled to the frame's height: ~3x the banner height in css px.
const SIZES = '(min-width: 1024px) max(100vw, 1262px), (min-width: 768px) 1000px, (min-width: 640px) 910px, 790px';

// A soft dark halo keeps the text readable when a petal or leaf lands behind it (without dimming the artwork).
const HALO = '[text-shadow:0_1px_8px_rgb(5_31_26/0.9),0_0_2px_rgb(5_31_26/0.8)]';

// size 'sm' = smaller heading, for long titles (article pages).
export default function PageBanner({ label = 'Welcome to our company', title, crumbs = [], size = 'md' }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#07261f] pt-[72px] lg:pt-[98px]">
      <img
        src="/images/page-banner-1600.webp"
        srcSet={SRC_SET}
        sizes={SIZES}
        alt=""
        width="2172"
        height="724"
        fetchPriority="high"
        // Narrow screens show the left of the picture (where the text sits); from lg up nearly all of it fits.
        className="absolute inset-0 -z-10 size-full object-cover object-left lg:object-center"
      />
      {/* Small screens crop the picture so leaves/petals land behind the text: darken the bottom, where the text is. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#051f1a]/85 via-[#051f1a]/45 to-transparent lg:hidden" />
      <Container className="flex min-h-[190px] flex-col justify-end gap-1 pb-3 pt-8 sm:min-h-[230px] md:min-h-[260px] md:pb-4 lg:min-h-[320px] lg:pb-8">
        <p className={`font-display text-[10px] font-bold uppercase text-lime sm:text-xs lg:text-sm ${HALO}`}>// {label}</p>
        <h1
          className={`font-display font-bold text-white ${HALO} ${
            size === 'sm'
              ? 'max-w-3xl text-balance text-[26px] leading-[1.1] sm:text-4xl lg:text-5xl'
              : 'text-[36px] leading-none sm:text-5xl lg:text-[64px]'
          }`}
        >
          {title}
        </h1>

        <nav aria-label="Breadcrumb" className="mt-1">
          <ol className={`flex items-center font-display text-base font-bold lg:text-lg ${HALO}`}>
            {crumbs.map((crumb, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={crumb.label} className="flex items-center">
                  {i > 0 && <span aria-hidden="true" className="mx-3 h-3.5 w-px bg-white/40" />}
                  {last ? (
                    <span aria-current="page" className="text-lime">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.to}
                      className="inline-flex min-h-11 min-w-11 items-center text-white/80 transition-colors duration-200 hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </Container>
    </section>
  );
}
