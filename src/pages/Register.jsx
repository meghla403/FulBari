import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import { CheckboxField, Field, PasswordField } from '../components/Field';
import { registerRequest } from '../lib/auth';
import useDocumentTitle from '../lib/useDocumentTitle';
import { MIN_PASSWORD, focusFirstError, isEmail } from '../lib/validate';
import { useStore } from '../store/StoreContext';

const FIELDS = ['name', 'email', 'password', 'confirm', 'terms'];

const validate = ({ name, email, password, confirm, terms }) => {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter your full name.';
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!isEmail(email)) errors.email = 'Enter a valid email address, like name@example.com.';
  if (!password) errors.password = 'Choose a password.';
  else if (password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  if (!confirm) errors.confirm = 'Type your password again.';
  else if (confirm !== password) errors.confirm = 'The passwords do not match.';
  if (!terms) errors.terms = 'Please accept the terms to continue.';
  return errors;
};

export default function Register() {
  useDocumentTitle('Register');
  const { user, signIn } = useStore();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/account" replace />;

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return focusFirstError(found, FIELDS);

    setPending(true);
    try {
      signIn(await registerRequest(values));
    } catch (err) {
      setFormError(err.message || 'We could not create your account. Please try again.');
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Register"
      heading="Create your account"
      intro="Save your favourite flowers and check out faster next time."
      footer={
        <>
          Already have an account?
          <Link to="/sign-in" className="inline-flex min-h-11 items-center font-bold underline transition-colors duration-200 hover:text-lime">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        {formError && (
          <p role="alert" className="border border-red-600 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {formError}
          </p>
        )}
        <Field id="name" label="Full name" autoComplete="name" placeholder="Your name" value={values.name} onChange={set('name')} error={errors.name} />
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
        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint={`Use at least ${MIN_PASSWORD} characters.`}
          value={values.password}
          onChange={set('password')}
          error={errors.password}
        />
        <PasswordField
          id="confirm"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Type it again"
          value={values.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        <CheckboxField id="terms" checked={values.terms} onChange={set('terms')} error={errors.terms}>
          I agree to the terms and privacy policy.
        </CheckboxField>
        <Button as="button" type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
