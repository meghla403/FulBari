import { FEATURED } from '../data/site';
import ProductGrid from './ProductGrid';
import Section from './Section';
import SectionHeading from './SectionHeading';

// Same ProductGrid / ProductCard as the shop - nothing separate for mobile.
export default function Featured() {
  return (
    <Section id="featured">
      <SectionHeading title="Featured Products" />
      <ProductGrid products={FEATURED} trimTabletOrphans />
    </Section>
  );
}
