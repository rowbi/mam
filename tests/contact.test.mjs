import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequestGet } from '../functions/api/contact.js';

const data = {first:'Alex',last:'Example',email:'alex@example.com',message:'A London renovation.',website:'',requestId:'f89c5a27-e484-41d3-9515-73ff09fc0111'};
const env = {RESEND_API_KEY:'test-key'};
const submit = (body=data, settings=env, headers={}) => onRequestPost({env:settings,request:new Request('https://mam.london/api/contact',{method:'POST',headers:{Origin:'https://mam.london','Content-Type':'application/json',...headers},body:JSON.stringify(body)})});

test('Contact delivery and failure handling',async t=>{
  const originalFetch=globalThis.fetch;
  const calls=[];
  globalThis.fetch=async(url,options)=>{
    calls.push({url,options});
    return Response.json({id:'test-email-id'});
  };
  try {
    await t.test('verified sender stays server-side and reply-to uses visitor email',async()=>{
      const response=await submit();
      assert.equal(response.status,200);
      assert.deepEqual(await response.json(),{success:true});
      assert.equal(calls[0].url,'https://api.resend.com/emails');
      assert.equal(calls[0].options.headers.Authorization,'Bearer test-key');
      assert.equal(calls[0].options.headers['Idempotency-Key'],`mam-contact/${data.requestId}`);
      assert.deepEqual(JSON.parse(calls[0].options.body),{
        from:'MAM London <website@mam.london>',to:['info@mam.london'],reply_to:'alex@example.com',
        subject:'New MAM London website enquiry',text:'Name: Alex Example\nEmail: alex@example.com\n\nA London renovation.'
      });
    });
    await t.test('rejects invalid fields, oversized payloads and unrelated origins without sending',async()=>{
      calls.length=0;
      for(const invalid of [null,[],{}, {...data,email:'bad'}, {...data,email:'a@example.com\r\nBcc: x@example.com'}, {...data,message:' '}, {...data,first:123}, {...data,requestId:'bad'}]) {
        assert.equal((await submit(invalid)).status,400);
      }
      assert.equal((await submit({...data,message:'x'.repeat(65000)})).status,413);
      assert.equal((await submit(data,env,{Origin:'https://other.example'})).status,403);
      assert.equal((await submit(data,env,{'Content-Type':'text/plain'})).status,415);
      assert.equal(calls.length,0);
    });
    await t.test('honeypot never sends and absent credentials never report success',async()=>{
      assert.equal((await submit({...data,website:'bot.example'})).status,200);
      const response=await submit(data,{});
      assert.equal(response.status,503);
      assert.ok((await response.json()).error.includes('info@mam.london'));
      assert.equal(calls.length,0);
    });
    await t.test('upstream errors and network failures never report success',async()=>{
      for(const mock of [async()=>Response.json({message:'Invalid key'},{status:401}),async()=>Response.json({}),async()=>{throw new Error('network failed');}]) {
        globalThis.fetch=mock;
        const response=await submit();
        assert.equal(response.status,502);
        assert.equal((await response.json()).success,undefined);
      }
    });
    await t.test('GET cannot send an email',()=>assert.equal(onRequestGet().status,405));
  } finally {globalThis.fetch=originalFetch;}
});
