import { useState } from 'react';
import { HERO_SLIDES } from '../data/site';
import Button from './Button';
import Container from './Container';
import { LeafIcon } from './Icons';
import WindPlant from './WindPlant';

// Mobile: content first, image second (single column). lg+: two columns.
// All slides share one grid cell, so the hero never changes height when the slide changes.
export default function Hero() {
  const [active, setActive] = useState(0);

  return (
    <section id="home" className="relative bg-blush pt-[72px] lg:pt-[98px]">
      <Container className="grid pb-14">
        {HERO_SLIDES.map((slide, i) => {
          const Heading = i === 0 ? 'h1' : 'h2';
          const isActive = i === active;
          return (
            <div
              key={slide.title}
              aria-hidden={!isActive}
              inert={!isActive}
              className={`col-start-1 row-start-1 grid items-center gap-4 transition-opacity duration-300 md:gap-6 lg:min-h-[470px] lg:grid-cols-2 lg:gap-12 ${
                isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <div className="pt-6 lg:py-10">
                <p className="flex items-center gap-2 font-display text-sm font-bold sm:text-base">
                  <LeafIcon className="size-5 text-lime sm:size-6" />
                  {slide.eyebrow}
                </p>
                <Heading className="mt-3 max-w-[8em] text-balance font-display text-[32px] font-bold leading-[1.05] min-[375px]:text-[36px] sm:text-[44px] md:text-[48px] lg:mt-4 lg:text-[50px] lg:leading-none">
                  {slide.title}
                </Heading>
                <p className="mt-5 max-w-[460px] border-l border-[#576466] pl-5 text-sm leading-[1.8] sm:pl-[30px] md:text-base lg:mt-7">
                  {slide.text}
                </p>
                <Button href={slide.href} size="lg" className="mt-6 lg:mt-9">
                  {slide.cta}
                </Button>
              </div>

              {slide.animated ? (
                <WindPlant
                  paused={!isActive}
                  potTop={slide.potTop}
                  className="mx-auto h-[300px] w-full sm:h-[360px] md:h-[450px] lg:h-[470px]"
                  imgProps={{
                    src: slide.image,
                    srcSet: slide.srcSet,
                    sizes: slide.sizes,
                    alt: slide.alt,
                    width: 600,
                    height: 548,
                    loading: i === 0 ? undefined : 'lazy',
                    fetchPriority: i === 0 ? 'high' : undefined,
                  }}
                />
              ) : (
                <img
                  src={slide.image}
                  srcSet={slide.srcSet}
                  sizes={slide.sizes}
                  alt={slide.alt}
                  width="600"
                  height="600"
                  // The first slide is the LCP image: load it eagerly and at high priority.
                  {...(i === 0 ? { fetchPriority: 'high' } : { loading: 'lazy' })}
                  className="mx-auto h-[300px] w-full object-contain sm:h-[360px] md:h-[450px] lg:h-[470px]"
                />
              )}
            </div>
          );
        })}
      </Container>

      <div role="group" aria-label="Choose slide" className="absolute inset-x-0 bottom-1 flex justify-center lg:bottom-2">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className="grid size-11 place-items-center"
          >
            <span
              className={`size-3 rounded-full transition-colors duration-200 ${i === active ? 'bg-lime' : 'bg-[#c6c6c6]'}`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
