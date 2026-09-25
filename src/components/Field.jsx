import { useState } from 'react';

const base =
  'w-full border bg-white text-base outline-none transition-colors duration-200 placeholder:text-ink/50 focus:border-lime';

const describe = (id, error, hint) =>
  [error && `${id}-error`, hint && !error && `${id}-hint`].filter(Boolean).join(' ') || undefined;

function Shell({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-display text-base font-bold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink/70">
          {hint}
        </p>
      )}
    </div>
  );
}

// Labelled text input with an accessible error / hint. `trailing` is placed inside the input's right edge.
export function Field({ id, label, error, hint, trailing, className = '', ...inputProps }) {
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describe(id, error, hint)}
          className={`${base} h-12 px-4 ${error ? 'border-red-600' : 'border-line'} ${trailing ? 'pr-14' : ''} ${className}`}
          {...inputProps}
        />
        {trailing}
      </div>
    </Shell>
  );
}

// Multi-line text. 16px text so iOS does not zoom on focus.
export function TextareaField({ id, label, error, hint, rows = 6, className = '', ...props }) {
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={describe(id, error, hint)}
        className={`${base} min-h-[150px] resize-y p-4 ${error ? 'border-red-600' : 'border-line'} ${className}`}
        {...props}
      />
    </Shell>
  );
}

// Native select (best keyboard + mobile picker), same look as the inputs.
export function SelectField({ id, label, error, hint, options, className = '', ...props }) {
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describe(id, error, hint)}
        className={`${base} h-12 px-3 ${error ? 'border-red-600' : 'border-line'} ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

// Password input with a show/hide toggle (44px tap target).
export function PasswordField(props) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-0 top-0 grid h-12 w-12 place-items-center text-xs font-bold uppercase text-ink/70 transition-colors duration-200 hover:text-lime active:scale-95"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      }
    />
  );
}

// Checkbox whose whole label row is a 44px+ tap target.
export function CheckboxField({ id, error, children, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm md:text-base">
        <input
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="size-5 shrink-0 accent-lime"
          {...props}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
