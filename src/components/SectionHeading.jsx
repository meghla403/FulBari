export default function SectionHeading({ label, title, text, dot = false, className = '' }) {
  return (
    <div className={`mb-8 text-center md:mb-10 lg:mb-12 ${className}`}>
      {label && (
        <p className="font-display text-[10px] font-bold uppercase tracking-wide text-lime sm:text-xs lg:text-sm">
          {label}
        </p>
      )}
      <h2 className="font-display text-[28px] font-bold leading-[1.1] sm:text-[34px] md:text-[40px] lg:text-[48px] xl:text-[56px]">
        {title}
        {dot && <span className="text-lime">.</span>}
      </h2>
      {text && <p className="mx-auto mt-4 max-w-xl text-sm leading-[1.8] md:text-base">{text}</p>}
    </div>
  );
}
