import { Link } from 'react-router-dom';
import Button from './Button';
import Modal from './Modal';
import { money } from './ProductCard';
import Stars from './Stars';
import { useStore } from '../store/StoreContext';

export default function QuickView() {
  const { quickView: product, closeQuickView: onClose, addToCart: onAdd } = useStore();
  return (
    <Modal open={Boolean(product)} onClose={onClose} label="Quick view" className="w-[min(92vw,760px)] bg-white">
      {product && (
        <div className="grid sm:grid-cols-2">
          <div className={product.tileBg ? '' : 'bg-tile'} style={product.tileBg ? { backgroundColor: product.tileBg } : undefined}>
            <img
              src={product.image}
              alt={product.name}
              width="400"
              height="400"
              style={product.cover && product.focus ? { objectPosition: product.focus } : undefined}
              className={`h-[240px] w-full sm:h-full sm:min-h-[340px] ${product.cover ? 'object-cover' : 'object-contain p-6'}`}
            />
          </div>
          <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
            <p className="font-display text-sm font-bold uppercase text-lime">{product.category}</p>
            <h3 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h3>
            <Stars rating={product.rating} className="size-4" />
            <p className="flex items-baseline gap-2 font-bold text-lime">
              <span className="text-xl">{money(product.price)}</span>
              {product.oldPrice && <s className="text-base opacity-50">{money(product.oldPrice)}</s>}
            </p>
            <p className="text-sm leading-[1.8] md:text-base">
              Fresh, hand-tied and delivered with care. Free delivery on orders over $100.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button
                as="button"
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => {
                  onAdd(product);
                  onClose();
                }}
              >
                Add to cart
              </Button>
              <Button as={Link} to={`/shop/${product.id}`} onClick={onClose} variant="dark" size="lg" className="w-full sm:w-auto">
                View details
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
