import { PROMO } from '../data/site';
import Button from './Button';
import Container from './Container';
import Countdown from './Countdown';

// Desktop: image left, content right. Mobile: stacked, image first, content centred.
export default function Promo() {
  return (
    <section id="deal" className="bg-cream py-12 md:py-16 lg:py-24 xl:py-[120px]">
      <Container className="grid items-center gap-8 md:gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[400px_minmax(0,1fr)] xl:gap-24">
        <div className="mx-auto grid size-[280px] place-items-center overflow-hidden rounded-full bg-blush sm:size-[340px] lg:mx-0 lg:size-[360px] xl:size-[400px]">
          <img
            src={PROMO.image}
            srcSet={PROMO.srcSet}
            sizes={PROMO.sizes}
            alt={PROMO.alt}
            width="400"
            height="400"
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </div>

        <div className="text-center lg:text-left">
          <p className="font-display text-sm font-bold text-lime">{PROMO.label}</p>
          <h2 className="mx-auto mt-2 max-w-[560px] text-balance font-display text-[28px] font-bold leading-[1.1] sm:text-[34px] md:text-[40px] lg:mx-0 lg:text-[44px] xl:text-[56px]">
            {PROMO.title}
          </h2>
          <div className="mt-8 lg:mt-12">
            <Countdown />
          </div>
          <Button href={PROMO.href} size="lg" className="mt-8 lg:mt-12">
            {PROMO.cta}
          </Button>
        </div>
      </Container>
    </section>
  );
}
