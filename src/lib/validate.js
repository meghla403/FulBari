export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export const MIN_PASSWORD = 8;

// Focus the first field that has an error so keyboard / screen-reader users land on the problem.
export function focusFirstError(errors, order) {
  const first = order.find((key) => errors[key]);
  if (first) document.getElementById(first)?.focus();
}
