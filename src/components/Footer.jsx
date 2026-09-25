import { useState } from 'react';
import { FOOTER, SITE } from '../data/site';
import Container from './Container';
import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, SendIcon, TwitterIcon, YoutubeIcon } from './Icons';
import Logo from './Logo';
import SmartLink from './SmartLink';

const CONTACT_ICONS = { pin: PinIcon, phone: PhoneIcon, mail: MailIcon };
const SOCIAL = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'Twitter', Icon: TwitterIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
];

const footerLink =
  'inline-flex min-h-11 min-w-11 items-center text-sm transition-colors duration-200 hover:text-lime active:text-lime md:text-base';
const heading = 'font-display text-xl font-bold';

// Phones: one column (brand -> links -> newsletter last). 640+: 3 columns. 1024+: 4. 1280+: 5.
export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer id="contact" className="bg-cream">
      <Container className="grid grid-cols-1 gap-x-8 gap-y-8 pb-10 pt-12 sm:grid-cols-3 md:pt-16 lg:grid-cols-4 lg:pt-20 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1.5fr] xl:gap-x-10">
        <div className="sm:col-span-3 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-[1.8] md:text-base">{FOOTER.about}</p>
          <ul className="mt-3">
            {FOOTER.contact.map(({ icon, text, href }) => {
              const Icon = CONTACT_ICONS[icon];
              return (
                <li key={text}>
                  <a
                    {...(href ? { href } : {})}
                    className="flex min-h-11 items-center gap-3 text-sm md:text-base"
                  >
                    <Icon className="size-4 shrink-0 text-lime" />
                    <span className="min-w-0">{text}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {FOOTER.columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className={heading}>{col.title}</h3>
            <ul className="mt-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <SmartLink to={link.to} className={footerLink}>
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="sm:col-span-3 lg:col-span-4 xl:col-span-1">
          <h3 className={heading}>Newsletter</h3>
          <p className="mt-3 max-w-md text-sm leading-[1.8] md:text-base">
            Subscribe to our weekly Newsletter and receive updates via email.
          </p>
          {subscribed ? (
            <p role="status" className="mt-5 font-display text-lg font-bold text-lime">
              Thanks for subscribing!
            </p>
          ) : (
            <form
              className="mt-5 flex max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email*"
                className="h-12 min-w-0 flex-1 bg-white px-4 text-base placeholder:text-ink/60 lg:h-[55px] lg:px-5"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="grid w-12 shrink-0 place-items-center bg-lime text-white transition-all duration-200 hover:bg-ink active:scale-95 lg:w-[55px]"
              >
                <SendIcon className="size-5" />
              </button>
            </form>
          )}
        </div>
      </Container>

      <Container>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-ink/10 py-4 text-center text-sm sm:flex-row sm:text-left">
        <p>
          &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
        <ul className="flex gap-2">
          {SOCIAL.map(({ label, Icon }) => (
            <li key={label}>
              <a
                href="#home"
                aria-label={label}
                className="grid size-11 place-items-center bg-white transition-all duration-200 hover:bg-lime hover:text-white active:scale-95"
              >
                <Icon className="size-[18px]" />
              </a>
            </li>
          ))}
        </ul>
        </div>
      </Container>
    </footer>
  );
}
