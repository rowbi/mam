(() => {
  const form = document.querySelector('#wpforms-form-356');
  if (!form) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const status = document.querySelector('#contact-status');
    const button = form.querySelector('button[type="submit"]');
    const token = data.get('cf-turnstile-response');
    status.replaceChildren();
    if (!token) { status.textContent = 'Please complete the security check.'; return; }
    button.disabled = true; button.textContent = 'Sending...';
    try {
      const response = await fetch('/api/contact', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({first:data.get('wpforms[fields][9][first]'),last:data.get('wpforms[fields][9][last]'),
          email:data.get('wpforms[fields][10]'),message:data.get('wpforms[fields][11]'),website:data.get('website'),token})
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Your message could not be sent. Please try again.');
      status.textContent = 'Thanks for contacting us! We will be in touch with you shortly.';
      form.reset();
    } catch (error) {
      status.textContent = error.message || 'Your message could not be sent. Please email info@mam.london.';
    } finally {
      button.disabled = false; button.textContent = 'Submit';
      if (window.turnstile) window.turnstile.reset();
    }
  });
})();
