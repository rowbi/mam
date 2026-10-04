# MAM London

The September MAM London design, ported to a fast static website with a Cloudflare Worker for Resend enquiries. Includes Home, Services, Gallery and Contact. All navigation uses ordinary page links; pages remain readable without JavaScript. The gallery contains the original 20 photographs and the seven October uploads.

## Cloudflare deployment

The existing Worker is `mam`, connected to this repository. Keep these build settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Root directory | Repository root |
| Node.js | 22 or newer |

The Worker serves committed `public/` files and handles `/api/contact`. A direct `npx wrangler deploy` also works. If the dashboard's existing Worker has a different name, use `npm run deploy -- --name YOUR_EXISTING_WORKER_NAME`. This project does not deploy the older ChatGPT preview.

Cloudflare Pages is also supported: build `npm run build`, output `dist`, framework preset None. Pages uses `functions/api/contact.js`.

## Resend contact form

Set these **runtime** values in Cloudflare → Worker → Settings → Variables and Secrets (not build variables):

| Name | Value |
| --- | --- |
| `RESEND_API_KEY` | Resend sending key, saved as a secret |
| `CONTACT_TO` | Recipient email address; use `info@mam.london` for the business inbox |
| `CONTACT_FROM` | Optional; defaults to `MAM London <website@mam.london>` |

The sender domain must be verified in Resend. Existing dashboard variables are preserved by `keep_vars`. For continuity with the existing test setup, an absent `CONTACT_TO` still falls back to `callum@monacoevents.co.uk`. Switch the runtime variable when ready. Mailbox hosting and MX records are independent of this website.

The form sends first name, last name, email, optional phone and project description. Enquiries include a branded HTML email, an embedded logo and visitor reply-to. Server validation, a honeypot and same-origin checks run before delivery. Retries of the same enquiry share an idempotency key. Success is shown only after Resend accepts the request; failed submissions retain their content. Credentials never reach the browser.

Automated checks mock email delivery. Confirm live receipt through the deployed Contact page once the runtime key, verified sender and recipient are configured.

## Editing content and photographs

- Page structure: `src/site/templates/*.html`.
- Services, FAQs and original photo list: `src/site/data.mjs`.
- New photo list: `src/site/new-photos.json`.
- Photography files: `public/images/gallery/`.
- Image dimensions for layout stability: `src/site/image-dimensions.json`.
- Styling and gallery/form enhancement: `public/site.css`, `public/site.js`.
- SEO metadata, navigation and page generation: `scripts/build.mjs`.

Each gallery entry is `[image path, descriptive alt text, visible caption, shape]`. Shape is `wide`, `tall` or `square`. Remove or reorder entries to change the gallery; keep an image file while another page still references it. Run `npm run build` after editing source templates or data and commit the generated `public/` pages as well, so dashboard deployments which skip the build still serve the current website.

All uploaded photos are local WebP assets with metadata removed. Existing photographs are retained; two new interior images also appear in the Home and Services layouts. No stock or generated project photographs were added.

## SEO and branding

Each page has its own title, description, canonical URL, social-sharing metadata and structured business/page data. Canonicals and `sitemap.xml` use `https://mam.london`. `robots.txt` allows crawling and excludes the API. Content is present in the initial HTML, with one main heading per page, descriptive image alternatives, dimensions and lazy loading below the fold. SVG/ICO favicon and Apple touch icon use the recovered MAM branding.

## Local checks

```sh
npm ci
npm run build
npm test
npm run check:worker
npm run preview:worker
```

Preview runs at `http://localhost:8080`. After starting it, the browser/Worker checks in `scripts/check-*.mjs` verify all routes, desktop/mobile navigation, image loading, SEO metadata, gallery controls and contact validation, error and retry/success behaviour. Browser checks require Playwright/Chromium. CI runs these checks automatically on `main` and saves screenshots.

Use an ignored `.dev.vars` for local runtime secrets; never commit credentials.
