import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import { Field, SelectField, TextareaField } from '../components/Field';
import { ChevronDownIcon, ClockIcon, MailIcon, PhoneIcon, PinIcon } from '../components/Icons';
import PageBanner from '../components/PageBanner';
import Section from '../components/Section';
import SectionHeading from '../components/SectionHeading';
import { CONTACT, CONTACT_TOPICS, FAQ } from '../data/site';
import { sendContactRequest } from '../lib/contact';
import useDocumentTitle from '../lib/useDocumentTitle';
import { focusFirstError, isEmail } from '../lib/validate';

const FIELDS = ['name', 'email', 'message'];

const validate = ({ name, email, message }) => {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter your name.';
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!isEmail(email)) errors.email = 'Enter a valid email address, like name@example.com.';
  if (!message.trim()) errors.message = 'Tell us how we can help.';
  return errors;
};

function InfoRow({ icon: Icon, label, children }) {
  return (
    <li className="flex items-start gap-4">
      <span className="grid size-12 shrink-0 place-items-center bg-white text-lime shadow-[0_5px_20px_rgba(7,28,31,0.06)]">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold uppercase text-lime">{label}</p>
        <div className="mt-0.5 text-base">{children}</div>
      </div>
    </li>
  );
}

export default function Contact() {
  useDocumentTitle('Contact');
  const [params] = useSearchParams();
  const wanted = params.get('topic');
  const location = useLocation();
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    // "Get a Quote" links here with ?topic=quote
    topic: CONTACT_TOPICS.some((t) => t.value === wanted) ? wanted : 'general',
    // The cart's "Send order request" hands its order summary over here.
    message: typeof location.state?.message === 'string' ? location.state.message : '',
  });
  useEffect(() => {
    if (CONTACT_TOPICS.some((t) => t.value === wanted)) setValues((v) => ({ ...v, topic: wanted }));
  }, [wanted]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return focusFirstError(found, FIELDS);

    setPending(true);
    try {
      await sendContactRequest(values);
      setSentTo(values.name.trim());
    } catch (err) {
      setFormError(err.message || 'We could not send your message. Please try again or call us.');
    } finally {
      setPending(false);
    }
  };

  const reset = () => {
    setSentTo('');
    setValues((v) => ({ ...v, name: '', email: '', phone: '', message: '' }));
  };

  return (
    <>
      <PageBanner title="Contact" crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} />

      <Section className="bg-cream">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <p className="font-display text-[10px] font-bold uppercase text-lime sm:text-xs lg:text-sm">// Get in touch</p>
            <h2 className="mt-1 text-balance font-display text-[28px] font-bold leading-[1.1] sm:text-[34px] lg:text-[44px]">
              We would love to hear from you
            </h2>
            <p className="mt-4 text-sm leading-[1.8] md:text-base">
              Questions about an order, flowers for an event, or a custom arrangement? Send us a message and we usually reply the
              same day.
            </p>

            <ul className="mt-8 grid gap-6">
              <InfoRow icon={PinIcon} label="Visit us">
                <span className="flex min-h-11 items-center">{CONTACT.address}</span>
              </InfoRow>
              <InfoRow icon={PhoneIcon} label="Call us">
                <a href={CONTACT.phoneHref} className="inline-flex min-h-11 items-center transition-colors duration-200 hover:text-lime">
                  {CONTACT.phone}
                </a>
              </InfoRow>
              <InfoRow icon={MailIcon} label="Email us">
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="inline-flex min-h-11 items-center break-all transition-colors duration-200 hover:text-lime"
                >
                  {CONTACT.email}
                </a>
              </InfoRow>
              <InfoRow icon={ClockIcon} label="Opening hours">
                <ul>
                  {CONTACT.hours.map(([days, time]) => (
                    <li key={days} className="flex flex-wrap justify-between gap-x-6">
                      <span>{days}</span>
                      <span className="font-semibold">{time}</span>
                    </li>
                  ))}
                </ul>
              </InfoRow>
            </ul>
          </div>

          <div className="bg-white p-6 shadow-[0_10px_50px_rgba(7,28,31,0.08)] sm:p-10">
            {sentTo ? (
              <div role="status" className="py-6 text-center">
                <h3 className="font-display text-[28px] font-bold leading-tight sm:text-[34px]">Thank you, {sentTo}!</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-[1.8] md:text-base">
                  We have your message and will get back to you shortly.
                </p>
                <Button as="button" type="button" size="lg" className="mt-6" onClick={reset}>
                  Send another message
                </Button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-[26px] font-bold leading-tight sm:text-[30px]">Send us a message</h3>
                <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
                  {formError && (
                    <p role="alert" className="border border-red-600 bg-red-50 p-3 text-sm font-semibold text-red-700 sm:col-span-2">
                      {formError}
                    </p>
                  )}
                  <Field id="name" label="Your name" autoComplete="name" placeholder="Your name" value={values.name} onChange={set('name')} error={errors.name} />
                  <Field
                    id="email"
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="name@example.com"
                    value={values.email}
                    onChange={set('email')}
                    error={errors.email}
                  />
                  <Field
                    id="phone"
                    label="Phone (optional)"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+1 555 010 2030"
                    value={values.phone}
                    onChange={set('phone')}
                  />
                  <SelectField id="topic" label="Topic" options={CONTACT_TOPICS} value={values.topic} onChange={set('topic')} />
                  <div className="sm:col-span-2">
                    <TextareaField
                      id="message"
                      label="Message"
                      placeholder="Tell us about the occasion, colours and budget..."
                      value={values.message}
                      onChange={set('message')}
                      error={errors.message}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button as="button" type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
                      {pending ? 'Sending...' : 'Send message'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading label="// FAQ" title="Quick answers" />
        <div className="mx-auto max-w-3xl divide-y divide-line border-y border-line">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-lg font-bold transition-colors duration-200 hover:text-lime [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDownIcon className="size-5 shrink-0 text-lime transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-sm leading-[1.8] md:text-base">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}
