const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin');
  if (!origin || origin !== new URL(request.url).origin) return json({error:'Please submit the form from this website.'},403);
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM || !env.TURNSTILE_SECRET_KEY) {
    return json({error:'The contact form is being set up. Please email info@mam.london or call +44 (0) 7789 755330.'},503);
  }
  if (Number(request.headers.get('Content-Length') || 0) > 16000) return json({error:'Message is too long.'},413);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 16000) return json({error:'Message is too long.'},413);
    body = JSON.parse(raw);
  } catch { return json({error:'Invalid form submission.'},400); }
  if (body.website) return json({success:true});
  const first = String(body.first || '').trim(), last = String(body.last || '').trim();
  const email = String(body.email || '').trim(), message = String(body.message || '').trim();
  if (!first || !last || first.length > 100 || last.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(email) || message.length > 10000) {
    return json({error:'Please enter a valid name, email address and message.'},400);
  }
  if (!body.token || String(body.token).length > 2048) return json({error:'Please complete the security check.'},400);
  try {
    const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:'POST', body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:body.token,remoteip:request.headers.get('CF-Connecting-IP') || ''})
    });
    const result = await check.json();
    const host = new URL(request.url).hostname;
    if (!result.success || result.hostname !== host || result.action !== 'FormID-356') return json({error:'The security check expired. Please try again.'},400);
    const sent = await fetch('https://api.resend.com/emails', {
      method:'POST', headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:env.CONTACT_FROM,to:env.CONTACT_TO || 'info@mam.london',reply_to:email,
        subject:'New MAM London website enquiry', text:`Name: ${first} ${last}\nEmail: ${email}\n\n${message}`})
    });
    if (!sent.ok) return json({error:'Your message could not be sent. Please email info@mam.london or try again later.'},502);
    return json({success:true});
  } catch { return json({error:'Your message could not be sent. Please email info@mam.london or try again later.'},502); }
}

export const onRequestGet = () => json({error:'Method not allowed.'},405);
