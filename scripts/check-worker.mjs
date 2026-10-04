import assert from 'node:assert/strict';
const base='http://127.0.0.1:8080';
let ready=false;
for(let attempt=0;attempt<60;attempt++) {
  try {
    const response=await fetch(base+'/api/contact',{signal:AbortSignal.timeout(1000)});
    if(response.status===405) { ready=true;break; }
  } catch {}
  await new Promise(resolve=>setTimeout(resolve,1000));
}
assert.ok(ready,'Worker contact endpoint did not start');
for(const route of ['/', '/services/', '/gallery/', '/contact/', '/site.css', '/site.js', '/favicon.svg', '/favicon.ico', '/apple-touch-icon.png', '/robots.txt', '/sitemap.xml']) {
  const response=await fetch(base+route);
  assert.equal(response.status,200,route);
  if(route.endsWith('/')) assert.match(await response.text(),/<html/i);
  assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
}
assert.equal((await fetch(base+'/a-missing-page')).status,404,'Custom 404 page');
assert.equal((await fetch(base+'/api/unknown')).status,404,'Unknown API route');
assert.equal((await fetch(base+'/_routes.json')).status,404,'Pages metadata is not published as an asset');
const submit=(data,origin=base)=>fetch(base+'/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
assert.equal((await submit({})).status,400,'POST runs server-side validation');
assert.equal((await submit({},'https://other.example')).status,403,'Origin check runs');
const trap=await submit({website:'smoke-test-spambot'});
assert.equal(trap.status,200);
assert.deepEqual(await trap.json(),{success:true});
console.log('Workers runtime: pages, local assets, headers, custom 404, API routing and validation passed. No emails sent.');
