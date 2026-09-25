import { FEATURES } from '../data/site';
import Container from './Container';
import { GiftIcon, HandIcon, SproutIcon, TruckIcon } from './Icons';

const ICONS = { gift: GiftIcon, hand: HandIcon, sprout: SproutIcon, truck: TruckIcon };

// A white band that straddles the blog (white) and footer (cream) backgrounds.
// 1 column on phones, 2 on tablets, 4 (with dividers) on desktop.
export default function StoreFeatures() {
  return (
    <section id="about" aria-label="Why shop with us" className="relative">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/2 bg-white" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-cream" />
      <Container className="relative">
        <ul className="grid grid-cols-1 gap-6 bg-white p-6 shadow-[0_10px_50px_rgba(7,28,31,0.08)] sm:grid-cols-2 sm:gap-8 sm:p-8 lg:grid-cols-4 lg:gap-0 lg:p-0">
          {FEATURES.map((f) => {
            const Icon = ICONS[f.icon];
            return (
              <li key={f.title} className="flex items-start gap-4 lg:border-l lg:border-line lg:px-6 lg:py-10 lg:first:border-l-0 xl:px-8">
                <Icon className="mt-1 size-8 shrink-0 text-lime" />
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold leading-tight lg:text-xl">{f.title}</h3>
                  <p className="mt-2 text-sm leading-[1.8] md:text-base">{f.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
