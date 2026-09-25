import { LATEST_POSTS } from '../data/site';
import Button from './Button';
import PostCard from './PostCard';
import Section from './Section';
import SectionHeading from './SectionHeading';
import SmartLink from './SmartLink';

// 1 column on phones, 2 on tablets, 3 on desktop. The 4th post only fills the 2-column tablet grid.
export default function Blog() {
  return (
    <Section id="news">
      <SectionHeading title="Latest Blog" />
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-[30px]">
        {LATEST_POSTS.map((post, i) => (
          <li key={post.slug} className={`min-w-0 ${i === 3 ? 'hidden md:block lg:hidden' : ''}`}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
      <div className="mt-10 text-center lg:mt-12">
        <Button as={SmartLink} to="/news" variant="dark" size="lg">
          View all news
        </Button>
      </div>
    </Section>
  );
}
