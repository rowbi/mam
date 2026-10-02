import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { enquiryEmail } from '../src/email/enquiry.js';
await mkdir('screenshots',{recursive:true});
const rendered=enquiryEmail({first:'Alex',last:'Example',email:'alex@example.com',message:'We are planning a kitchen renovation in Walton-on-Thames.\n\nWe would like to discuss the layout, new joinery and a possible start early next year. Please let us know when you would be available to visit.'});
const html=rendered.html.replace('cid:mam-logo',`data:image/png;base64,${rendered.attachments[0].content}`);
const browser=await chromium.launch();
try {
  for(const [name,width] of [['desktop',720],['mobile',390]]) {
    const page=await browser.newPage({viewport:{width,height:1000}});
    await page.setContent(html);
    await page.locator('img').evaluate(image=>image.decode());
    assert.equal(await page.getByRole('heading',{name:'New project enquiry'}).count(),1);
    assert.equal(await page.getByRole('link',{name:'Reply to enquiry'}).getAttribute('href'),'mailto:alex%40example.com');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Email fits viewport');
    await page.screenshot({path:`screenshots/enquiry-email-${name}.png`,fullPage:true});
    const hostile=enquiryEmail({first:'Alex',last:'Example',email:'alex@example.com',message:'<img src=x onerror=alert(1)>\n'+('a'.repeat(500))});
    await page.setContent(hostile.html.replace('cid:mam-logo',`data:image/png;base64,${hostile.attachments[0].content}`));
    assert.equal(await page.locator('img').count(),1,'User content is not interpreted as HTML');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Long message wraps');
    await page.close();
  }
  console.log('Formatted enquiry email: desktop/mobile layout, embedded logo, reply link and escaped visitor content passed.');
} finally {await browser.close();}
