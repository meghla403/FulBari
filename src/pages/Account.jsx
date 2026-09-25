import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { Field } from '../components/Field';
import { DownloadIcon, FileTextIcon, HomeIcon, LogOutIcon, PinIcon, UserIcon } from '../components/Icons';
import PageBanner from '../components/PageBanner';
import Section from '../components/Section';
import StoreFeatures from '../components/StoreFeatures';
import useDocumentTitle from '../lib/useDocumentTitle';
import { focusFirstError, isEmail } from '../lib/validate';
import { useStore } from '../store/StoreContext';

// Sidebar entries, like the reference. Remove a line to drop that tab. "Logout" is added after them.
const TABS = [
  { key: 'dashboard', label: 'Dashboard', Icon: HomeIcon },
  { key: 'orders', label: 'Orders', Icon: FileTextIcon },
  { key: 'downloads', label: 'Downloads', Icon: DownloadIcon },
  { key: 'address', label: 'Address', Icon: PinIcon },
  { key: 'details', label: 'Account Details', Icon: UserIcon },
];

const tabLink = (key) => (key === TABS[0].key ? '/account' : `/account?tab=${key}`);
const itemClass = 'flex min-h-12 w-full items-center justify-between gap-6 px-5 text-left text-base transition-colors duration-200 lg:min-h-[59px]';
const box = 'bg-cream px-5 py-3 text-base leading-[1.75] md:px-[20px]';

export default function Account() {
  useDocumentTitle('My Account');
  const { user, signOut } = useStore();
  const [params] = useSearchParams();
  // Remember whether the visitor arrived signed in: signing out *here* goes home, arriving signed out goes to sign-in.
  const hadUser = useRef(Boolean(user));
  const rowRef = useRef(null);

  const requested = params.get('tab');
  const active = TABS.some((t) => t.key === requested) ? requested : TABS[0].key;

  // On phones the tabs scroll sideways: bring the chosen one into view (e.g. when arriving on ?tab=address).
  // Done by hand, not with scrollIntoView, so it can only ever move the row itself - never the page.
  useEffect(() => {
    const row = rowRef.current;
    const tab = row?.querySelector('[aria-current="page"]');
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    const offset = tab.getBoundingClientRect().left - row.getBoundingClientRect().left;
    row.scrollLeft += offset - (row.clientWidth - tab.offsetWidth) / 2;
  }, [active]);

  // My Account needs a signed-in visitor: send everyone else to sign in, and back here afterwards.
  if (!user) {
    return hadUser.current ? <Navigate to="/" replace /> : <Navigate to="/sign-in" replace state={{ from: '/account' }} />;
  }

  return (
    <>
      <PageBanner title="My Account" crumbs={[{ label: 'Home', to: '/' }, { label: 'My Account' }]} />
      <Section>
        {/* grid-cols-1 = minmax(0, 1fr): without it the single column grows to the tab row's full width on phones. */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)] lg:gap-[60px]">
          {/* Sidebar on desktop; on smaller screens the same items become one swipeable row above the content. */}
          <nav aria-label="Account">
            <ul ref={rowRef} data-scroller className="flex overflow-x-auto border border-line scrollbar-hide lg:block lg:overflow-visible">
              {TABS.map(({ key, label, Icon }) => (
                <li key={key} className="shrink-0 border-r border-line lg:border-b lg:border-r-0">
                  <Link
                    to={tabLink(key)}
                    aria-current={key === active ? 'page' : undefined}
                    className={`${itemClass} ${key === active ? 'bg-ink text-white' : 'hover:text-lime'}`}
                  >
                    {label}
                    <Icon className="size-4 max-lg:hidden" />
                  </Link>
                </li>
              ))}
              <li className="shrink-0">
                <button type="button" onClick={signOut} className={`${itemClass} hover:text-lime`}>
                  Logout
                  <LogOutIcon className="size-4 max-lg:hidden" />
                </button>
              </li>
            </ul>
          </nav>

          <div className="min-w-0">
            {active === 'dashboard' && <Dashboard user={user} onLogout={signOut} />}
            {active === 'orders' && (
              <>
                <h2 className="sr-only">Orders</h2>
                <EmptyState
                  icon={FileTextIcon}
                  title="No orders yet"
                  text="When you place an order it will show up here."
                  actionLabel="Browse products"
                  actionTo="/#shop"
                />
              </>
            )}
            {active === 'downloads' && (
              <>
                <h2 className="sr-only">Downloads</h2>
                <EmptyState icon={DownloadIcon} title="No downloads yet" text="There is nothing to download at the moment." />
              </>
            )}
            {active === 'address' && <AddressForm />}
            {active === 'details' && <DetailsForm />}
          </div>
        </div>
      </Section>
      <StoreFeatures />
    </>
  );
}

