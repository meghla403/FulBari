import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { findProduct } from '../data/site';
import { clampQty } from '../lib/cart';

// Shared client state: cart (persisted), wishlist (persisted), signed-in user (persisted), quick-view product.
// Only harmless data is persisted: cart lines ({ id, qty }), wishlist product ids and the user's name/email.
// Prices are never stored - they always come from the product data. Passwords are never stored.

const CART_KEY = 'fulbari.cart';
const WISHLIST_KEY = 'fulbari.wishlist';
const USER_KEY = 'fulbari.user';

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback; // storage blocked / private mode / corrupt value: just start empty
  }
};
const save = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the app keeps working in memory */
  }
};

// A stored cart can be stale or hand-edited: keep only known products with sane quantities.
const loadCart = () => {
  const raw = load(CART_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l) => l && typeof l.id === 'string' && findProduct(l.id) && Number(l.qty) > 0)
    .map((l) => ({ id: l.id, qty: clampQty(l.qty) }));
};

const StoreContext = createContext(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [wishlist, setWishlist] = useState(() => load(WISHLIST_KEY, []));
  const [user, setUser] = useState(() => load(USER_KEY, null));
  const [quickView, setQuickView] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => save(CART_KEY, cart), [cart]);
  useEffect(() => save(WISHLIST_KEY, wishlist), [wishlist]);
  useEffect(() => save(USER_KEY, user), [user]);

  const cartCount = useMemo(() => cart.reduce((n, l) => n + l.qty, 0), [cart]);

  const addToCart = useCallback((product, qty = 1) => {
    const add = clampQty(qty);
    setCart((lines) =>
      lines.some((l) => l.id === product.id)
        ? lines.map((l) => (l.id === product.id ? { ...l, qty: clampQty(l.qty + add) } : l))
        : [...lines, { id: product.id, qty: add }],
    );
    setAnnouncement(`${add > 1 ? `${add} x ` : ''}${product.name} added to cart`);
  }, []);

  const setQty = useCallback((id, qty) => setCart((lines) => lines.map((l) => (l.id === id ? { ...l, qty: clampQty(qty) } : l))), []);

  const removeFromCart = useCallback((product) => {
    setCart((lines) => lines.filter((l) => l.id !== product.id));
    setAnnouncement(`${product.name} removed from cart`);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAnnouncement('Cart emptied');
  }, []);

  const toggleWishlist = useCallback(
    (product) => {
      const has = wishlist.includes(product.id);
      setWishlist(has ? wishlist.filter((id) => id !== product.id) : [...wishlist, product.id]);
      setAnnouncement(`${product.name} ${has ? 'removed from' : 'added to'} wishlist`);
    },
    [wishlist],
  );

  const signIn = useCallback((nextUser) => setUser(nextUser), []);
  const signOut = useCallback(() => setUser(null), []);
  const updateUser = useCallback((patch) => setUser((u) => (u ? { ...u, ...patch } : u)), []);

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      wishlist,
      toggleWishlist,
      user,
      signIn,
      signOut,
      updateUser,
      quickView,
      openQuickView: setQuickView,
      closeQuickView: () => setQuickView(null),
      announcement,
    }),
    [cart, cartCount, addToCart, setQty, removeFromCart, clearCart, wishlist, toggleWishlist, user, signIn, signOut, updateUser, quickView, announcement],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
