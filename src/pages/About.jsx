import Button from '../components/Button';
import Container from '../components/Container';
import PageBanner from '../components/PageBanner';
import Section from '../components/Section';
import SectionHeading from '../components/SectionHeading';
import SmartLink from '../components/SmartLink';
import Testimonials from '../components/Testimonials';
import { ABOUT, QUOTE_LINK } from '../data/site';
import useDocumentTitle from '../lib/useDocumentTitle';

export default function About() {
  useDocumentTitle('About');
  const { story, stats, steps, cta } = ABOUT;

  return (
    <>
      <PageBanner title="About" crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]} />

      {/* Story: picture + text (stacked on phones, side by side from lg) */}
      <Section>
        <div className="grid items-center gap-8 md:gap-10 lg:grid-cols-2 lg:gap-16">
          <img
            src={story.image}
            srcSet={story.srcSet}
            sizes={story.sizes}
            alt={story.alt}
            width="800"
            height="800"
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover sm:aspect-[3/2] lg:aspect-[4/5]"
          />
          <div>
            <p className="font-display text-[10px] font-bold uppercase text-lime sm:text-xs lg:text-sm">{story.label}</p>
            <h2 className="mt-1 text-balance font-display text-[28px] font-bold leading-[1.1] sm:text-[34px] lg:text-[44px] xl:text-[48px]">
              {story.title}
            </h2>
            {story.paragraphs.map((text) => (
              <p key={text} className="mt-4 text-sm leading-[1.8] md:text-base">
                {text}
              </p>
            ))}
            <Button as={SmartLink} to="/#shop" size="lg" className="mt-6 lg:mt-8">
              Shop now
            </Button>
          </div>
        </div>
      </Section>

      {/* Numbers */}
      <section aria-label="FulBari in numbers" className="bg-cream py-10 md:py-14">
        <Container>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-[30px] font-bold leading-none text-lime sm:text-[40px] lg:text-5xl">{s.value}</dd>
                <dd className="mt-2 text-sm md:text-base" aria-hidden="true">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* How we work */}
      <Section>
        <SectionHeading label="// How we work" title="From stem to doorstep" />
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-[30px]">
          {steps.map((step, i) => (
            <li key={step.title} className="border border-line p-6 lg:p-8">
              <span aria-hidden="true" className="font-display text-[44px] font-bold leading-none text-lime/60">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-display text-xl font-bold lg:text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-[1.8] md:text-base">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Testimonials />

      {/* Call to action */}
      <section className="bg-ink py-12 text-center text-white md:py-16 lg:py-20">
        <Container>
          <h2 className="mx-auto max-w-2xl text-balance font-display text-[28px] font-bold leading-[1.1] sm:text-[34px] lg:text-[44px]">
            {cta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-[1.8] text-white/80 md:text-base">{cta.text}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button as={SmartLink} to="/#shop" size="lg">
              Shop now
            </Button>
            <Button as={SmartLink} to={QUOTE_LINK} variant="light" size="lg">
              Get a quote
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
