// Category tabs: centred on wide screens, one horizontally scrolling row on small ones (labels never wrap).
// Shared by "Our Products" and the News page. The chosen tab is scrolled into view inside the row.
export default function CategoryTabs({ tabs, value, onChange }) {
  return (
    <div
      data-scroller
      className="-mx-4 mb-8 overflow-x-auto px-4 scrollbar-hide sm:-mx-5 sm:px-5 md:-mx-6 md:mb-10 md:px-6 lg:mx-0 lg:mb-12 lg:px-0"
    >
      <ul className="mx-auto flex w-max min-w-full items-center justify-center">
        {tabs.map((tab, i) => (
          <li key={tab} className="flex shrink-0 items-center">
            {i > 0 && <span aria-hidden="true" className="h-3.5 w-px bg-line" />}
            <button
              type="button"
              aria-pressed={tab === value}
              onClick={(e) => {
                onChange(tab);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
              className={`min-h-12 whitespace-nowrap border-b-2 px-4 text-[13px] font-bold uppercase transition-colors duration-200 active:scale-95 sm:px-6 sm:text-sm lg:px-7 lg:text-base xl:px-10 ${
                tab === value ? 'border-lime text-lime' : 'border-transparent text-ink hover:text-lime'
              }`}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
