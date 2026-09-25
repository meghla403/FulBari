import { useState } from 'react';
import CategoryTabs from '../components/CategoryTabs';
import PageBanner from '../components/PageBanner';
import PostCard from '../components/PostCard';
import Section from '../components/Section';
import { POSTS } from '../data/site';
import useDocumentTitle from '../lib/useDocumentTitle';

const TABS = ['All', ...new Set(POSTS.map((p) => p.tag))];

// All articles, newest first, filterable by topic. 1 column on phones, 2 on tablets, 3 on desktop.
export default function News() {
  useDocumentTitle('News');
  const [tag, setTag] = useState('All');
  const list = tag === 'All' ? POSTS : POSTS.filter((p) => p.tag === tag);

  return (
    <>
      <PageBanner title="News" crumbs={[{ label: 'Home', to: '/' }, { label: 'News' }]} />
      <Section>
        <CategoryTabs tabs={TABS} value={tag} onChange={setTag} />

        <p role="status" className="sr-only">
          Showing {list.length} of {POSTS.length} articles{tag === 'All' ? '' : ` in ${tag}`}
        </p>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-[30px]">
          {list.map((post) => (
            <li key={post.slug} className="min-w-0">
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
