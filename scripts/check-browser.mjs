import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('screenshots',{recursive:true});
const base='http://localhost:8080';
const browser=await chromium.launch();
try {
  for(const [label,width,height] of [['desktop',1440,900],['mobile',390,844],['small-mobile',320,740],['tablet',1100,900]]) {
    const page=await browser.newPage({viewport:{width,height}});
    await page.emulateMedia({reducedMotion:'reduce'});
    const errors=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(base)&&!r.url().includes('/api/')&&r.status()>=400)missing.push(r.url());});
    for(const [name,route] of [['home','/'],['services','/services/'],['gallery','/gallery/'],['contact','/contact/']]) {
      assert.equal((await page.goto(base+route)).status(),200);
      await page.locator('h1').waitFor();
      assert.equal(await page.locator('h1').count(),1,'One descriptive main heading');
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://mam.london'+route);
      assert.ok((await page.locator('meta[name="description"]').getAttribute('content')).length>50);
      const schema=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
      assert.equal(schema['@graph'][0].name,'MAM London');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}/${label}: no horizontal overflow`);
      const total=await page.evaluate(()=>document.body.scrollHeight);
      for(let y=0;y<total;y+=height){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(60);}
      await page.locator('img[src]').evaluateAll(async images=>{await Promise.all(images.map(i=>i.decode().catch(()=>{})));});
      assert.deepEqual(await page.evaluate(()=>[...document.images].filter(i=>i.getAttribute('src')&&(!i.complete||!i.naturalWidth)).map(i=>i.src)),[],`${name}/${label}: all images load`);
      await page.evaluate(()=>window.scrollTo(0,0));
      if(label==='desktop'||label==='mobile')await page.screenshot({path:`screenshots/${name}-${label}.png`,fullPage:true});
      const nav=width>1050?page.locator('.desktop-nav'):page.locator('.mobile-menu nav');
      if(width<=1050)await page.locator('.mobile-menu summary').click();
      await nav.getByRole('link',{name:'Gallery',exact:true}).click();
      await page.waitForURL(base+'/gallery/');
      if(width<=1050)await page.locator('.mobile-menu summary').click();
      const returnNav=width>1050?page.locator('.desktop-nav'):page.locator('.mobile-menu nav');
      await returnNav.getByRole('link',{name:name.charAt(0).toUpperCase()+name.slice(1),exact:true}).click();
      await page.waitForURL(base+route);
      if(name==='home') {
        const faq=page.locator('.faq-list details').first();await faq.locator('summary').click();assert.equal(await faq.getAttribute('open'),'');
        const firstService=page.locator('.service-row').first();await firstService.click();await page.waitForURL(base+'/services/#turnkey-renovations');
        assert.equal(await page.locator('#turnkey-renovations').count(),1);await page.goto(base+route);
      }
      if(name==='gallery') {
        assert.equal(await page.locator('[data-gallery]').count(),27);
        const photo=page.locator('[data-gallery]').first();await photo.click();
        const dialog=page.locator('.gallery-dialog');await dialog.waitFor({state:'visible'});
        assert.match(await dialog.locator('img').getAttribute('src'),/london-rear-extension/);
        await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
        assert.ok(await photo.evaluate(el=>el===document.activeElement),'Focus returns to photograph');
      }
      if(name==='contact' && (label==='desktop'||label==='mobile')) {
        const submissions=[];let succeed=false;
        await page.route('**/api/contact',async route=>{submissions.push(route.request().postDataJSON());await route.fulfill({status:succeed?200:502,contentType:'application/json',body:JSON.stringify(succeed?{success:true}:{error:'Please try again or email info@mam.london.'})});});
        const button=page.getByRole('button',{name:'Send enquiry'});
        await button.click();assert.equal(submissions.length,0,'Empty form cannot submit');
        await page.getByLabel('First name').fill('Alex');await page.getByLabel('Last name').fill('Example');
        await page.getByLabel('Email address').fill('alex@example.com');await page.getByLabel('Phone').fill('+44 7789 755330');
        const message=page.getByLabel('Tell us about your project');await message.fill('A kitchen renovation in London.');
        await button.click();await page.locator('#contact-status[data-state="error"]').waitFor();
        assert.equal(await message.inputValue(),'A kitchen renovation in London.');
        succeed=true;await button.click();await page.locator('#contact-status[data-state="success"]').waitFor();
        assert.equal(submissions.length,2);assert.equal(submissions[0].requestId,submissions[1].requestId);
        assert.equal(submissions[1].phone,'+44 7789 755330');assert.equal(submissions[1].website,'');
        assert.equal(await message.inputValue(),'');await page.unroute('**/api/contact');
      }
    }
    assert.deepEqual(missing,[],`${label}: no missing local resources`);assert.deepEqual(errors,[],`${label}: no runtime errors`);
    await page.close();console.log(`${label}: pages, navigation, images, metadata, gallery and layout passed.`);
  }
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto(base);await page.locator('.desktop-nav').getByRole('link',{name:'Services'}).click();await page.waitForURL(base+'/services/');
  assert.equal(await page.locator('.service-chapter').count(),6);await context.close();
  console.log('Navigation and page content also work without JavaScript. Contact success/retry flows use mocked delivery; no emails sent.');
} finally {await browser.close();}
