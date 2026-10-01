# MAM London — Cloudflare migration

A static copy of the existing public WordPress website, captured on 1 October 2026. The original Home, Gallery and Contact page markup, styling, layout, logo, photography, typography and Elementor interactions are retained. Assets are stored in this repository and served locally. No PHP, WordPress database or AWS server is required.

This is a public website migration. It does not include the WordPress administration area, editing tools, database, historical form submissions or mailboxes.

## Deploy to Cloudflare Pages

Create a **Pages** project, connect `rowbi/mam`, and use:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Leave blank |

The root `functions/` directory is automatically deployed by Cloudflare Pages. Use **Pages**, rather than a Workers Git project, for this configuration. The build uses Node.js and has no npm dependencies.

Check the generated `pages.dev` preview before adding `mam.london` and `www.mam.london` under the Pages project's Custom domains. Leave AWS running until the domain has switched and the website and contact form have been checked. Preserve any MX and email-related DNS records; this repository does not migrate email hosting.

## Contact form

The contact form has been redesigned with visible labels, larger fields, a responsive layout and a gold enquiry button. It sends via Resend through the Cloudflare Pages Function at `/api/contact`. There is no Turnstile widget or Turnstile secret to configure. A hidden honeypot catches simple spambots; server-side validation and same-origin checks also apply. This is basic spam filtering, not a full bot-prevention service.

### Enable email delivery

1. In [Resend](https://resend.com/domains), add and verify `mam.london` by adding the DNS records Resend supplies. Preserve your existing mailbox MX records. If you verify a sending subdomain instead, use that subdomain in `CONTACT_FROM`.
2. Create a Resend API key with **Sending access** for the verified domain.
3. In Cloudflare Pages → Settings → Variables and Secrets, add:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | Your Resend key, saved as a **secret**. Required. |
| `CONTACT_FROM` | Optional; defaults to `MAM London <website@mam.london>`. Must use a domain verified in Resend. |
| `CONTACT_TO` | Optional; defaults to `info@mam.london`. |

4. Add the variables to Production and Preview if you use both, then redeploy. Remove any old `TURNSTILE_SECRET_KEY`; it is no longer used.
5. Send an enquiry through the deployed Contact page and confirm receipt in `info@mam.london`. Replies go directly to the visitor's email address.

The API key stays on the server. The form only reports success after Resend accepts the email and returns its ID. Failed requests keep the entered message, and retries reuse an idempotency key to avoid duplicate emails. A missing API key displays a setup message with direct contact details. Automated tests mock Resend and do not send real emails; live delivery must be checked after configuring your credentials.

## Existing quirks preserved

- The homepage has a “No posts found!” news section. The source WordPress site has no published posts.
- The existing `/blog` link leads to a 404. The original error page is retained as `public/404.html`.
- Two old decorative ellipse images are missing on the live website. Their existing empty display is preserved without making requests to the retired domain.
- Existing Google Analytics and Google Maps integrations are retained. The website does not depend on the previous host for their assets.

## Editing and previewing

Page files are in `public/index.html`, `public/gallery/index.html` and `public/contact/index.html`. Original vendor assets keep their `wp-content` / `wp-includes` paths for compatibility; these are ordinary static files, not a running WordPress installation.

```sh
npm run build
npm run preview
```

The static preview opens at `http://localhost:8080`. To test the server-side contact function locally, use Cloudflare's Pages development tooling and supply your own variables. Do not commit keys or credentials.
