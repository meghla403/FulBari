import Button from './Button';
import SmartLink from './SmartLink';

// Centred "nothing here yet" panel shared by the cart, wishlist and account tabs.
export default function EmptyState({ icon: Icon, title, text, actionLabel, actionTo, className = '' }) {
  return (
    <div className={`mx-auto flex max-w-md flex-col items-center py-4 text-center md:py-8 ${className}`}>
      <span className="grid size-20 place-items-center rounded-full bg-cream text-lime">
        <Icon className="size-9" />
      </span>
      <h2 className="mt-6 font-display text-[28px] font-bold leading-tight sm:text-[34px]">{title}</h2>
      <p className="mt-3 text-sm leading-[1.8] md:text-base">{text}</p>
      {actionLabel && (
        <Button as={SmartLink} to={actionTo} size="lg" className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
