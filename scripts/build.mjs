import {cp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {services, pillars, faqs, galleryItems} from '../src/site/data.mjs';
const origin = 'https://mam.london';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const template = name => readFile(new URL(`../src/site/templates/${name}.html`, import.meta.url), 'utf8');
const photos = JSON.parse(await readFile(new URL('../src/site/new-photos.json', import.meta.url), 'utf8'));
const dimensions = JSON.parse(await readFile(new URL('../src/site/image-dimensions.json', import.meta.url), 'utf8'));
const slug = service => service.title.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-');
const render = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (_, name) => values[name] ?? '');
const img = (src, alt, lazy=true) => `<img src="${escape(src)}" alt="${escape(alt)}" loading="${lazy?'lazy':'eager'}" decoding="async">`;
const routes = [
  ['home', '/', 'MAM London | Residential Builders & Bespoke Joinery', 'High-end home renovations, loft conversions, tailored kitchens and bespoke joinery across London. Family-run since 1999.'],
  ['services', '/services/', 'Renovations, Kitchens & Bespoke Joinery | MAM London', 'Explore MAM London’s residential building services: turnkey renovations, loft conversions, tailored kitchens, fit-outs, joinery, windows and doors.'],
  ['gallery', '/gallery/', 'Residential Renovation & Joinery Gallery | MAM London', 'See MAM London’s home renovations, kitchens, extensions and bespoke joinery, including completed interiors and work in progress.'],
  ['contact', '/contact/', 'Contact MAM London | Discuss Your Building Project', 'Contact MAM London about your renovation, loft conversion, kitchen or joinery project. Email info@mam.london or call +44 (0) 7789 755330.'],
];
const header = await template('site-header');
const footer = render(await template('site-footer'), {year:new Date().getFullYear()});
const components = {
  footer,
  serviceRows: services.map(service=>`<a href="/services/#${slug(service)}" class="service-row"><span>${service.number}</span><h3>${escape(service.title)}</h3><p>${escape(service.short)}</p></a>`).join(''),
  serviceChapters: services.map(service=>`<article id="${slug(service)}" class="service-chapter"><span class="chapter-number">${service.number}</span><div class="chapter-copy"><h2>${escape(service.title)}</h2><p class="chapter-lead">${escape(service.short)}</p><p>${escape(service.detail)}</p></div><figure>${img(service.image,service.title)}</figure></article>`).join(''),
  pillars: pillars.map(([number,title,description])=>`<article><span>${number}</span><h3>${escape(title)}</h3><p>${escape(description)}</p></article>`).join(''),
  faq: `<div class="faq-list">${faqs.map(([question,answer],i)=>`<details data-slot="accordion-item"><summary class="faq-trigger"><span>${String(i+1).padStart(2,'0')}</span>${escape(question)}</summary><div class="faq-content"><p>${escape(answer)}</p></div></details>`).join('')}</div>`,
  gallery: `<div class="gallery-grid">${[...photos,...galleryItems].map(([src,alt,label,shape],i)=>`<a href="${escape(src)}" class="gallery-card gallery-${shape}" data-gallery data-label="${escape(label)}" aria-label="View ${escape(alt)}"><span class="gallery-number">${String(i+1).padStart(2,'0')}</span>${img(src,alt,i>=2)}<span class="gallery-caption"><strong>${escape(label)}</strong><small>View image</small></span></a>`).join('')}</div><dialog class="gallery-dialog" aria-label="Project photograph"><button class="gallery-close" type="button" aria-label="Close photograph">Close</button><img alt=""><p class="gallery-dialog-caption"></p></dialog>`,
  form: await template('contact-form'),
};
function document(content, title, description, route, pageName, noindex=false) {
  const url = origin + route;
  const structuredData = {'@context':'https://schema.org','@graph':[
    {'@type':'GeneralContractor','@id':origin+'/#business',name:'MAM London',url:origin,logo:origin+'/logo.svg',image:origin+'/images/hero-home.webp',telephone:'+447789755330',email:'info@mam.london',areaServed:{'@type':'City',name:'London'}},
    {'@type':'WebSite','@id':origin+'/#website',url:origin,name:'MAM London',publisher:{'@id':origin+'/#business'},inLanguage:'en-GB'},
    {'@type':pageName==='contact'?'ContactPage':pageName==='gallery'?'CollectionPage':'WebPage','@id':url+'#page',url,name:title,description,isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#business'},inLanguage:'en-GB'},
    ...(route==='/'?[]:[{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:origin+'/'},{'@type':'ListItem',position:2,name:pageName.charAt(0).toUpperCase()+pageName.slice(1),item:url}]}]),
  ]};
  content = content.replace(/<img\b([^>]*)>/g,(tag,attrs)=>{
    const src=attrs.match(/src="([^"]+)"/)?.[1];
    const size=dimensions[src] || (src==='/logo.svg'?[891,148]:null);
    if(size && !attrs.includes('width=')) tag=tag.replace('>',` width="${size[0]}" height="${size[1]}">`);
    if(!attrs.includes('loading=') && src!=='/images/hero-home.webp') tag=tag.replace('>',' loading="lazy" decoding="async">');
    if(src==='/images/hero-home.webp') tag=tag.replace('>',' fetchpriority="high" decoding="async">');
    return tag;
  });
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title>
<meta name="description" content="${escape(description)}"><meta name="robots" content="${noindex?'noindex, follow':'index, follow, max-image-preview:large'}"><link rel="canonical" href="${url}">
<meta name="theme-color" content="#171915"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:locale" content="en_GB"><meta property="og:site_name" content="MAM London"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${origin}/images/hero-home.webp"><meta property="og:image:alt" content="MAM London renovation with herringbone flooring and garden glazing">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${origin}/images/hero-home.webp">
<link rel="stylesheet" href="/site.css"><script src="/site.js" defer></script><script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g,'\\u003c')}</script></head>
<body><a class="skip-link" href="#main-content">Skip to content</a>${content.replace('<main>','<main id="main-content">')}</body></html>\n`;
}
for(const [name,route,title,description] of routes) {
  const path=route==='/'?'public':`public/${name}`;
  await mkdir(path,{recursive:true});
  const activeHeader=header.replace(new RegExp(`href="${route==='/'?'/':route.slice(0,-1)}"`,'g'),`href="${route==='/'?'/':route.slice(0,-1)}" aria-current="page"`);
  let content=render(await template(name),{...components,header:activeHeader});
  content=content.replace(/href="\/(services|gallery|contact)"/g,'href="/$1/"');
  if(/\{\{|className|<Link|\.map\(/.test(content)) throw new Error(`Unresolved page template: ${name}`);
  await writeFile(`${path}/index.html`,document(content,title,description,route,name));
}
await writeFile('public/404.html',document(`<main><div class="page-pad">${header}</div><section class="inner-hero page-pad"><p class="eyebrow"><span></span>Page not found</p><div><h1>Let’s get you<br /><em>back home.</em></h1><p>This page could not be found. <a class="text-link" href="/">Visit the homepage</a> or <a class="text-link" href="/contact/">contact MAM London</a>.</p></div></section>${footer}</main>`,'Page Not Found | MAM London','This MAM London page could not be found.','/404.html','home',true));
await writeFile('public/robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(([,route])=>`<url><loc>${origin+route}</loc></url>`).join('')}</urlset>\n`);
await writeFile('public/_headers',`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`);
await rm('dist',{recursive:true,force:true});
await cp('public','dist',{recursive:true});
await writeFile('dist/_routes.json',JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
console.log('Built four crawlable MAM London pages, 27 gallery photos, sitemap and Cloudflare assets.');
