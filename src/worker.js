import { onRequestPost } from '../functions/api/contact.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (url.hostname === 'www.mam.london' && !path.startsWith('/api/') && ['GET', 'HEAD'].includes(request.method)) {
      url.hostname = 'mam.london';
      return Response.redirect(url.toString(), 308);
    }
    if (path === '/api/contact' || path === '/api/contact/') {
      if (request.method === 'POST') return onRequestPost({ request, env });
      return Response.json({ error: 'Method not allowed.' }, {
        status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' }
      });
    }
    if (path.startsWith('/api/')) {
      return Response.json({ error: 'Not found.' }, { status: 404 });
    }
    return env.ASSETS.fetch(request);
  }
};
