/**
 * contact-form.js — progressive enhancement for the contact form.
 *
 * Without JS the form posts normally and contact.php redirects back with
 * the result. With JS this module:
 * - validates fields as the user leaves them, with clear messages
 *   (using the browser's Constraint Validation API, so the rules stay in
 *   the HTML attributes: required, type, minlength, maxlength),
 * - sends the form with fetch() and asks for JSON,
 * - shows success or error messages without reloading the page,
 * - shows server-side field errors in the same places.
 */

/** Human-friendly messages per field and validity state. */
const MESSAGES = {
  name: {
    valueMissing: 'Please enter your name.',
    tooLong: 'Please keep your name shorter.',
  },
  email: {
    valueMissing: 'Please enter your e-mail address.',
    typeMismatch: 'Please enter a valid e-mail address, like name@example.com.',
    tooLong: 'Please enter a shorter e-mail address.',
  },
  message: {
    valueMissing: 'Please write a message.',
    tooShort: 'Your message is a little short. Please write at least {min} characters.',
    tooLong: 'Please keep your message under {max} characters.',
  },
};

/**
 * Return an error message for a field, or '' if it is valid.
 * Whitespace-only input counts as empty, like on the server.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 */
function errorFor(field) {
  const text = MESSAGES[field.name];
  const value = field.value.trim();

  if (field.required && value === '') return text.valueMissing;
  if (field.minLength > 0 && value.length < field.minLength) {
    return text.tooShort.replace('{min}', field.minLength);
  }
  if (field.maxLength > 0 && value.length > field.maxLength) {
    return text.tooLong.replace('{max}', field.maxLength);
  }
  if (field.validity.typeMismatch) return text.typeMismatch;

  return '';
}

/**
 * @param {HTMLFormElement | null} form
 */
export function initContactForm(form) {
  if (!form || !('fetch' in window)) return;

  // JS takes over validation, so the browser's own bubbles are turned off.
  // (The HTML attributes stay, so no-JS users still get native validation.)
  form.noValidate = true;

  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[data-submit]');
  const fields = [...form.elements].filter((el) => el.name in MESSAGES);
  const submitLabel = submit.textContent;
  let busy = false;

  const showFieldError = (field, message) => {
    const output = document.getElementById(`${field.id}-error`);
    if (output) output.textContent = message;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  };

  const validate = (field) => {
    const message = errorFor(field);
    showFieldError(field, message);
    return message === '';
  };

  const setStatus = (type, message) => {
    status.className = `alert alert--${type}`;
    status.textContent = message;
  };

  const setBusy = (value) => {
    busy = value;
    submit.setAttribute('aria-busy', String(value));
    submit.textContent = value ? 'Sending…' : submitLabel;
  };

  for (const field of fields) {
    // Validate when leaving a field the user has typed in…
    field.addEventListener('blur', () => {
      if (field.value !== '') validate(field);
    });
    // …and re-check live once it is marked invalid, so the error clears
    // as soon as it is fixed.
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validate(field);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;

    const invalid = fields.filter((field) => !validate(field));
    if (invalid.length > 0) {
      setStatus('error', 'Please check the highlighted fields.');
      invalid[0].focus();
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        form.reset();
        setStatus('success', result.message);
        status.focus();
        return;
      }

      // Server-side errors are shown exactly like client-side ones.
      const errors = result.errors ?? {};
      for (const field of fields) showFieldError(field, errors[field.name] ?? '');
      setStatus('error', result.message || 'Something went wrong. Please try again.');

      const firstInvalid = fields.find((field) => errors[field.name]);
      (firstInvalid ?? status).focus();
    } catch {
      setStatus('error', 'The message could not be sent. Please check your connection and try again.');
      status.focus();
    } finally {
      setBusy(false);
    }
  });
}
