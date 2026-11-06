import {STORIES,LEVELS,PLANETS,findStory,reading,puzzleAnswer,storyTranscript,planetOrderResult} from './story-data.mjs';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let level='6-8',active=null,stage=0,route=null,ending=null,solved=false,planetSelections=[];
function art(theme){
  const shapes={
    planets:'<path d="M25 146Q65 17 209 53M23 176Q101 31 226 91" fill="none" stroke="var(--world-soft)" stroke-width="2"/><circle cx="42" cy="147" r="27" fill="#e7ad54"/><circle cx="74" cy="103" r="7" fill="#a18c7d"/><circle cx="97" cy="76" r="10" fill="#c79760"/><circle cx="124" cy="60" r="11" fill="#5c90a2"/><path d="m119 52 8 4-5 8" fill="none" stroke="#a4bb7a" stroke-width="4"/><circle cx="151" cy="50" r="8" fill="#c77858"/><circle cx="180" cy="51" r="18" fill="#d8ae7a"/><path d="M166 45h29m-30 12h29" stroke="#af795b" stroke-width="4"/><circle cx="105" cy="154" r="17" fill="#d8b98b"/><ellipse cx="105" cy="154" rx="30" ry="7" transform="rotate(-22 105 154)" fill="none" stroke="#a79078" stroke-width="4"/><circle cx="155" cy="132" r="13" fill="#80b6b4"/><circle cx="198" cy="123" r="12" fill="#5b77a1"/><path d="M51 38v12m-6-6h12M215 167v10m-5-5h10" stroke="var(--world-white)" stroke-width="3"/>',
    space:'<circle cx="167" cy="65" r="26" fill="var(--world-pop)"/><path d="M132 71q37-18 71-11" fill="none" stroke="var(--world-ink)" stroke-width="4"/><path d="M79 151l-9 24 27-11M108 121l22 10-23 14" fill="var(--world-pop)"/><path d="M75 141q-1-55 45-75 15 48-26 82Z" fill="var(--world-white)"/><circle cx="103" cy="108" r="10" fill="var(--world-soft)"/><path d="M76 155l-12 15M84 160l-8 16" stroke="var(--world-ink)" stroke-width="3" stroke-linecap="round"/><path d="M40 47v14m-7-7h14M178 143v12m-6-6h12M139 23v8m-4-4h8" stroke="var(--world-white)" stroke-width="3"/><circle cx="42" cy="119" r="3" fill="var(--world-ink)"/>',
    forest:'<path d="M0 183q75-57 140-15t100-6v38H0Z" fill="var(--world-soft)"/><path d="M51 172V55M183 175V42" stroke="var(--world-ink)" stroke-width="6"/><path d="M16 89 51 22l35 67Z M148 88l35-70 35 70Z" fill="var(--world-ink)"/><path d="M10 124 51 58l40 66Z M143 125l40-75 40 75Z" fill="var(--world-soft)"/><path d="M88 153l6-55 24 22 22-24 6 59-28 26Z" fill="var(--world-pop)"/><path d="M91 137l27 18 26-18-26 33Z" fill="var(--world-white)"/><circle cx="105" cy="137" r="3" fill="var(--world-ink)"/><circle cx="130" cy="137" r="3" fill="var(--world-ink)"/><circle cx="118" cy="155" r="3" fill="var(--world-ink)"/><circle cx="120" cy="46" r="14" fill="var(--world-white)"/>',
    dinosaurs:'<circle cx="185" cy="48" r="24" fill="var(--world-pop)"/><path d="M0 153 65 62l69 91 42-56 64 57v46H0Z" fill="var(--world-soft)"/><path d="M47 172q30-11 30-39c0-24 23-30 45-20l5-45c3-25 37-29 43-7 5 16-9 28-22 27l-1 64-14 14v19h-14v-20H99v20H84v-20Z" fill="var(--world-ink)"/><circle cx="153" cy="64" r="3" fill="var(--world-white)"/><path d="M135 83q8 7 16-1" fill="none" stroke="var(--world-white)" stroke-width="2"/><path d="M174 176q-10-28 1-39 18 8 14 31 0-27 19-31 8 23-12 39Z" fill="var(--world-pop)"/>',
    castle:'<circle cx="65" cy="43" r="20" fill="var(--world-white)"/><path d="M0 185q80-40 160-10t80-5v30H0Z" fill="var(--world-soft)"/><path d="M47 174V86h35v41h26V68h30v59h25V86h35v88Z" fill="var(--world-ink)"/><path d="m41 86 23-35 24 35m14-18 21-35 21 35m13 18 23-35 24 35" fill="var(--world-pop)"/><path d="M111 174v-26a12 12 0 0 1 24 0v26Z" fill="var(--world-bg)"/><path d="M59 102h11v18H59Zm116 0h11v18h-11ZM117 84h11v19h-11Z" fill="var(--world-white)"/><path d="M123 33V14l25 8-25 8" fill="var(--world-pop)" stroke="var(--world-ink)" stroke-width="2"/><path d="M31 130v12m-6-6h12M207 38v12m-6-6h12" stroke="var(--world-white)" stroke-width="3"/>'
  };
  return `<span class="story-cover ${theme}" aria-hidden="true"><svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">${shapes[theme]}</svg></span>`;
}
function stopVoice(){if('speechSynthesis' in window)window.speechSynthesis.cancel();}
function speak(){
  if(!('speechSynthesis' in window))return;
  stopVoice();const voiceStatus=$('voiceStatus');
  const text=[...$('readerStage').querySelectorAll('[data-read]')].map(e=>e.textContent).join('. ');
  const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=level==='3-5'?.8:.92;
  utterance.onstart=()=>{if(voiceStatus?.isConnected)voiceStatus.textContent='Reading aloud…';};
  utterance.onend=()=>{if(voiceStatus?.isConnected)voiceStatus.textContent='Finished reading.';};
  utterance.onerror=event=>{if(voiceStatus?.isConnected)voiceStatus.textContent=['canceled','interrupted'].includes(event.error)?'Reading stopped.':'Read-aloud is unavailable in this browser. You can read the story together.';};
  try{window.speechSynthesis.speak(utterance);}catch{voiceStatus.textContent='Read-aloud is unavailable. You can read together.';}
}
const voiceControls=()=> 'speechSynthesis' in window?'<div class="story-voice"><button type="button" id="hearStory">◖ Read aloud</button><button type="button" id="stopStory">Stop reading</button><small id="voiceStatus" role="status">Uses your browser voice.</small></div>':'';
function updateURL(){const u=new URL(location.href);u.searchParams.delete('story');u.searchParams.delete('level');if(active){u.searchParams.set('story',active.id);u.searchParams.set('level',level);}history.replaceState(null,'',u.pathname+u.search);}
function focusStory(){const heading=$('readerStage').querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});$('storyReader').scrollIntoView({block:'start',behavior:'auto'});}
function chooseLevel(value){level=Object.hasOwn(LEVELS,value)?value:'6-8';document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===level)));}
function shelf(){
  $('storyShelf').innerHTML=STORIES.map((s,i)=>`<button type="button" class="story-card" data-story="${s.id}">${art(s.theme)}<span class="story-world">0${i+1} / ${escape(s.world)}</span><strong>${escape(s.title)}</strong><span class="story-blurb">${escape(s.blurb)}</span><span class="story-open">Open this story <b aria-hidden="true">↗</b></span></button>`).join('');
  $('storyShelf').querySelectorAll('[data-story]').forEach(b=>b.onclick=()=>start(b.dataset.story));
}
function start(id){const selected=findStory(id);if(!selected)return;stopVoice();active=selected;stage=0;route=null;ending=null;solved=false;planetSelections=[];$('storyPrint').classList.remove('ready');$('storyPrint').replaceChildren();$('storyLibrary').hidden=true;$('storyReader').hidden=false;updateURL();render();focusStory();}
function library(){const previous=active?.id;stopVoice();active=null;$('storyReader').hidden=true;$('storyLibrary').hidden=false;$('storyPrint').classList.remove('ready');updateURL();document.title='Choose a story — NautilusClaw Kids';$('storyShelf').querySelector(`[data-story="${previous}"]`)?.focus();}
function move(next){stopVoice();stage=next;render();focusStory();}
function choices(items,attribute){return `<div class="story-choices">${items.map((c,i)=>`<button type="button" class="story-choice" ${attribute}="${i}"><strong>${escape(c.label)} →</strong><small>${escape(c.detail)}</small></button>`).join('')}</div>`;}
function countVisual(q){if(level!=='3-5')return '';return `<div class="counting-strip" role="img" aria-label="${q.a} ${q.op==='+'?'plus':'take away'} ${q.b}"><span aria-hidden="true">${Array.from({length:q.a},()=>`<i>${active.object}</i>`).join('')}</span><b aria-hidden="true">${q.op}</b><span aria-hidden="true">${Array.from({length:q.b},()=>`<i>${active.object}</i>`).join('')}</span><b aria-hidden="true">= ?</b></div>`;}
const planetDot=name=>`<span class="planet-dot planet-${name.toLowerCase()}" aria-hidden="true"></span>`;
function puzzleMarkup(q){
  const content=q.kind==='planet-order'?`<p class="planet-instructions">Choose a planet below to fill the next space. You can undo or clear your order.</p><details id="planetReference" class="planet-reference" ${level==='9-12'?'':'open'}><summary>Planet map to help you</summary><p>☀ Sun → ${q.expected.map(escape).join(' → ')}</p><small>Order from the Sun. Sizes, distances, and positions are not to scale.</small></details><p class="planet-sun">☀ Start nearest the Sun</p><ol id="planetSlots" class="planet-slots" aria-label="Your planet order"></ol><div class="planet-bank" role="group" aria-label="Choose the next planet">${q.choices.map(name=>`<button type="button" class="planet-tile" data-planet="${name}">${planetDot(name)}<span>${name}</span></button>`).join('')}</div><div class="planet-tools"><button type="button" class="text-button" id="undoPlanet" disabled>← Undo last</button><button type="button" class="text-button" id="clearPlanets" disabled>Clear order</button></div>`:`${countVisual(q)}<div class="story-answer-grid" role="group" aria-label="Choose your answer">${q.choices.map(n=>`<button type="button" class="story-answer${solved&&n===puzzleAnswer(q)?' correct':''}" data-answer="${n}" ${solved?'disabled':''}>${n}${solved&&n===puzzleAnswer(q)?' ✓':''}</button>`).join('')}</div>`;
  return `<section class="story-puzzle"><h2 data-read>${escape(active.puzzleTitle)}</h2><p data-read>${escape(q.prompt)}</p>${content}<div class="feedback" id="storyFeedback" role="status">${solved?escape(q.why):''}</div><button type="button" class="text-button" id="storyHint" ${solved?'hidden':''}>A little hint ✦</button></section>${voiceControls()}<div class="reader-actions"><button type="button" class="text-button" id="backChapter">← Choose a different path</button><button type="button" class="button coral" id="continueStory" ${solved?'':'disabled'}>Continue the story →</button></div>`;
}
function updatePlanetOrder(announce=false){
  const q=active.puzzles[level],result=planetOrderResult(q.expected,planetSelections);
  solved=result.correct;
  $('planetSlots').innerHTML=q.expected.map((_,i)=>`<li class="planet-slot${solved?' correct':''}"><small>${i+1}</small>${planetSelections[i]?planetDot(planetSelections[i]):'<span class="planet-empty" aria-hidden="true">?</span>'}<span>${escape(planetSelections[i]||'Choose')}</span></li>`).join('');
  $('readerStage').querySelectorAll('[data-planet]').forEach(b=>b.disabled=solved||planetSelections.includes(b.dataset.planet));
  $('undoPlanet').disabled=solved||!planetSelections.length;$('clearPlanets').disabled=solved||!planetSelections.length;
  $('continueStory').disabled=!solved;$('storyHint').hidden=solved;
  if(announce||solved){
    const feedback=$('storyFeedback');feedback.className='feedback'+(result.complete&&!solved?' try':'');
    feedback.textContent=solved?q.why:result.complete?`Almost! Check place ${result.firstMismatch+1}: ${q.expected[result.firstMismatch]} belongs there. Undo the last planet or clear the order and try again.`:`${planetSelections.length} of ${q.expected.length} planets placed. ${planetSelections.length?'Choose the next planet.':'Start with the planet nearest the Sun.'}`;
  }
}
function render(){
  const s=active,q=s.puzzles[level];$('readerLevel').textContent=`Ages ${level.replace('-','–')} · ${LEVELS[level]}`;document.title=`${s.title} — NautilusClaw Kids`;
  const titles=[s.openingTitle,s.routes[route]?.title,s.bridgeTitle,s.endings[ending]?.title];
  const texts=[s.opening,s.routes[route]?.text,s.bridge,s.endings[ending]?.text];
  let body=`<div class="reader-intro"><h1 data-read>${escape(titles[stage])}</h1>${art(s.theme)}</div>`;
  if(stage===0)body+=`<div class="reader-level-control"><label for="readingLevel">Reading level</label><select id="readingLevel">${Object.entries(LEVELS).map(([value,label])=>`<option value="${value}" ${value===level?'selected':''}>Ages ${value.replace('-','–')} · ${label}</option>`).join('')}</select></div>`;
  body+=`<div class="story-copy" data-read><p>${escape(reading(texts[stage],level))}</p></div>`;
  if(stage===0)body+=`${voiceControls()}<h2 class="story-choice-heading" data-read>${escape(s.question)}</h2>${choices(s.routes,'data-route')}<p class="story-hint-note">Both paths lead to an adventure. Choose the one you are curious about.</p>`;
  if(stage===1)body+=puzzleMarkup(q);
  if(stage===2)body+=`${voiceControls()}<h2 class="story-choice-heading" data-read>${escape(s.endingQuestion)}</h2>${choices(s.endings,'data-ending')}<p class="story-hint-note">This is your story. Either choice is welcome.</p><div class="reader-actions"><button type="button" class="text-button" id="backChapter">← Previous chapter</button></div>`;
  if(stage===3){
    const transcript=storyTranscript(s,level,route,ending);
    body+=`${voiceControls()}<div class="story-finish"><span class="eyebrow">THE END · A NEW IDEA TO TAKE WITH YOU</span><h2>You made this adventure yours.</h2><p class="fine">Your path: ${escape(s.routes[route].label)} → ${escape(s.endings[ending].label)}</p><div class="notice"><strong>Now imagine off-screen.</strong><br>${escape(s.activity)}</div><p><strong>Wonder together:</strong> ${escape(s.reflect)}</p><div class="reader-actions"><button type="button" class="button coral" id="nextWorld">Choose another story ↗</button><button type="button" class="button light" id="otherEnding">Try another ending</button><button type="button" class="text-button" id="printStory">Print our story</button></div><details class="story-transcript"><summary>Read our whole story</summary>${transcript.map(p=>`<p>${escape(p)}</p>`).join('')}</details></div>`;
    $('storyPrint').innerHTML=`<p class="print-meta">NautilusClaw Kids · Our story · Ages ${level.replace('-','–')}</p><h1>${escape(s.title)}</h1><p class="print-meta">${escape(s.routes[route].label)} → ${escape(s.endings[ending].label)}</p>${transcript.map((p,i)=>`<div class="print-section"><h2>${escape([s.openingTitle,s.routes[route].title,s.bridgeTitle,s.endings[ending].title][i])}</h2><p>${escape(p)}</p></div>`).join('')}<div class="print-section"><h2>Take the story with you</h2><p>${escape(s.activity)}</p><p>${escape(s.reflect)}</p></div>`;
  }
  if(active.id==='planets')body+='<p class="planet-science-note">An imaginary adventure with real planet names. The Sun is a star; Pluto is a dwarf planet. Our drawings show neither real scale nor current positions. <a href="https://science.nasa.gov/solar-system/planets/" target="_blank" rel="noopener noreferrer">Planet facts from NASA ↗</a></p>';
  $('storyPrint').classList.toggle('ready',stage===3);
  $('readerStage').innerHTML=`<article class="reader-card"><div class="reader-meta"><span class="eyebrow">${escape(s.title)} · ${stage+1} / 4</span><div class="story-progress" role="img" aria-label="Chapter ${stage+1} of 4">${[0,1,2,3].map(i=>`<span class="${i<=stage?'done':''}"></span>`).join('')}</div></div>${body}</article>`;
  $('readingLevel')?.addEventListener('change',e=>{stopVoice();chooseLevel(e.target.value);updateURL();render();$('readingLevel').focus();});
  $('readerStage').querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{route=Number(b.dataset.route);ending=null;solved=false;planetSelections=[];move(1);});
  $('readerStage').querySelectorAll('[data-ending]').forEach(b=>b.onclick=()=>{ending=Number(b.dataset.ending);move(3);});
  $('readerStage').querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{
    if(solved)return;const good=Number(b.dataset.answer)===puzzleAnswer(q);$('storyFeedback').className='feedback'+(good?'':' try');$('storyFeedback').textContent=good?q.why:q.hint;
    if(good){solved=true;b.classList.add('correct');b.textContent+=' ✓';$('readerStage').querySelectorAll('[data-answer]').forEach(x=>x.disabled=true);$('continueStory').disabled=false;$('storyHint').hidden=true;}else{b.classList.add('wrong');b.disabled=true;}
  });
  if(stage===1&&q.kind==='planet-order'){
    updatePlanetOrder();
    $('readerStage').querySelectorAll('[data-planet]').forEach(b=>b.onclick=()=>{
      if(solved||planetSelections.length>=q.expected.length||planetSelections.includes(b.dataset.planet)||!q.expected.includes(b.dataset.planet))return;
      planetSelections.push(b.dataset.planet);updatePlanetOrder(true);
      if(solved)$('continueStory').focus({preventScroll:true});
      else if(planetSelections.length===q.expected.length)$('undoPlanet').focus({preventScroll:true});
      else $('readerStage').querySelector('[data-planet]:not(:disabled)')?.focus({preventScroll:true});
    });
    $('undoPlanet').onclick=()=>{if(!solved){planetSelections.pop();updatePlanetOrder(true);}};
    $('clearPlanets').onclick=()=>{if(!solved){planetSelections=[];updatePlanetOrder(true);$('readerStage').querySelector('[data-planet]')?.focus({preventScroll:true});}};
  }
  $('storyHint')?.addEventListener('click',()=>{$('storyFeedback').className='feedback try';$('storyFeedback').textContent=q.hint;if($('planetReference'))$('planetReference').open=true;});
  $('continueStory')?.addEventListener('click',()=>{if(solved)move(2);});
  $('backChapter')?.addEventListener('click',()=>move(stage-1));
  $('hearStory')?.addEventListener('click',speak);
  $('stopStory')?.addEventListener('click',()=>{stopVoice();$('voiceStatus').textContent='Reading stopped.';});
  $('nextWorld')?.addEventListener('click',library);
  $('otherEnding')?.addEventListener('click',()=>move(2));
  $('printStory')?.addEventListener('click',()=>{stopVoice();window.print();});
}
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>chooseLevel(b.dataset.level));
$('allStories').onclick=library;$('restartStory').onclick=()=>start(active.id);
window.addEventListener('pagehide',stopVoice);shelf();
const params=new URLSearchParams(location.search);chooseLevel(params.get('level'));if(findStory(params.get('story')))start(params.get('story'));
