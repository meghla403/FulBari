import ProductCard from './ProductCard';

// The single product grid, shared by "Our Products" and "Featured Products".
// 320-374: 1 col | 375-767: 2 cols | 768-1023: 3 cols | 1024+: 4 cols
// trimTabletOrphans: at 3 columns (768-1023) drop the trailing card(s) that would sit alone on the last row.
export default function ProductGrid({ products, trimTabletOrphans = false }) {
  const keep = Math.floor(products.length / 3) * 3;
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-6 min-[375px]:grid-cols-2 md:grid-cols-3 md:gap-x-5 md:gap-y-8 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14 xl:gap-x-[30px]">
      {products.map((product, i) => (
        <li key={product.id} className={`min-w-0 ${trimTabletOrphans && keep && i >= keep ? 'md:max-lg:hidden' : ''}`}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
