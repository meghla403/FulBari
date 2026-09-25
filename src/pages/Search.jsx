import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { FileTextIcon, SearchIcon } from '../components/Icons';
import PageBanner from '../components/PageBanner';
import PostCard from '../components/PostCard';
import ProductGrid from '../components/ProductGrid';
import Section from '../components/Section';
import { POPULAR_SEARCHES } from '../data/site';
import { search, totalResults } from '../lib/search';
import useDocumentTitle from '../lib/useDocumentTitle';

// Full results for /search?q=... : products, then news, then pages.
export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  useDocumentTitle(q ? `Search: ${q}` : 'Search');

  const results = useMemo(() => (q ? search(q) : null), [q]);
  const total = results ? totalResults(results) : 0;

  const onSubmit = (e) => {
    e.preventDefault();
    setParams(draft.trim() ? { q: draft.trim() } : {});
  };

  return (
    <>
      <PageBanner title="Search" crumbs={[{ label: 'Home', to: '/' }, { label: 'Search' }]} />
      <Section>
        <form role="search" onSubmit={onSubmit} className="mx-auto flex max-w-2xl">
          <label htmlFor="search-page-input" className="sr-only">
            Search flowers, plants, gifts and news
          </label>
          <input
            id="search-page-input"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search flowers, plants, gifts, news..."
            className="h-12 min-w-0 flex-1 border border-r-0 border-line bg-white px-4 text-base outline-none transition-colors duration-200 placeholder:text-ink/50 focus:border-lime lg:h-14"
          />
          <button
            type="submit"
            aria-label="Search"
            className="grid w-12 shrink-0 place-items-center bg-lime text-white transition-all duration-200 hover:bg-ink active:scale-95 lg:w-14"
          >
            <SearchIcon className="size-5" />
          </button>
        </form>

        <p role="status" className="mt-6 text-center text-sm md:text-base">
          {results ? (
            total ? (
              <>
                {total} {total === 1 ? 'result' : 'results'} for <strong className="break-words">&ldquo;{q}&rdquo;</strong>
              </>
            ) : (
              ''
            )
          ) : (
            'Type what you are looking for - a flower, a colour, an occasion.'
          )}
        </p>

        {(!results || total === 0) && (
          <div className="mt-6">
            {results && (
              <EmptyState
                icon={SearchIcon}
                title="No results"
                text={`We could not find anything for "${q}". Check the spelling or try one of these.`}
                className="py-0 md:py-0"
              />
            )}
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <li key={term}>
                  <Link
                    to={`/search?q=${encodeURIComponent(term)}`}
                    className="inline-flex min-h-11 items-center border border-line px-4 text-sm transition-colors duration-200 hover:border-lime hover:text-lime md:text-base"
                  >
                    {term}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {results && total > 0 && (
          <div className="mt-10 grid gap-14 lg:mt-14 lg:gap-20">
            {results.products.length > 0 && (
              <section aria-labelledby="search-products">
                <h2 id="search-products" className="mb-6 font-display text-[28px] font-bold leading-tight sm:text-[34px]">
                  Products <span className="text-lime">({results.products.length})</span>
                </h2>
                <ProductGrid products={results.products} />
              </section>
            )}

            {results.posts.length > 0 && (
              <section aria-labelledby="search-news">
                <h2 id="search-news" className="mb-6 font-display text-[28px] font-bold leading-tight sm:text-[34px]">
                  News <span className="text-lime">({results.posts.length})</span>
                </h2>
                <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-[30px]">
                  {results.posts.map((post) => (
                    <li key={post.slug} className="min-w-0">
                      <PostCard post={post} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {results.pages.length > 0 && (
              <section aria-labelledby="search-pages">
                <h2 id="search-pages" className="mb-6 font-display text-[28px] font-bold leading-tight sm:text-[34px]">
                  Pages <span className="text-lime">({results.pages.length})</span>
                </h2>
                <ul className="mx-auto max-w-2xl divide-y divide-line border-y border-line">
                  {results.pages.map((page) => (
                    <li key={page.to}>
                      <Link
                        to={page.to}
                        className="flex min-h-14 items-center gap-4 py-2 font-display text-lg font-bold transition-colors duration-200 hover:text-lime"
                      >
                        <FileTextIcon className="size-5 shrink-0 text-lime" />
                        {page.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="text-center">
              <Button as={Link} to="/#shop" variant="dark" size="lg">
                Browse all products
              </Button>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
