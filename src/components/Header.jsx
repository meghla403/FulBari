import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NAV, QUOTE_LINK } from '../data/site';
import { useStore } from '../store/StoreContext';
import AccountMenu from './AccountMenu';
import Button from './Button';
import Container from './Container';
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from './Icons';
import Logo from './Logo';
import SearchPanel from './SearchPanel';
import SmartLink from './SmartLink';

const iconBtn =
  'grid size-11 shrink-0 place-items-center bg-white text-ink shadow-[0_4px_20px_rgba(7,28,31,0.08)] transition-all duration-200 hover:bg-lime hover:text-white active:scale-95 lg:size-[50px]';

export default function Header() {
  const { cartCount } = useStore();
  const { pathname, key } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBtnRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const menuBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const close = () => setMenuOpen(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  // Inner pages start with a dark banner behind the header: light text until the page is scrolled.
  const onDark = pathname !== '/' && !scrolled && !searchOpen;

  // Going to another page (or the same one again) closes the search bar.
  useEffect(() => setSearchOpen(false), [pathname, key]);

  // Solid background once the page has scrolled (transparent over the hero at the top).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Drawer behaviour: lock body scroll, close on Esc, move focus in and back out.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    const menuBtn = menuBtnRef.current;
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      menuBtn?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  // If the viewport grows to desktop while the drawer is open, drop it.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => e.matches && setMenuOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-30 transition-all duration-200 ${
          scrolled || searchOpen
            ? 'bg-white shadow-[0_2px_20px_rgba(7,28,31,0.08)]'
            : pathname === '/'
              ? 'bg-gradient-to-b from-white/60 to-transparent'
              : 'bg-gradient-to-b from-ink/70 to-transparent'
        }`}
      >
        <Container className="flex h-[72px] items-center justify-between gap-3 lg:h-[98px]">
          <Logo light={onDark} />

          {/* Desktop navigation */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-3 xl:gap-8">
              {NAV.map((item) => (
                <li key={item.label}>
                  <SmartLink
                    to={item.to}
                    className={`inline-flex min-h-11 min-w-11 items-center justify-center font-display text-base font-semibold transition-colors duration-200 hover:text-lime ${
                      onDark ? 'text-white' : ''
                    }`}
                  >
                    {item.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 lg:gap-2.5">
            <Button as={SmartLink} to={QUOTE_LINK} size="lg" className="max-lg:hidden lg:min-h-[53px] lg:px-6 xl:mr-3">
              Get a Quote
            </Button>
            <button
              ref={searchBtnRef}
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              aria-controls="site-search"
              onClick={() => setSearchOpen((v) => !v)}
              className={`${iconBtn} max-lg:hidden ${searchOpen ? 'bg-lime! text-white!' : ''}`}
            >
              <SearchIcon />
            </button>
            <AccountMenu buttonClassName={iconBtn} />
            <SmartLink to="/cart" aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`} className={`${iconBtn} relative`}>
              <CartIcon />
              <span className="absolute right-1 top-1 text-[11px] font-semibold leading-none lg:right-1.5 lg:top-1.5">
                {cartCount}
              </span>
            </SmartLink>
            <button
              ref={menuBtnRef}
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
              className={`${iconBtn} lg:hidden`}
            >
              <MenuIcon />
            </button>
          </div>
        </Container>
      </header>

      <SearchPanel open={searchOpen} onClose={closeSearch} returnFocusRef={searchBtnRef} />

      {/* Mobile drawer - rendered outside <header> so its fixed positioning is never affected by it. */}
      <div className="lg:hidden">
        <div
          aria-hidden="true"
          onClick={close}
          className={`fixed inset-0 z-40 bg-ink/50 transition-opacity duration-200 ${
            menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        <aside
          id="mobile-menu"
          aria-label="Mobile menu"
          inert={!menuOpen}
          className={`fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl transition-[transform,visibility] duration-300 ${
            menuOpen ? 'translate-x-0' : 'invisible translate-x-full'
          }`}
        >
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-line px-4 sm:px-5">
            <Logo />
            <button
              ref={closeBtnRef}
              type="button"
              aria-label="Close menu"
              onClick={close}
              className={iconBtn}
            >
              <CloseIcon />
            </button>
          </div>
          {/* Phones have no room for a search icon in the header, so search lives here and opens the same bar. */}
          <div className="shrink-0 px-4 pt-4 sm:px-5">
            <button
              type="button"
              onClick={() => {
                close();
                setSearchOpen(true);
              }}
              className="flex min-h-12 w-full items-center gap-3 border border-line px-4 text-left text-base text-ink/70 transition-colors duration-200 hover:border-lime active:scale-[0.99]"
            >
              <SearchIcon className="size-5 shrink-0" />
              Search...
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 px-4 py-2 sm:px-5">
            <ul>
              {NAV.map((item) => (
                <li key={item.label} className="border-b border-line">
                  <SmartLink
                    to={item.to}
                    onClick={close}
                    className="flex min-h-12 items-center font-display text-lg font-semibold transition-colors duration-200 hover:text-lime active:text-lime"
                  >
                    {item.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="shrink-0 px-4 pb-6 pt-2 sm:px-5">
            <Button as={SmartLink} to={QUOTE_LINK} onClick={close} size="lg" className="w-full">
              Get a Quote
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
