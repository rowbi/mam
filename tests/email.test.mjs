import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enquiryEmail } from '../src/email/enquiry.js';

test('Formatted enquiry preserves values and safely displays visitor text',()=>{
  const body={first:' Alex & Sam ',last:'<Example>',email:'alex+test@example.com',message:'<script>alert("test")</script>\nSecond line & details.'};
  const result=enquiryEmail(body);
  assert.match(result.html,/Alex &amp; Sam &lt;Example&gt;/);
  assert.ok(!result.html.includes('<script>'));
  assert.match(result.html,/&lt;script&gt;alert\(&quot;test&quot;\)&lt;\/script&gt;<br>Second line &amp; details\./);
  assert.match(result.html,/mailto:alex%2Btest%40example.com/);
  assert.equal(result.text,'Name: Alex & Sam <Example>\nEmail: alex+test@example.com\n\n'+body.message);
  assert.deepEqual(enquiryEmail(body),result,'Retries produce an identical email payload');
});
