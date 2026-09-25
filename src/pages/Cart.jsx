import { Link } from 'react-router-dom';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { CartIcon, TrashIcon } from '../components/Icons';
import PageBanner from '../components/PageBanner';
import QuantityStepper from '../components/QuantityStepper';
import Section from '../components/Section';
import SmartLink from '../components/SmartLink';
import { SHIPPING } from '../data/site';
import { linesFrom, money, orderMessage, totals } from '../lib/cart';
import useDocumentTitle from '../lib/useDocumentTitle';
import { useStore } from '../store/StoreContext';

// Product | price | quantity | total | remove  (md and up). On phones each line becomes a compact card.
const COLUMNS = 'md:grid-cols-[80px_minmax(0,1fr)_80px_140px_90px_44px] md:gap-x-4';

export default function Cart() {
  useDocumentTitle('Cart');
  const { cart, setQty, removeFromCart, clearCart, user } = useStore();
  const lines = linesFrom(cart);
  const t = totals(lines);

  return (
    <>
      <PageBanner title="Cart" crumbs={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
      <Section>
        {lines.length === 0 ? (
          <EmptyState
            icon={CartIcon}
            title="Your cart is empty"
            text="Add a bouquet, plant or gift and it will wait for you here."
            actionLabel="Browse products"
            actionTo="/#shop"
          />
        ) : (
          // The summary sits beside the lines only from xl up: any narrower and the line table cannot fit its columns.
          <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div>
              <h2 className="sr-only">Items in your cart</h2>
              <div aria-hidden="true" className={`hidden border-b border-ink pb-3 font-display text-sm font-bold uppercase md:grid ${COLUMNS}`}>
                <span className="col-span-2">Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
                <span />
              </div>

              <ul>
                {lines.map(({ product, qty }) => (
                  <li
                    key={product.id}
                    className={`grid grid-cols-[80px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-line py-5 ${COLUMNS}`}
                  >
                    <Link
                      to={`/shop/${product.id}`}
                      tabIndex={-1}
                      aria-hidden="true"
                      className={`row-span-2 block aspect-square overflow-hidden md:row-span-1 ${product.tileBg ? '' : 'bg-tile'}`}
                      style={product.tileBg ? { backgroundColor: product.tileBg } : undefined}
                    >
                      <img
                        src={product.image}
                        srcSet={product.srcSet}
                        sizes="80px"
                        alt=""
                        width="96"
                        height="96"
                        loading="lazy"
                        decoding="async"
                        className={`size-full ${product.cover ? 'object-cover' : 'object-contain'}`}
                      />
                    </Link>

                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-bold leading-tight">
                        <Link to={`/shop/${product.id}`} className="inline-flex min-h-11 items-center transition-colors duration-200 hover:text-lime">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="text-sm">{product.category}</p>
                      <p className="mt-1 text-sm font-bold text-lime md:hidden">{money(product.price)} each</p>
                    </div>

                    <p className="hidden font-bold text-lime md:block">{money(product.price)}</p>

                    {/* phones: one row under the name; md+: these three become their own columns */}
                    <div className="col-start-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 md:contents">
                      <QuantityStepper value={qty} onChange={(n) => setQty(product.id, n)} label={product.name} />
                      <p className="font-display text-lg font-bold md:text-xl">
                        <span className="sr-only">Line total </span>
                        {money(product.price * qty)}
                      </p>
                      <button
                        type="button"
                        aria-label={`Remove ${product.name} from cart`}
                        onClick={() => removeFromCart(product)}
                        className="grid size-11 place-items-center text-ink/70 transition-colors duration-200 hover:text-red-700 active:scale-95"
                      >
                        <TrashIcon className="size-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <Link to="/#shop" className="inline-flex min-h-11 items-center font-display font-bold uppercase underline transition-colors duration-200 hover:text-lime">
                  Continue shopping
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex min-h-11 items-center font-display font-bold uppercase text-ink/70 transition-colors duration-200 hover:text-red-700"
                >
                  Clear cart
                </button>
              </div>
            </div>

            <aside aria-label="Order summary" className="h-fit bg-cream p-6 md:ml-auto md:w-full md:max-w-[420px] lg:p-8 xl:sticky xl:top-28 xl:ml-0 xl:max-w-none">
              <h2 className="font-display text-[26px] font-bold leading-tight">Order summary</h2>

              <dl className="mt-5 grid gap-3 text-base">
                <div className="flex justify-between gap-4">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold">{money(t.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Delivery</dt>
                  <dd className="font-semibold">{t.shipping ? money(t.shipping) : 'Free'}</dd>
                </div>
                {t.savings > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt>You save</dt>
                    <dd className="font-semibold text-lime">{money(t.savings)}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-4 border-t border-ink/15 pt-4">
                  <dt className="font-display text-xl font-bold">Total</dt>
                  <dd className="font-display text-2xl font-bold text-lime">{money(t.total)}</dd>
                </div>
              </dl>

              <div className="mt-5">
                <p className="text-sm">
                  {t.toFree > 0 ? (
                    <>
                      Add <strong>{money(t.toFree)}</strong> more for free delivery.
                    </>
                  ) : (
                    <strong>You have free delivery.</strong>
                  )}
                </p>
                <div aria-hidden="true" className="mt-2 h-1.5 bg-white">
                  <div className="h-full bg-lime transition-all duration-300" style={{ width: `${Math.min(100, (t.subtotal / SHIPPING.freeOver) * 100)}%` }} />
                </div>
              </div>

              <Button
                as={SmartLink}
                to="/contact?topic=delivery"
                state={{ message: orderMessage(lines, t, user?.address) }}
                size="lg"
                className="mt-6 w-full"
              >
                Send order request
              </Button>
              <p className="mt-3 text-sm leading-[1.7]">We will confirm your order, delivery time and payment with you.</p>
            </aside>
          </div>
        )}
      </Section>
    </>
  );
}
