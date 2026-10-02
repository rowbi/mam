import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

test('Worker routes pages to the asset binding',async()=>{
  for(const path of ['/', '/gallery/', '/contact/', '/contact-form.js', '/unknown-page']) {
    const request=new Request('https://mam.london'+path);
    let forwarded;
    const result=await worker.fetch(request,{ASSETS:{fetch:r=>{forwarded=r;return new Response('asset');}}});
    assert.equal(forwarded,request);
    assert.equal(await result.text(),'asset');
  }
});

test('Worker exposes contact endpoint instead of serving an asset',async()=>{
  const env={ASSETS:{fetch:()=>{throw new Error('API must not use static assets');}}};
  for(const path of ['/api/contact','/api/contact/']) {
    for(const method of ['GET','PUT','DELETE']) {
      const response=await worker.fetch(new Request('https://mam.london'+path,{method}),env);
      assert.equal(response.status,405);
      assert.equal(response.headers.get('Allow'),'POST');
    }
    const response=await worker.fetch(new Request('https://mam.london'+path,{method:'POST',headers:{Origin:'https://mam.london','Content-Type':'application/json'},body:JSON.stringify({first:'Alex',last:'Example',email:'alex@example.com',message:'A London renovation.',requestId:'f89c5a27-e484-41d3-9515-73ff09fc0111'})}),env);
    assert.equal(response.status,503,'Missing runtime secret is reported honestly');
    assert.ok((await response.json()).error.includes('being set up'));
  }
  assert.equal((await worker.fetch(new Request('https://mam.london/api/unknown'),env)).status,404);
});
