// The home page needs billing only when its pricing section is approached.
// This changes no collection or payment behavior; billing remains parent-managed.
const pricing=document.querySelector('#pricing');
let pending,ready=false;
function loadPricing(){
  return pending??=(import('./billing.js').then(()=>{ready=true;}).catch(()=>{
    pending=null;
    const note=pricing.querySelector('[data-availability]');
    if(note)note.textContent='Free guest learning is available. Open Pricing for the latest Family details.';
  }));
}
if(pricing){
  // Also handle a fast keyboard/click interaction before the module finishes loading.
  pricing.addEventListener('click',async event=>{
    const button=event.target.closest('[data-plan]');
    if(!button||ready)return;
    event.preventDefault();event.stopImmediatePropagation();
    await loadPricing();if(ready)button.click();
  },true);
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();loadPricing();}
    },{rootMargin:'800px 0px'});
    observer.observe(pricing);
  }else loadPricing();
}
