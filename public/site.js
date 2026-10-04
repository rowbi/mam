/* Navigation uses real page links; JavaScript only enhances photos and the form. */
const menu=document.querySelector('.mobile-menu');
document.addEventListener('click',event=>{if(menu?.open&&!menu.contains(event.target))menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary').focus();}});
const dialog=document.querySelector('.gallery-dialog');
let photoTrigger;
if(dialog && typeof dialog.showModal==='function') {
  const close=()=>{dialog.close();photoTrigger?.focus();};
  document.querySelectorAll('[data-gallery]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();photoTrigger=link;
    const image=dialog.querySelector('img');image.src=link.href;image.alt=link.querySelector('img').alt;
    dialog.querySelector('.gallery-dialog-caption').textContent=link.dataset.label;
    dialog.showModal();
  }));
  dialog.querySelector('.gallery-close').addEventListener('click',close);
  dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();}});
  dialog.addEventListener('close',()=>photoTrigger?.focus());
}
const form=document.querySelector('#contact-form');
if(form) {
  const status=document.querySelector('#contact-status');
  const button=form.querySelector('button[type="submit"]');
  let lastPayload='',requestId='',sending=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(sending || !form.reportValidity())return;
    const data=Object.fromEntries(new FormData(form));
    const payload=JSON.stringify(data);
    if(payload!==lastPayload){lastPayload=payload;requestId=crypto.randomUUID();}
    sending=true;button.disabled=true;button.textContent='Sending…';form.setAttribute('aria-busy','true');status.hidden=true;
    try {
      const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,requestId}),signal:AbortSignal.timeout(20000)});
      const result=await response.json();
      if(!response.ok || !result.success)throw new Error(result.error||'Your enquiry could not be sent. Please try again or email info@mam.london.');
      status.textContent='Thank you. We’ll be in touch to discuss your project.';status.dataset.state='success';status.className='form-status form-status-sent';form.reset();lastPayload='';requestId='';
    } catch(error) {
      status.textContent=error.name==='TimeoutError'?'The request timed out. Please try again or email info@mam.london.':error.message;
      status.dataset.state='error';status.className='form-status form-status-error';
    } finally {sending=false;button.disabled=false;button.textContent='Send enquiry';form.removeAttribute('aria-busy');status.hidden=false;}
  });
}
