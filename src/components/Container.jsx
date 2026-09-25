// The one reusable page container: 1200px max, centred, responsive gutters.
export const containerClass = 'mx-auto w-full max-w-[1200px] px-4 sm:px-5 md:px-6 lg:px-8';

export default function Container({ as: Tag = 'div', className = '', ...props }) {
  return <Tag className={`${containerClass} ${className}`} {...props} />;
}
