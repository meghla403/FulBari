import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import { Field, PasswordField } from '../components/Field';
import { signInRequest } from '../lib/auth';
import useDocumentTitle from '../lib/useDocumentTitle';
import { focusFirstError, isEmail } from '../lib/validate';
import { useStore } from '../store/StoreContext';

const FIELDS = ['email', 'password'];

const validate = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!isEmail(email)) errors.email = 'Enter a valid email address, like name@example.com.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
};

export default function SignIn() {
  useDocumentTitle('Sign in');
  const { user, signIn } = useStore();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  // Already signed in (or just signed in): go where the visitor was heading.
  if (user) return <Navigate to={location.state?.from || '/account'} replace />;

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return focusFirstError(found, FIELDS);

    setPending(true);
    try {
      signIn(await signInRequest(values));
    } catch (err) {
      setFormError(err.message || 'We could not sign you in. Please try again.');
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      heading="Welcome back"
      intro="Sign in to see your wishlist and manage your account."
      footer={
        <>
          New to FulBari?
          <Link to="/register" className="inline-flex min-h-11 items-center font-bold underline transition-colors duration-200 hover:text-lime">
            Create an account
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
          autoComplete="current-password"
          placeholder="Your password"
          value={values.password}
          onChange={set('password')}
          error={errors.password}
        />
        <Button as="button" type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
          {pending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
