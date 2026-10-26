import {readRecap,writeRecap,removeRecap,hasSession,SESSION_KEY,SAVED_KEY,recapMarkup} from './reef-recap.mjs';
const root=document.querySelector('#recapContent'),status=document.querySelector('#recapStatus');
function render(savedOnly=false){
  const saved=readRecap(()=>localStorage,SAVED_KEY),session=readRecap(()=>sessionStorage,SESSION_KEY);
  const r=savedOnly?saved:session||(hasSession(()=>sessionStorage)?null:saved);
  if(!r){root.innerHTML=`<div class="notice"><h2>No completed recap in this tab yet.</h2><p>Finish The Curious Reef to see your own answers and story choices here. No account is needed.</p><div class="actions"><a class="button coral" href="/adventure">Start an adventure →</a>${saved?'<button class="button light" id="viewSaved">View previously saved recap</button>':''}</div></div>`;const view=root.querySelector('#viewSaved');if(view)view.onclick=()=>render(true);return;}
  const isSaved=savedOnly||!session;
  root.innerHTML=`<div class="notice"><strong>${isSaved?'Saved personal recap · This browser only':'This adventure’s personal recap · This tab only'}</strong><br>${isSaved?'Kept on this device by a grown-up.':'Kept for this browser tab. Save below if you want to keep it after closing the tab.'} No account or sample data is included.</div>${recapMarkup(r)}<section class="card no-print"><h2>Keep this discovery</h2><p>Saving keeps this recap in this browser, where other people using the device can see it. Saving a new recap replaces the previously saved one.</p><label class="adult-confirm"><input type="checkbox" id="recapConsent"><span>I'm the grown-up and want to save this recap on this device.</span></label><div class="actions"><button class="button" id="saveRecap" disabled>Save recap on this device</button><button class="button light" id="printRecap">Print recap</button><button class="button light danger" id="removeRecap">Remove this personal recap</button></div></section><div class="actions no-print recap-story"><a class="button light" href="/adventure">Explore again</a>${session&&savedOnly?'<button class="button light" id="viewCurrent">Back to this adventure’s recap</button>':''}</div>`;
  root.querySelector('#recapConsent').onchange=e=>root.querySelector('#saveRecap').disabled=!e.target.checked;
  root.querySelector('#saveRecap').onclick=()=>{status.textContent=writeRecap(()=>localStorage,SAVED_KEY,r)?'Personal recap saved on this device. Nothing was sent to an account.':'This browser could not save the recap. You can print it instead.';};
  root.querySelector('#printRecap').onclick=()=>window.print();
  root.querySelector('#removeRecap').onclick=()=>{
    if(!confirm('Remove this personal recap from this browser? Print it first if you want to keep it.'))return;
    const same=other=>other&&other.completedAt===r.completedAt;
    const clearedSession=!same(session)||removeRecap(()=>sessionStorage,SESSION_KEY);
    const clearedSaved=!same(readRecap(()=>localStorage,SAVED_KEY))||removeRecap(()=>localStorage,SAVED_KEY);
    render();status.textContent=clearedSession&&clearedSaved?'Personal recap removed from this browser.':'Could not fully remove the recap. Check this browser’s storage settings.';
  };
  const current=root.querySelector('#viewCurrent');if(current)current.onclick=()=>render();
}
render();
