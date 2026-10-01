import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('screenshots',{recursive:true});
const browser = await chromium.launch();
try {
  for (const [label,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const missing=[];
    page.on('response',r=>{if(r.url().startsWith('http://localhost:8080/')&&!r.url().endsWith('/api/contact')&&r.status()>=400)missing.push(r.url());});
    for(const [name,route] of [['home','/'],['gallery','/gallery/'],['contact','/contact/']]) {
      const response=await page.goto('http://localhost:8080'+route,{waitUntil:'domcontentloaded'});
      assert.equal(response.status(),200);
      await page.evaluate(async()=>{await document.fonts.ready;});
      // Scroll through the page to load gallery pictures and reveal animations.
      const total=await page.evaluate(()=>document.body.scrollHeight);
      for(let y=0;y<total;y+=height) { await page.evaluate(y=>window.scrollTo(0,y),y); await page.waitForTimeout(150); }
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.waitForTimeout(1200);
      await page.locator('.elementor-heading-title').first().waitFor({state:'visible'});
      await page.locator('img[src]').evaluateAll(async images => { await Promise.all(images.map(i => i.decode().catch(() => {}))); });
      await page.screenshot({path:`screenshots/${name}-${label}.png`,fullPage:true});
      const broken=await page.evaluate(()=>[...document.images].filter(i=>i.getAttribute('src')&&!i.getAttribute('src').startsWith('data:')&&(!i.complete||!i.naturalWidth)).map(i=>i.src));
      assert.deepEqual(broken,[],`${name}/${label}: broken images`);
      if(name==='home') {
        console.log(name,label,'runtime errors',errors,'missing assets',missing);
        const faq=page.locator('.elementor-tab-title').first();
        await faq.click();
        assert.equal(await faq.getAttribute('aria-expanded'),'true','FAQ opens');
      }
      if (name==='gallery') {
        const photo=page.locator('a[data-elementor-open-lightbox="yes"]').first();
        await photo.click();
        await page.locator('.mfp-wrap').waitFor({state:'visible'});
        await page.keyboard.press('Escape');
      }
      if(label==='mobile') {
        const menu=page.locator('.eael-simple-menu-toggle');
        await menu.click();
        await page.getByRole('link',{name:'Gallery',exact:true}).first().waitFor({state:'visible'});
        await menu.click();
      }
      if(name==='contact') {
        const form=page.locator('#contact-form');
        assert.equal(await form.count(),1);
        assert.equal(await page.locator('.cf-turnstile').count(),0);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
        await form.screenshot({path:`screenshots/contact-form-${label}.png`});
        const submissions=[];
        let succeed=false;
        await page.route('**/api/contact',async route=>{
          submissions.push(route.request().postDataJSON());
          await new Promise(resolve=>setTimeout(resolve,150));
          await route.fulfill({status:succeed?200:502,contentType:'application/json',body:JSON.stringify(succeed?{success:true}:{error:'Please try again or email info@mam.london.'})});
        });
        await page.getByRole('button',{name:'Send enquiry'}).click();
        assert.equal(submissions.length,0,'Empty form does not submit');
        await page.getByLabel('First name').fill('Alex');
        await page.getByLabel('Last name').fill('Example');
        await page.getByLabel('Email address').fill('alex@example.com');
        await page.getByLabel('Your project').fill('A kitchen renovation in London.');
        const button=page.getByRole('button',{name:'Send enquiry'});
        await button.click();
        await page.locator('#contact-status[data-state="error"]').waitFor();
        assert.equal(await page.getByLabel('Your project').inputValue(),'A kitchen renovation in London.','Failure preserves message');
        succeed=true;
        await button.click();
        await page.locator('#contact-status[data-state="success"]').waitFor();
        assert.equal(submissions.length,2);
        assert.equal(submissions[0].requestId,submissions[1].requestId,'Retry prevents duplicate email');
        assert.equal(submissions[1].email,'alex@example.com');
        assert.equal(submissions[1].website,'');
        assert.equal(await page.getByLabel('Your project').inputValue(),'','Success resets form');
        await page.unroute('**/api/contact');
      }
    }
    assert.deepEqual(missing,[],`${label}: missing local resources`);
    assert.deepEqual(errors,[],`${label}: browser runtime errors`);
    await page.close();
  }
  console.log('Desktop and mobile pages, gallery, FAQ, contact layout, validation, failure and retry/success flows passed.');
} finally {await browser.close();}
