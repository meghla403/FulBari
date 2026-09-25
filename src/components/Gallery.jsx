import { GALLERY } from '../data/site';
import Container from './Container';
import HScroller from './HScroller';
import Section from './Section';
import SectionHeading from './SectionHeading';

// "We Have Done": a snap-scrolling row on every screen size (like the reference carousel).
export default function Gallery() {
  return (
    <Section id="gallery" contained={false} className="bg-cream">
      <Container>
        <SectionHeading label="// Portfolio" title="We Have Done" dot />
      </Container>
      <HScroller label="recent work">
        {GALLERY.map((item) => (
          <li key={item.image} className="w-[240px] flex-none snap-center sm:w-[300px] lg:w-[367px]">
            <img
              src={item.image}
              srcSet={item.srcSet}
              sizes={item.sizes}
              alt={item.alt}
              width="400"
              height="267"
              loading="lazy"
              decoding="async"
              style={item.focus ? { objectPosition: item.focus } : undefined}
              className="aspect-[3/2] w-full object-cover"
            />
          </li>
        ))}
      </HScroller>
    </Section>
  );
}
