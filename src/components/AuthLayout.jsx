import Container from './Container';
import PageBanner from './PageBanner';

// Shared shell for Sign in / Register: dark banner + a centred white form card on cream.
export default function AuthLayout({ title, heading, intro, footer, children }) {
  return (
    <>
      <PageBanner title={title} crumbs={[{ label: 'Home', to: '/' }, { label: title }]} />
      <section className="bg-cream py-12 md:py-16 lg:py-24">
        <Container>
          <div className="mx-auto w-full max-w-[560px] bg-white p-6 shadow-[0_10px_50px_rgba(7,28,31,0.08)] sm:p-10">
            <h2 className="font-display text-[28px] font-bold leading-tight sm:text-[34px]">{heading}</h2>
            {intro && <p className="mt-2 text-sm leading-[1.8] md:text-base">{intro}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && (
            <p className="mx-auto mt-4 flex max-w-[560px] flex-wrap items-center justify-center gap-x-2 text-center text-sm md:text-base">
              {footer}
            </p>
          )}
        </Container>
      </section>
    </>
  );
}
