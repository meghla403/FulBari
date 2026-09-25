import { SHIPPING, SITE, findProduct } from '../data/site';

export const MAX_QTY = 99;
export const clampQty = (n) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(n)) || 1));

export const money = (n) => `${SITE.currency}${n.toFixed(2)}`;

// The cart is stored as [{ id, qty }]; prices always come from the product data, never from storage.
export const linesFrom = (cart) => cart.map(({ id, qty }) => ({ product: findProduct(id), qty })).filter((l) => l.product);

export function totals(lines) {
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= SHIPPING.freeOver ? 0 : SHIPPING.fee;
  const savings = lines.reduce((sum, l) => sum + Math.max(0, (l.product.oldPrice || l.product.price) - l.product.price) * l.qty, 0);
  return { subtotal, shipping, total: subtotal + shipping, savings, toFree: Math.max(0, SHIPPING.freeOver - subtotal) };
}

// The text the cart hands to the contact form ("Send order request").
export const formatAddress = (a) => (a ? [a.street, a.apt, a.city, a.region, a.postcode].filter(Boolean).join(', ') : '');

export function orderMessage(lines, t, address) {
  return [
    "Hello FulBari, I'd like to order:",
    ...lines.map((l) => `- ${l.qty} x ${l.product.name} (${money(l.product.price)} each)`),
    `Subtotal ${money(t.subtotal)}, delivery ${t.shipping ? money(t.shipping) : 'free'}, total ${money(t.total)}.`,
    '',
    'Delivery address and date:',
    formatAddress(address),
  ].join('\n');
}
