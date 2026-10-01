(() => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const status = document.querySelector('#contact-status');
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button.querySelector('span');
  let pending = false, previousPayload = '', requestId;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    const data = new FormData(form);
    const payload = Object.fromEntries(['first', 'last', 'email', 'message', 'website'].map(key => [key, String(data.get(key) || '').trim()]));
    // Reuse the ID when retrying the same message so Resend cannot send it twice.
    const fingerprint = JSON.stringify(payload);
    if (fingerprint !== previousPayload) {
      requestId = crypto.randomUUID();
      previousPayload = fingerprint;
    }
    pending = true;
    button.disabled = true;
    buttonLabel.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = '';
    delete status.dataset.state;
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, requestId })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Your message could not be sent. Please try again.');
      status.textContent = 'Thank you. Your enquiry has been sent — we’ll be in touch shortly.';
      status.dataset.state = 'success';
      form.reset();
      previousPayload = '';
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' || error.name === 'AbortError'
        ? 'Sending took too long. Your message is still in the form — please try again.'
        : error instanceof TypeError || error instanceof SyntaxError
          ? 'We couldn’t connect. Your message is still in the form — please try again or email info@mam.london.'
          : error.message;
      status.dataset.state = 'error';
    } finally {
      pending = false;
      button.disabled = false;
      buttonLabel.textContent = 'Send enquiry';
      form.removeAttribute('aria-busy');
      status.focus();
    }
  });
})();
