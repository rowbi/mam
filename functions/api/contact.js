const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});
const failure = 'Your message could not be sent. Please try again or email info@mam.london.';

export async function onRequestPost({ request, env }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return json({ error: 'Please submit the form from this website.' }, 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'Invalid form submission.' }, 415);
  if (Number(request.headers.get('Content-Length') || 0) > 64000) return json({ error: 'Message is too long.' }, 413);
  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 64000) return json({ error: 'Message is too long.' }, 413);
    body = JSON.parse(raw);
  } catch { return json({ error: 'Invalid form submission.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid form submission.' }, 400);
  // A hidden field catches simple spambots without interrupting visitors.
  if (body.website) return json({ success: true });
  const { first, last, email, message, requestId } = body;
  if (![first, last, email, message, requestId].every(value => typeof value === 'string') ||
      !first.trim() || !last.trim() || first.length > 100 || last.length > 100 ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      /[\r\n]/.test(email) || !message.trim() || message.length > 10000 ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId)) {
    return json({ error: 'Please enter your name, a valid email address and a message.' }, 400);
  }
  if (!env.RESEND_API_KEY) return json({ error: 'The contact form is being set up. Please email info@mam.london or call +44 (0) 7789 755330.' }, 503);
  try {
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `mam-contact/${requestId}` },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'MAM London <website@mam.london>',
        to: [env.CONTACT_TO || 'callum@monacoevents.co.uk'], reply_to: email.trim(),
        subject: 'New MAM London website enquiry',
        text: `Name: ${first.trim()} ${last.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`
      })
    });
    if (!sent.ok) return json({ error: failure }, 502);
    const result = await sent.json();
    if (!result.id) return json({ error: failure }, 502);
    return json({ success: true });
  } catch { return json({ error: failure }, 502); }
}
export const onRequestGet = () => json({ error: 'Method not allowed.' }, 405);
