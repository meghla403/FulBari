const sizes = {
  md: 'min-h-11 px-5 py-3 sm:px-6',
  lg: 'min-h-11 px-6 py-3 sm:min-h-[56px] sm:px-8',
};
const variants = {
  primary: 'bg-lime text-white hover:bg-ink',
  dark: 'bg-ink text-white hover:bg-lime',
  light: 'bg-white text-ink hover:bg-lime hover:text-white',
};

export default function Button({ as: Tag = 'a', variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 text-center font-display text-[13px] font-bold uppercase leading-none tracking-wide transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-60 sm:text-sm ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
