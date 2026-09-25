import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { POPULAR_SEARCHES } from '../data/site';
import { money } from '../lib/cart';
import { search, totalResults } from '../lib/search';
import Container from './Container';
import { ArrowRightIcon, CloseIcon, FileTextIcon, SearchIcon } from './Icons';

const LIMITS = { product: 5, post: 3, page: 3 };
const HEADINGS = { product: 'Products', post: 'News', page: 'Pages' };
const resultsLink = (q) => `/search?q=${encodeURIComponent(q)}`;

function Thumb({ item }) {
  return (
    <span
      className={`block size-12 shrink-0 overflow-hidden ${item.tileBg ? '' : 'bg-tile'}`}
      style={item.tileBg ? { backgroundColor: item.tileBg } : undefined}
    >
      <img
        src={item.image}
        srcSet={item.srcSet}
        sizes="48px"
        alt=""
        width="48"
        height="48"
        loading="lazy"
        decoding="async"
        style={item.cover && item.focus ? { objectPosition: item.focus } : undefined}
        className={`size-full ${item.cover || item.tag ? 'object-cover' : 'object-contain'}`}
      />
    </span>
  );
}

// The search bar that opens under the header: type to see matching products, news and pages, use the arrow keys and
// Enter (or tap) to open one, or press Enter on your own words for the full results page. Esc / the X / a tap outside closes it.
export default function SearchPanel({ open, onClose, returnFocusRef }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const query = q.trim();

  const results = useMemo(() => (query ? search(query) : null), [query]);
  const options = useMemo(() => {
    if (!results) return [];
    const list = [
      ...results.products.slice(0, LIMITS.product).map((item) => ({ key: `p-${item.id}`, kind: 'product', to: `/shop/${item.id}`, item })),
      ...results.posts.slice(0, LIMITS.post).map((item) => ({ key: `n-${item.slug}`, kind: 'post', to: `/news/${item.slug}`, item })),
      ...results.pages.slice(0, LIMITS.page).map((item) => ({ key: `g-${item.to}`, kind: 'page', to: item.to, item })),
    ];
    if (list.length) list.push({ key: 'all', kind: 'all', to: resultsLink(query) });
    return list;
  }, [results, query]);

  useEffect(() => {
    if (!open) return undefined;
    setQ('');
    setActive(-1);
    inputRef.current?.focus();
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      onClose();
      returnFocusRef?.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;

  const go = (to) => {
    onClose();
    navigate(to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (options.length) setActive((a) => (a + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (options.length) setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && options[active]) go(options[active].to);
      else if (query) go(resultsLink(query));
    }
  };

  const total = results ? totalResults(results) : 0;

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-20 bg-ink/40" />
      <div
        id="site-search"
        role="search"
        className="fixed inset-x-0 top-[72px] z-30 animate-[slide-fade_0.15s_ease-out] bg-white shadow-[0_20px_40px_rgba(7,28,31,0.14)] lg:top-[98px]"
      >
        <Container className="py-3 lg:py-5">
          <label htmlFor="site-search-input" className="sr-only">
            Search flowers, plants, gifts and news
          </label>
          <div className="flex items-center border border-line pl-4 focus-within:border-lime">
            <SearchIcon className="size-5 shrink-0 text-ink/60" />
            <input
              id="site-search-input"
              ref={inputRef}
              role="combobox"
              aria-expanded={Boolean(results)}
              aria-controls="search-results"
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? `search-opt-${active}` : undefined}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(-1);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search flowers, plants, gifts, news..."
              className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-ink/50 lg:h-14"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={() => {
                onClose();
                returnFocusRef?.current?.focus();
              }}
              className="grid size-11 shrink-0 place-items-center text-ink/70 transition-colors duration-200 hover:text-lime active:scale-95 lg:size-14"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>

          <div className="mt-2 max-h-[min(60dvh,520px)] overflow-y-auto">
            <p role="status" className="sr-only">
              {results ? `${total} ${total === 1 ? 'result' : 'results'} for ${query}` : ''}
            </p>

            {!results && (
              <div className="py-2">
                <p className="font-display text-sm font-bold uppercase text-lime">Popular searches</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        onClick={() => {
                          setQ(term);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex min-h-11 items-center border border-line px-4 text-sm transition-colors duration-200 hover:border-lime hover:text-lime active:scale-95 md:text-base"
                      >
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results && total === 0 && (
              <div className="py-4">
                <p className="text-base">
                  Nothing found for <strong className="break-words">&ldquo;{query}&rdquo;</strong>. Try a flower, a colour or an occasion -
                  like <em>roses</em>, <em>aloknonda</em> or <em>wedding</em>.
                </p>
              </div>
            )}

            {options.length > 0 && (
              <ul id="search-results" role="listbox" aria-label="Search results" className="py-1">
                {options.map((o, i) => (
                  <Fragment key={o.key}>
                    {o.kind !== 'all' && (i === 0 || options[i - 1].kind !== o.kind) && (
                      <li role="presentation" className="px-3 pb-1 pt-3 font-display text-sm font-bold uppercase text-lime">
                        {HEADINGS[o.kind]}
                      </li>
                    )}
                    <li
                      role="option"
                      id={`search-opt-${i}`}
                      aria-selected={i === active}
                      className={o.kind === 'all' ? 'sticky bottom-0 border-t border-line bg-white' : undefined}
                    >
                      <Link
                        to={o.to}
                        tabIndex={-1}
                        onMouseMove={() => setActive(i)}
                        className={`flex min-h-14 items-center gap-3 px-3 py-1.5 transition-colors duration-200 ${
                          i === active ? 'bg-cream text-lime' : 'hover:bg-cream'
                        }`}
                      >
                        {o.kind === 'product' && (
                          <>
                            <Thumb item={o.item} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-display text-base font-bold leading-tight text-ink">{o.item.name}</span>
                              <span className="block truncate text-sm text-ink">
                                {o.item.category} &middot; {money(o.item.price)}
                              </span>
                            </span>
                          </>
                        )}
                        {o.kind === 'post' && (
                          <>
                            <Thumb item={o.item} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-display text-base font-bold leading-tight text-ink">{o.item.title}</span>
                              <span className="block truncate text-sm text-ink">{o.item.tag}</span>
                            </span>
                          </>
                        )}
                        {o.kind === 'page' && (
                          <>
                            <span className="grid size-12 shrink-0 place-items-center bg-cream text-lime">
                              <FileTextIcon className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1 truncate font-display text-base font-bold text-ink">{o.item.label}</span>
                          </>
                        )}
                        {o.kind === 'all' && (
                          <>
                            <span className="min-w-0 flex-1 truncate font-display text-base font-bold">
                              See all {total} {total === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
                            </span>
                            <ArrowRightIcon className="size-5 shrink-0" />
                          </>
                        )}
                      </Link>
                    </li>
                  </Fragment>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </div>
    </>
  );
}
