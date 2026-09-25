// ---------------------------------------------------------------------------------------------
// FRONT-END STAND-IN - there is no backend yet.
// These two functions are the only place the forms talk to "the server". Today they accept any
// well-formed input after a short delay and return a user object. Replace the bodies with real
// fetch() calls to your API (and let them throw an Error whose message is shown to the user).
// The password is passed in so the real call can send it - it is never stored or logged here.
// ---------------------------------------------------------------------------------------------

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export const nameFromEmail = (email) => titleCase(email.split('@')[0].replace(/[._-]+/g, ' ').trim()) || 'Friend';

// eslint-disable-next-line no-unused-vars
export async function signInRequest({ email, password }) {
  await wait(350);
  return { name: nameFromEmail(email), email: email.trim() };
}

// eslint-disable-next-line no-unused-vars
export async function registerRequest({ name, email, password }) {
  await wait(350);
  return { name: name.trim(), email: email.trim() };
}
