import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Router scroll handling: /#section scrolls to that section, any other navigation starts at the top.
// A change of the query string alone (account tabs, contact topic) keeps the scroll position.
export default function ScrollManager() {
  const { pathname, search, hash, key } = useLocation();
  const previous = useRef({ pathname, search });

  useEffect(() => {
    const queryOnly = previous.current.pathname === pathname && previous.current.search !== search && !hash;
    previous.current = { pathname, search };
    if (queryOnly) return;

    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search, hash, key]);

  return null;
}
