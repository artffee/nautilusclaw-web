import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {levels,newResults,answerCamouflage,answerCounting,makeRecap,validRecap,recapMarkup,makeStory,companionPhrase,readRecap,writeRecap,removeRecap,hasSession,SESSION_KEY,SAVED_KEY} from '../reef-recap.mjs';
const complete=(age='6-8')=>{const r=newResults();answerCamouflage(r,0);answerCounting(r,age,levels[age].right);return r;};
test('recaps record actual answers and each displayed counting hint for all age bands',()=>{
 for(const age of Object.keys(levels)){
  const r=newResults(),d=levels[age];
  answerCamouflage(r,1);answerCamouflage(r,0);
  const wrong=(d.right+1)%3;answerCounting(r,age,wrong);answerCounting(r,age,wrong);
  assert.equal(makeRecap(age,'octopus','kelp forest',r),null);
  answerCounting(r,age,d.right);
  const report=makeRecap(age,'octopus','kelp forest',r);
  assert.equal(validRecap(report),true);assert.equal(report.results.counting.hintsUsed,2);
  assert.deepEqual(report.results.camouflage.answers,[1,0]);
  assert.deepEqual(report.results.counting.answers,[wrong,wrong,d.right]);
  const markup=recapMarkup(report);
  assert.ok(markup.includes(d.question));assert.ok(markup.includes('Hints used:</strong> 2'));
  assert.ok(markup.includes('To grow more arms → To be harder to spot'));
  answerCounting(r,age,wrong);assert.equal(r.counting.hintsUsed,2);
 }
});
test('one correct try requires no hint and starting again isolates results',()=>{
 const r=complete(),report=makeRecap('6-8','turtle','coral garden',r);
 assert.equal(report.results.counting.hintsUsed,0);assert.equal(report.results.counting.answers.length,1);
 r.counting.answers.push(0);assert.equal(report.results.counting.answers.length,1);
 assert.deepEqual(newResults().counting,{answers:[],correct:false,hintsUsed:0});
 assert.equal(makeRecap('6-8','turtle','coral garden',newResults()),null);
});
test('stored recaps reject malformed, incomplete or inconsistent records',()=>{
 const report=makeRecap('6-8','crab','sunlit shallows',complete());
 for(const patch of [{ageBand:'12-18'},{character:'<img onerror=alert(1)>'},{destination:'elsewhere'},{completedAt:'bad'},{version:9},{results:{}}])assert.equal(validRecap({...report,...patch}),false);
 const bad=structuredClone(report);bad.results.counting.hintsUsed=4;assert.equal(validRecap(bad),false);
 const invalid=structuredClone(report);invalid.results.counting.answers=[-1,2];invalid.results.counting.hintsUsed=1;assert.equal(validRecap(invalid),false);
});
test('all nine story combinations use the correct article and choice',()=>{
 for(const character of ['octopus','turtle','crab'])for(const place of ['kelp forest','coral garden','sunlit shallows']){
  const story=makeStory(character,place),report=makeRecap('6-8',character,place,complete());
  assert.ok(story.includes(`explored the ${place}.`));assert.doesNotMatch(story,/\ba octopus\b|\ban (?:turtle|crab|observant)\b(?! octopus)/);
  assert.equal(companionPhrase(character),`${character==='octopus'?'an':'a'} ${character}`);
  assert.ok(recapMarkup(report).includes(companionPhrase(character)));
 }
});
test('session and opt-in permanent storage are separate and storage failures are handled',()=>{
 const maps={session:new Map(),saved:new Map()};
 const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)});
 const session=()=>storage(maps.session),saved=()=>storage(maps.saved),r=makeRecap('6-8','turtle','coral garden',complete());
 assert.equal(writeRecap(session,SESSION_KEY,r),true);assert.equal(hasSession(session),true);
 assert.deepEqual(readRecap(session,SESSION_KEY),r);assert.equal(readRecap(saved,SAVED_KEY),null);
 writeRecap(saved,SAVED_KEY,r);writeRecap(session,SESSION_KEY,{inProgress:true});assert.equal(readRecap(session,SESSION_KEY),null);assert.deepEqual(readRecap(saved,SAVED_KEY),r);
 assert.equal(removeRecap(saved,SAVED_KEY),true);assert.equal(readRecap(saved,SAVED_KEY),null);
 const blocked=()=>{throw Error('Storage blocked');};
 assert.equal(writeRecap(blocked,SESSION_KEY,r),false);assert.equal(readRecap(blocked,SESSION_KEY),null);assert.equal(removeRecap(blocked,SESSION_KEY),false);
});
test('legacy saved records are honest about missing results and sample cannot read storage',()=>{
 const r={...makeRecap('6-8','octopus','kelp forest',complete()),version:1};delete r.results;
 assert.ok(recapMarkup(r).includes('did not record the result or hints'));
 const parent=readFileSync(new URL('../parent-view.js',import.meta.url),'utf8');assert.doesNotMatch(parent,/localStorage|sessionStorage|demo.*===.*1/);
 const app=readFileSync(new URL('../adventure.js',import.meta.url),'utf8');assert.ok(app.includes('href="/recap"'));assert.ok(app.includes("'hidden disabled'"));assert.doesNotMatch(app,/href="\/parent-preview"/);
});
test('coral text contrast exceeds AA in default and hover states',()=>{
 const css=readFileSync(new URL('../ocean.css',import.meta.url),'utf8');
 const colors=[css.match(/--coral:(#[0-9a-f]{6})/)[1],css.match(/\.button\.coral:hover\{background:(#[0-9a-f]{6})/)[1]];
 const luminance=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 for(const color of colors)assert.ok(1.05/(luminance(color)+.05)>=4.5,color);
});
