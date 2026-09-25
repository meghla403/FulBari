import Container from './Container';

// Responsive vertical rhythm shared by every section (not the desktop spacing on mobile).
export default function Section({ id, className = '', contained = true, children }) {
  return (
    <section id={id} className={`py-12 md:py-16 lg:py-24 xl:py-[120px] ${className}`}>
      {contained ? <Container>{children}</Container> : children}
    </section>
  );
}
