export const levels={
    '3-5':{label:'Little explorer',fact:'An octopus can change its color to blend in with the things around it. That helps it hide. Can you point to something green nearby?',question:'Two little fish meet one more fish. How many fish are there now?',answers:['2 fish','3 fish','4 fish'],right:1,hint:'Count together: one, two… then one more!',why:'Two and one make three. You found the whole little school of fish!',activity:'Draw an octopus. Color it to match a place in your drawing.'},
    '6-8':{label:'Explorer',fact:'An octopus has tiny color-changing structures in its skin called chromatophores. Changing its color and skin texture can help it blend into the reef. Blending in is called camouflage.',question:'There are 4 fish by a rock. Another 3 swim over. How many fish are together?',answers:['6 fish','8 fish','7 fish'],right:2,hint:'Start with four, then count three more: five, six…',why:'4 + 3 = 7. You counted a whole school of seven fish!',activity:'Draw a reef with seven fish and a camouflaged octopus. Ask a grown-up to find it.'},
    '9-12':{label:'Deep diver',fact:'An octopus changes the appearance of its skin using pigment-containing chromatophores and other structures that reflect light. It can also change skin texture. Camouflage can help it avoid predators or approach prey.',question:'You spot 3 groups of fish, with 4 fish in each group. How many fish did you count?',answers:['12 fish','7 fish','16 fish'],right:0,hint:'Try repeated addition: 4 + 4 + 4.',why:'3 × 4 = 12. Repeated addition and multiplication describe the same groups.',activity:'Design a camouflaged sea creature. Label two adaptations and explain how each one helps it survive.'}
  };

export const SESSION_KEY='nautilus-reef-session-v2';
export const SAVED_KEY='nautilus-reef-recap-v1';
export const companions={octopus:'an observant octopus',turtle:'a patient sea turtle',crab:'a brave little crab'};
export const destinations=['kelp forest','coral garden','sunlit shallows'];
export const camouflageAnswers=['To be harder to spot','To grow more arms'];
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const companionPhrase=name=>`${/^[aeiou]/i.test(name)?'an':'a'} ${name}`;
export function newResults(){return {camouflage:{answers:[],correct:false},counting:{answers:[],correct:false,hintsUsed:0}};}
export function answerCamouflage(results,index){
  if(results.camouflage.correct||![0,1].includes(index))return false;
  results.camouflage.answers.push(index);results.camouflage.correct=index===0;
  return results.camouflage.correct;
}
export function answerCounting(results,age,index){
  const d=levels[age];if(!d||results.counting.correct||!Number.isInteger(index)||!d.answers[index])return false;
  results.counting.answers.push(index);results.counting.correct=index===d.right;
  if(!results.counting.correct)results.counting.hintsUsed++;
  return results.counting.correct;
}
export function makeStory(character,destination){
  const place={'kelp forest':'tall ribbons of kelp swayed in the current','coral garden':'small fish darted between coral branches','sunlit shallows':'sunlight made moving patterns on the sand'}[destination];
  return `Nautilus and ${companions[character]} explored the ${destination}. Around them, ${place}. A tiny fish was looking for its school. They paused, looked carefully, and counted the fish nearby. Together they helped the little fish find its friends. Then Nautilus noticed a shape almost hidden against a rock. Was it a rock—or an octopus in camouflage? What would you do next?`;
}
export function makeRecap(age,character,destination,results,completedAt=new Date().toISOString()){
  if(!levels[age]||!Object.hasOwn(companions,character)||!destinations.includes(destination)||!results.camouflage.correct||!results.counting.correct)return null;
  return {version:2,completedAt,ageBand:age,mission:'The Curious Reef',character,destination,
    topics:['Animal camouflage',age==='9-12'?'Multiplication':'Counting and addition','Storytelling'],
    story:makeStory(character,destination),activity:levels[age].activity,
    results:JSON.parse(JSON.stringify(results))};
}
export function validRecap(r){
  if(!r||!levels[r.ageBand]||!Object.hasOwn(companions,r.character)||!destinations.includes(r.destination)||!Number.isFinite(Date.parse(r.completedAt)))return false;
  if(r.version===1)return typeof r.story==='string'&&Array.isArray(r.topics);
  if(r.version!==2)return false;
  const c=r.results?.camouflage,n=r.results?.counting,d=levels[r.ageBand];
  return !!(c?.correct===true&&n?.correct===true&&Array.isArray(c.answers)&&c.answers.length&&c.answers.every((v,i)=>v===(i===c.answers.length-1?0:1))&&Array.isArray(n.answers)&&n.answers.length&&n.answers.every((v,i)=>Number.isInteger(v)&&v>=0&&v<3&&(i===n.answers.length-1?v===d.right:v!==d.right))&&n.hintsUsed===n.answers.length-1);
}
// Storage can be unavailable (private browsing, policy, quota). Never fall back to a server.
export function readRecap(storage,key){try{const r=JSON.parse(storage().getItem(key));return validRecap(r)?r:null;}catch{return null;}}
export function writeRecap(storage,key,value){try{storage().setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export function removeRecap(storage,key){try{storage().removeItem(key);return true;}catch{return false;}}
export function hasSession(storage){try{return storage().getItem(SESSION_KEY)!==null;}catch{return false;}}
export function recapMarkup(r){
  if(!validRecap(r))return '';
  const esc=escapeHTML,d=levels[r.ageBand],c=r.results?.camouflage,n=r.results?.counting;
  const date=new Date(r.completedAt).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
  return `<section class="personal-recap" aria-label="Personal learning recap"><h2>Your Curious Reef recap</h2><p><strong>Age level:</strong> ${esc(r.ageBand.replace('-','–'))} · ${d.label}<br><strong>Completed:</strong> ${esc(date)}</p>
  <div class="two-col"><section class="card"><h3>Camouflage discovery</h3><p><strong>Question:</strong> Why might blending into the reef help an octopus?</p>${c?`<p><strong>${c.answers.length===1?'Answer chosen':'Answers chosen, in order'}:</strong> ${c.answers.map(i=>esc(camouflageAnswers[i])).join(' → ')}</p><p><strong>Result:</strong> Correct${c.answers.length>1?' after another look':''}.</p>`:'<p>This older saved recap did not record the answer.</p>'}</section>
  <section class="card"><h3>Counting puzzle</h3><p><strong>Question:</strong> ${esc(d.question)}</p>${n?`<p><strong>${n.answers.length===1?'Answer chosen':'Answers chosen, in order'}:</strong> ${n.answers.map(i=>esc(d.answers[i])).join(' → ')}</p><p><strong>Result:</strong> Correct · ${n.answers.length} ${n.answers.length===1?'try':'tries'}<br><strong>Hints used:</strong> ${n.hintsUsed}</p>`:'<p>This older saved recap did not record the result or hints.</p>'}</section></div>
  <section class="card recap-story"><h3>Your story choices</h3><p><strong>Companion:</strong> ${esc(companionPhrase(r.character))}<br><strong>Place:</strong> ${esc(r.destination)}</p><p>${esc(makeStory(r.character,r.destination))}</p></section><section class="notice"><h3>Keep exploring off-screen</h3><p>${esc(d.activity)}</p></section><p class="fine">Personal guest recap · Kept in this browser only · Not linked to an account</p></section>`;
}
