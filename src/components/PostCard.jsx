import { Link } from 'react-router-dom';
import { CalendarIcon, TagIcon, UserIcon } from './Icons';

// One blog card for the home page, the News page and "more articles". The whole card is a single big tap target:
// the "Read more" link is stretched over it.
export default function PostCard({ post }) {
  return (
    <article className="group relative flex h-full flex-col bg-white shadow-[0_10px_40px_rgba(7,28,31,0.07)]">
      <div className="overflow-hidden">
        <img
          src={post.image}
          srcSet={post.srcSet}
          sizes={post.sizes}
          alt=""
          width="400"
          height="260"
          loading="lazy"
          decoding="async"
          style={post.focus ? { objectPosition: post.focus } : undefined}
          className="aspect-[37/24] w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-[30px]">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 font-display text-[13px] font-semibold sm:text-sm">
          <li className="flex items-center gap-1.5">
            <UserIcon className="size-4 text-lime" />
            by: {post.author}
          </li>
          <li className="flex items-center gap-1.5">
            <TagIcon className="size-4 text-lime" />
            {post.tag}
          </li>
        </ul>
        <h3 className="mb-5 mt-3 font-display text-xl font-bold leading-[1.25] transition-colors duration-200 group-hover:text-lime sm:text-2xl lg:mb-6 lg:text-[26px]">
          {post.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 lg:pt-4">
          <time className="flex items-center gap-2 font-display text-[13px] font-semibold sm:text-sm">
            <CalendarIcon className="size-4 text-lime" />
            {post.date}
          </time>
          <Link
            to={`/news/${post.slug}`}
            className="inline-flex min-h-11 items-center font-display text-[13px] font-bold uppercase text-lime transition-colors duration-200 after:absolute after:inset-0 hover:text-ink sm:text-sm"
          >
            Read more<span className="sr-only">: {post.title}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