function Dashboard({ user, onLogout }) {
  const { wishlist, cartCount } = useStore();
  const cards = [
    { label: 'Orders', value: 0, text: 'Nothing ordered yet', to: '/account?tab=orders' },
    { label: 'Wishlist', value: wishlist.length, text: wishlist.length === 1 ? 'saved item' : 'saved items', to: '/wishlist' },
    { label: 'Cart', value: cartCount, text: cartCount === 1 ? 'item in your cart' : 'items in your cart', to: '/cart' },
  ];

  return (
    <>
      <h2 className="sr-only">Dashboard</h2>
      <p className={`${box} break-words`}>
        Hello <strong>{user.name}</strong> (not <strong>{user.name}</strong>?{' '}
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex min-h-11 min-w-11 items-center text-sm underline transition-colors duration-200 hover:text-lime"
        >
          Log out
        </button>
        )
      </p>
      <p className={`${box} mt-6 py-5`}>
        From your account dashboard you can view your recent orders, manage your delivery address and edit your account details.
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <li key={c.label}>
            <Link to={c.to} className="group flex h-full flex-col border border-line p-5 transition-colors duration-200 hover:border-lime">
              <span className="font-display text-sm font-bold uppercase text-lime">{c.label}</span>
              <span className="mt-1 font-display text-[36px] font-bold leading-none">{c.value}</span>
              <span className="mt-2 text-sm md:text-base">{c.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function DetailsForm() {
  const { user, updateUser } = useStore();
  const [values, setValues] = useState({ name: user.name ?? '', email: user.email ?? '' });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setSaved(false);
  };

  const onSave = (e) => {
    e.preventDefault();
    const found = {};
    if (!values.name.trim()) found.name = 'Enter your full name.';
    if (!values.email.trim()) found.email = 'Enter your email address.';
    else if (!isEmail(values.email)) found.email = 'Enter a valid email address, like name@example.com.';
    setErrors(found);
    if (Object.keys(found).length) return focusFirstError(found, ['name', 'email']);
    updateUser({ name: values.name.trim(), email: values.email.trim() });
    setSaved(true);
  };

  return (
    <>
      <h2 className="font-display text-2xl font-bold sm:text-[28px]">Account details</h2>
      <form onSubmit={onSave} noValidate className="mt-6 grid max-w-2xl gap-5 md:grid-cols-2">
        <Field id="name" label="Full name" autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} />
        <Field
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
        />
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <Button as="button" type="submit" size="lg">
            Save changes
          </Button>
          <p role="status" className="text-sm font-semibold text-lime-dark md:text-base">
            {saved ? 'Details saved.' : ''}
          </p>
        </div>
      </form>
    </>
  );
}

const ADDRESS_FIELDS = ['street', 'city', 'postcode'];

function AddressForm() {
  const { user, updateUser } = useStore();
  const [values, setValues] = useState({ street: '', apt: '', city: '', region: '', postcode: '', phone: '', ...user.address });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setSaved(false);
  };

  const onSave = (e) => {
    e.preventDefault();
    const found = {};
    if (!values.street.trim()) found.street = 'Enter your street address.';
    if (!values.city.trim()) found.city = 'Enter your city.';
    if (!values.postcode.trim()) found.postcode = 'Enter your postcode.';
    setErrors(found);
    if (Object.keys(found).length) return focusFirstError(found, ADDRESS_FIELDS);
    updateUser({ address: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])) });
    setSaved(true);
  };

  return (
    <>
      <h2 className="font-display text-2xl font-bold sm:text-[28px]">Delivery address</h2>
      <p className="mt-2 text-sm leading-[1.8] md:text-base">We use this address when you send an order request from your cart.</p>
      <form onSubmit={onSave} noValidate className="mt-6 grid max-w-2xl gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="street" label="Street address" autoComplete="address-line1" value={values.street} onChange={set('street')} error={errors.street} />
        </div>
        <div className="sm:col-span-2">
          <Field id="apt" label="Apartment, suite, etc. (optional)" autoComplete="address-line2" value={values.apt} onChange={set('apt')} />
        </div>
        <Field id="city" label="City" autoComplete="address-level2" value={values.city} onChange={set('city')} error={errors.city} />
        <Field id="region" label="State / Region (optional)" autoComplete="address-level1" value={values.region} onChange={set('region')} />
        <Field id="postcode" label="Postcode" autoComplete="postal-code" value={values.postcode} onChange={set('postcode')} error={errors.postcode} />
        <Field id="phone" label="Phone (optional)" type="tel" autoComplete="tel" inputMode="tel" value={values.phone} onChange={set('phone')} />
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <Button as="button" type="submit" size="lg">
            Save address
          </Button>
          <p role="status" className="text-sm font-semibold text-lime-dark md:text-base">
            {saved ? 'Address saved.' : ''}
          </p>
        </div>
      </form>
    </>
  );
}
