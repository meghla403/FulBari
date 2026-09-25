import { useParams } from 'react-router-dom';
import Button from '../components/Button';
import { CalendarIcon, TagIcon, UserIcon } from '../components/Icons';
import PageBanner from '../components/PageBanner';
import PostCard from '../components/PostCard';
import Section from '../components/Section';
import SectionHeading from '../components/SectionHeading';
import SmartLink from '../components/SmartLink';
import { POSTS } from '../data/site';
import useDocumentTitle from '../lib/useDocumentTitle';
import NotFound from './NotFound';

// One article. Unknown slugs get the normal 404 page.
export default function Article() {
  const { slug } = useParams();
  const post = POSTS.find((p) => p.slug === slug);
  return post ? <ArticleView post={post} /> : <NotFound />;
}

function ArticleView({ post }) {
  useDocumentTitle(post.title);
  const more = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <PageBanner
        size="sm"
        label={post.tag}
        title={post.title}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'News', to: '/news' }, { label: 'Article' }]}
      />

      <Section>
        <article className="mx-auto max-w-[800px]">
          <img
            src={post.image}
            srcSet={post.srcSet}
            sizes="(min-width: 840px) 800px, 92vw"
            alt=""
            width="800"
            height="600"
            fetchPriority="high"
            style={post.focus ? { objectPosition: post.focus } : undefined}
            className="aspect-square w-full object-cover sm:aspect-[4/3]"
          />

          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-display text-sm font-semibold">
            <li className="flex items-center gap-1.5">
              <UserIcon className="size-4 text-lime" />
              by: {post.author}
            </li>
            <li className="flex items-center gap-1.5">
              <TagIcon className="size-4 text-lime" />
              {post.tag}
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarIcon className="size-4 text-lime" />
              <time>{post.date}</time>
            </li>
          </ul>

          <p className="mt-6 text-lg font-semibold leading-[1.7] md:text-xl">{post.excerpt}</p>

          {post.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="mt-8 font-display text-2xl font-bold leading-tight sm:text-[28px]">{section.heading}</h2>
              {section.paragraphs.map((text) => (
                <p key={text} className="mt-3 text-base leading-[1.9]">
                  {text}
                </p>
              ))}
            </div>
          ))}

          <div className="mt-10 flex flex-wrap gap-3">
            <Button as={SmartLink} to="/news" variant="dark" size="lg">
              Back to all news
            </Button>
            <Button as={SmartLink} to="/#shop" size="lg">
              Shop flowers
            </Button>
          </div>
        </article>
      </Section>

      <Section className="bg-cream">
        <SectionHeading title="More Articles" />
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-[30px]">
          {more.map((p, i) => (
            // 3 across on desktop, 2 on tablets (the 3rd would be an orphan there), 1 on phones
            <li key={p.slug} className={`min-w-0 ${i === 2 ? 'md:max-lg:hidden' : ''}`}>
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
