import { onRequestPost } from '../functions/api/contact.js';

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
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
