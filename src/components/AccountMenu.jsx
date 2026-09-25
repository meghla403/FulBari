import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ACCOUNT_LINKS } from '../data/site';
import { useStore } from '../store/StoreContext';
import { UserIcon } from './Icons';

const itemClass =
  'flex min-h-11 w-full items-center px-4 text-left text-base transition-colors duration-200 hover:text-lime active:text-lime';

// Profile icon + dropdown, like the reference. Signed out: Sign in / Register / My Account / Wishlist.
// Signed in: My Account / Wishlist / Sign out.
// Disclosure pattern: closes on outside click/tap, Esc, focus leaving, or choosing an item.
export default function AccountMenu({ buttonClassName = '' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const { user, signOut } = useStore();
  const { pathname } = useLocation();

  const links = ACCOUNT_LINKS.filter((link) => !(user && link.guestOnly));

  // Any navigation closes the menu.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        // Keyboard users tabbing out of the menu close it.
        if (open && !wrapRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label="My account"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((v) => !v)}
        className={`${buttonClassName} ${open ? 'bg-lime! text-white!' : ''}`}
      >
        <UserIcon />
      </button>

      {open && (
        <ul
          id="account-menu"
          className="absolute right-0 top-full z-10 w-max min-w-[150px] animate-[slide-fade_0.15s_ease-out] bg-white py-1.5 shadow-[0_10px_30px_rgba(7,28,31,0.14)]"
        >
          {links.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                aria-current={pathname === link.to ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`${itemClass} ${pathname === link.to ? 'text-lime' : ''}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {user && (
            <li>
              <button
                type="button"
                onClick={() => {
                  // Stays on the current page; the Account page sends a signed-out visitor home by itself.
                  signOut();
                  setOpen(false);
                }}
                className={itemClass}
              >
                Sign out
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
