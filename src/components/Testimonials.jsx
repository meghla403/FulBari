import { TESTIMONIALS } from '../data/site';
import Container from './Container';
import HScroller from './HScroller';
import { ChatBubbleIcon } from './Icons';
import Section from './Section';
import SectionHeading from './SectionHeading';

// Swipe carousel: 85% cards on phones (so the next one peeks in), 45% on tablets, fixed width on desktop.
// The photo goes beside the text only when the card itself is wide enough (container query), never squeezed.
export default function Testimonials() {
  return (
    <Section id="reviews" contained={false} className="bg-cream">
      <Container>
        <SectionHeading label="// Testimonials" title="Clients Feedbacks" dot />
      </Container>
      <HScroller label="client feedback">
        {TESTIMONIALS.map((t) => (
          <li key={t.name} className="w-[85%] flex-none snap-center sm:w-[45%] lg:w-[520px] xl:w-[566px]">
            <figure className="@container relative h-full overflow-hidden bg-white p-5 shadow-[0_5px_20px_rgba(7,28,31,0.05)] sm:p-6 lg:p-8 xl:p-10">
              <div className="relative flex flex-col gap-4 @md:flex-row @md:gap-10">
                <img
                  src={t.avatar}
                  alt=""
                  width="160"
                  height="187"
                  loading="lazy"
                  decoding="async"
                  className="size-20 shrink-0 object-cover @md:h-[187px] @md:w-40"
                />
                <div className="min-w-0">
                  <blockquote className="text-sm leading-[1.8] md:text-base">{t.text}</blockquote>
                  <figcaption className="mt-3 lg:mt-4">
                    <p className="font-display text-lg font-bold lg:text-xl">{t.name}</p>
                    <p className="font-display text-sm font-bold text-lime">{t.role}</p>
                  </figcaption>
                </div>
              </div>
              <ChatBubbleIcon className="pointer-events-none absolute -bottom-2 right-2 size-24 text-[#eef2f3] @md:size-36" />
            </figure>
          </li>
        ))}
      </HScroller>
    </Section>
  );
}
