// ---------------------------------------------------------------------------------------------
// FRONT-END STAND-IN - there is no backend yet.
// The contact form calls this and nothing is actually sent: after a short delay it reports success.
// Replace the body with a real fetch() to your API / email service (throw an Error and its message is shown
// on the form).
// ---------------------------------------------------------------------------------------------
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// eslint-disable-next-line no-unused-vars
export async function sendContactRequest({ name, email, phone, topic, message }) {
  await wait(400);
  return { ok: true };
}
