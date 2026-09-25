import { useState } from 'react';
import { CATEGORIES, PRODUCTS } from '../data/site';
import CategoryTabs from './CategoryTabs';
import { ArrowButton } from './HScroller';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';
import ProductGrid from './ProductGrid';
import Section from './Section';
import SectionHeading from './SectionHeading';

const TABS = ['All', ...CATEGORIES];
const PER_PAGE = 8;

// Pager arrows sit beside the grid only when the viewport has margin for them; otherwise they go below it.
const wide = 'min-[1340px]';

export default function Shop() {
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(0);

  const list = category === 'All' ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);
  const pages = Math.ceil(list.length / PER_PAGE);
  const visible = list.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const choose = (tab) => {
    setCategory(tab);
    setPage(0);
  };

  return (
    <Section id="shop">
      <SectionHeading title="Our Products" />

      <CategoryTabs tabs={TABS} value={category} onChange={choose} />

      <p role="status" className="sr-only">
        Showing {visible.length} of {list.length} products in {category}
      </p>

      <div className="relative">
        <ProductGrid products={visible} />

        {pages > 1 && (
          <div className={`mt-8 flex justify-center gap-3 ${wide}:mt-0 ${wide}:contents`}>
            <ArrowButton
              label="Previous products"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className={`disabled:pointer-events-none disabled:opacity-40 ${wide}:absolute ${wide}:-left-[62px] ${wide}:top-1/2 ${wide}:-translate-y-1/2`}
            >
              <ArrowLeftIcon />
            </ArrowButton>
            <ArrowButton
              label="Next products"
              disabled={page >= pages - 1}
              onClick={() => setPage(page + 1)}
              className={`disabled:pointer-events-none disabled:opacity-40 ${wide}:absolute ${wide}:-right-[62px] ${wide}:top-1/2 ${wide}:-translate-y-1/2`}
            >
              <ArrowRightIcon />
            </ArrowButton>
          </div>
        )}
      </div>
    </Section>
  );
}
