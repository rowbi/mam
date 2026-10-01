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

The visible fields and styling match the old form. WordPress processing is replaced by a Cloudflare Pages Function at `/api/contact`, using Resend and Cloudflare Turnstile.

Add these variables in Cloudflare Pages → Settings → Variables and Secrets, for Production and Preview if both are being tested:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Secret API key from your Resend account. |
| `CONTACT_FROM` | Sender on a domain verified in Resend, e.g. `MAM London <website@mam.london>`. |
| `CONTACT_TO` | Enquiry recipient; defaults to `info@mam.london`. |
| `TURNSTILE_SECRET_KEY` | Secret for the Turnstile widget used on this site. |

The existing public Turnstile site key is preserved in `public/contact/index.html`. If using a new widget, replace its `data-sitekey` value there. Allow `mam.london`, `www.mam.london`, and the Pages preview hostname in the widget's hostname settings. Redeploy after updating variables.

Until these settings are supplied, the form shows an honest setup message with the company's email address and phone number. It never reports a successful send when no email was sent. Name and email are validated, the captcha is verified server-side, and messages use the visitor's email as Reply-To.

Email delivery cannot be verified without your own credentials. Send a test enquiry after configuration and confirm receipt before retiring the old server.

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
