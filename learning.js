import {LEVELS,LETTERS,mathRound,letterDeck,patternRound} from './learning-core.mjs';
const $=id=>document.getElementById(id);
const games={math:'Math reef',alphabet:'Alphabet garden',letters:'Letter detective',patterns:'Pattern lagoon'};
let level='6-8',game=null,round=0,questions=[],solved=false,selected=[],letterIndex=0;
const speechAvailable='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stopVoice=()=>{if(speechAvailable)window.speechSynthesis.cancel();};
function say(text){
  if(!speechAvailable)return;
  stopVoice();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=.8;
  utterance.onerror=()=>{if($('voiceStatus'))$('voiceStatus').textContent='Read-aloud is unavailable right now. You can still play with the words on screen.';};
  window.speechSynthesis.speak(utterance);
}
const voiceButton=()=>speechAvailable?'<button type="button" class="hear-button" id="hear">◖ Hear it</button>':'';
const voiceNote=()=>'<p id="voiceStatus" class="voice-note" role="status">'+(speechAvailable?'Optional read-aloud uses your browser voice. No microphone needed.':'Read-aloud is not available in this browser. The words are all on screen.')+'</p>';
function focusHeading(){const h=$('gameStage').querySelector('h2');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true});} $('playArea').scrollIntoView({block:'start',behavior:'auto'});}
function setLevel(value){
  if(!LEVELS[value])return;level=value;
  document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===level)));
  $('levelDescription').textContent=LEVELS[level].description;
  $('mathDescription').textContent=level==='3-5'?'Tap and count a little collection of shells.':level==='9-12'?'Multiply and divide with friendly number puzzles.':'Add and subtract with dots to help.';
  $('letterDescription').textContent=level==='3-5'?'Match big letters with their little partners.':level==='9-12'?'Put the letter tiles in order to build a word.':'Find the first letter of a picture word.';
  $('letterGameTitle').textContent=level==='9-12'?'Word builder':'Letter detective';
  $('patternDescription').textContent=level==='9-12'?'Find the rule in a number sequence. What comes next?':'Look for the repeating shapes. What comes next?';
}
function updateURL(){const url=new URL(window.location.href);url.search='';if(game){url.searchParams.set('game',game);url.searchParams.set('level',level);}history.replaceState(null,'',url);}
function library(){stopVoice();$('library').hidden=false;$('playArea').hidden=true;const previous=game;game=null;updateURL();document.querySelector(`[data-game="${previous||'math'}"]`).focus({preventScroll:true});$('pickTitle').scrollIntoView({block:'center'});}
function start(name){
  if(!Object.hasOwn(games,name))return;stopVoice();game=name;round=0;letterIndex=0;
  questions=name==='letters'?letterDeck(level):Array.from({length:5},(_,i)=>name==='patterns'?patternRound(level,i):mathRound(level,i));
  $('library').hidden=true;$('playArea').hidden=false;$('activeLevel').textContent=`${LEVELS[level].name} · Ages ${level.replace('-','–')}`;
  $('restartGame').hidden=name==='alphabet';updateURL();render();focusHeading();
}
function progress(){return `<div class="puzzle-top"><span class="eyebrow">${escape(game==='letters'&&level==='9-12'?'Word builder':games[game])} · ${round+1} of 5</span><div class="shell-progress" role="img" aria-label="${round} of 5 puzzles completed">${Array.from({length:5},(_,i)=>`<span class="${i<round?'earned':''}"></span>`).join('')}</div></div>`;}
const dots=(n,removed=0)=>Array.from({length:n},(_,i)=>`<span class="count-dot ${i>=n-removed?'removed':''}">${i>=n-removed?'×':''}</span>`).join('');
function mathVisual(q){
  const v=q.visual;if(!v)return '<div class="math-visual" aria-hidden="true"><span class="clue-icon">🐚</span><span>Equal shares for everyone.</span></div>';
  if(v.kind==='count')return `<div class="math-visual"><div class="count-shells" role="group" aria-label="Shells to count; tap each one to mark it">${Array.from({length:v.count},(_,i)=>`<button type="button" class="count-shell" data-shell="${i}" aria-label="Shell ${i+1}" aria-pressed="false"><span aria-hidden="true">🐚</span><small aria-hidden="true">tap</small></button>`).join('')}</div></div>`;
  if(v.kind==='groups')return `<div class="math-visual" role="img" aria-label="${q.a} groups, each containing ${q.b} dots">${Array.from({length:v.count},()=>`<span class="group-pod" aria-hidden="true">${dots(v.each)}</span>`).join('')}</div>`;
  return `<div class="math-visual" role="img" aria-label="${v.a} dots ${v.kind==='add'?`plus ${v.b} more dots`:`with ${v.b} crossed out`}"><div class="dot-group" aria-hidden="true">${dots(v.a,v.kind==='subtract'?v.b:0)}</div>${v.kind==='add'?`<span class="visual-symbol" aria-hidden="true">+</span><div class="dot-group" aria-hidden="true">${dots(v.b)}</div>`:''}</div>`;
}
function clue(q){
  if(game==='math')return mathVisual(q);
  if(game==='patterns')return `<div class="sequence-row" role="img" aria-label="${q.sequence.map(x=>q.labels?.[x]||x).join(', ')}, then a missing item">${q.sequence.map(x=>`<span aria-hidden="true">${escape(x)}</span>`).join('')}<span class="missing" aria-hidden="true">?</span></div>`;
  if(q.kind==='match')return `<div class="letter-clue"><span class="big-letter" aria-label="Capital ${q.letter}">${q.letter}</span></div>`;
  return `<div class="letter-clue"><span class="clue-icon" role="img" aria-label="${escape(q.word)}">${q.icon}</span>${q.kind==='initial'?`<span class="word-gap" aria-label="${q.word} with the first letter missing">_${escape(q.word.slice(1))}</span>`:'<p class="fine" style="margin:8px 0 0">Tap the letter tiles in the right order.</p>'}</div>`;
}
function choices(q){
  if(q.kind==='spell')return `<div class="word-slots" id="wordSlots" role="status" aria-label="Your word">${[...q.word].map(()=>'<span class="word-slot">·</span>').join('')}</div><div class="tile-bank" role="group" aria-label="Letter tiles">${q.tiles.map((l,i)=>`<button type="button" class="letter-tile" data-tile="${i}" aria-label="Letter ${l}, tile ${i+1}">${l}</button>`).join('')}</div><div class="word-tools"><button type="button" class="hint-button" id="undo">← Undo letter</button><button type="button" class="hint-button" id="clearWord">Clear word</button></div>`;
  return `<div class="answer-grid" role="group" aria-label="Choose your answer">${q.choices.map(c=>`<button type="button" class="answer-button" data-choice="${escape(c)}" ${q.labels?`aria-label="${q.labels[c]}"`:''}>${escape(q.kind==='match'?c.toLowerCase():c)}</button>`).join('')}</div>`;
}
function render(){
  stopVoice();if(game==='alphabet'){renderAlphabet();return;}if(round===5){complete();return;}
  solved=false;selected=[];const q=questions[round];
  $('gameStage').innerHTML=`<article class="puzzle-card">${progress()}<h2>${escape(q.prompt)}</h2>${clue(q)}${choices(q)}<div class="feedback" id="feedback" role="status" aria-live="polite"></div><div class="puzzle-actions"><div class="actions"><button type="button" class="hint-button" id="hint">A little hint ✦</button>${voiceButton()}</div><button type="button" class="button coral" id="nextPuzzle" disabled>${round===4?'Finish & celebrate ↗':'Next little puzzle →'}</button></div>${voiceNote()}</article>`;
  document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>answer(b.dataset.choice,b)));
  document.querySelectorAll('[data-shell]').forEach(b=>b.addEventListener('click',()=>{const marked=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(marked));b.querySelector('small').textContent=marked?'✓':'tap';}));
  document.querySelectorAll('[data-tile]').forEach(b=>b.addEventListener('click',()=>{if(solved||selected.includes(Number(b.dataset.tile)))return;selected.push(Number(b.dataset.tile));updateWord();}));
  if($('undo')){$('undo').addEventListener('click',()=>{if(!solved){selected.pop();updateWord();feedback('Try the letter tiles again.');}});$('clearWord').addEventListener('click',()=>{if(!solved){selected=[];updateWord();feedback('A fresh start. You can do it.');}});updateWord();}
  $('hint').addEventListener('click',()=>feedback(q.hint,true));
  if($('hear'))$('hear').addEventListener('click',()=>say(q.kind==='spell'?`Build the word ${q.word}.`:q.kind==='match'?`Find the little letter for capital ${q.letter}.`:q.prompt.replace('×',' times ').replace('÷',' divided by ').replace('−',' minus ').replace('=',' equals ').replace('?', '')));
  $('nextPuzzle').addEventListener('click',()=>{if(!solved)return;round++;render();focusHeading();});
}
function feedback(text,tryAgain=false){$('feedback').textContent=text;$('feedback').className='feedback'+(tryAgain?' try':'');}
function answer(value,button){
  if(solved)return;const q=questions[round];
  if(String(value)!==String(q.answer)){if(button){button.classList.add('retry');button.disabled=true;}feedback('Not quite yet. '+q.hint,true);return;}
  solved=true;if(button)button.classList.add('correct');
  document.querySelectorAll('[data-choice],[data-tile]').forEach(b=>{b.disabled=true;});
  if($('undo')){$('undo').disabled=true;$('clearWord').disabled=true;}
  $('hint').disabled=true;$('nextPuzzle').disabled=false;feedback('You did it! '+q.explanation);
  const beads=$('gameStage').querySelectorAll('.shell-progress span');beads[round].classList.add('earned');$('gameStage').querySelector('.shell-progress').setAttribute('aria-label',`${round+1} of 5 puzzles completed`);
}
function updateWord(){
  const q=questions[round];if(q.kind!=='spell')return;
  $('wordSlots').innerHTML=[...q.word].map((_,i)=>`<span class="word-slot">${selected[i]===undefined?'·':q.tiles[selected[i]]}</span>`).join('');
  $('wordSlots').setAttribute('aria-label',selected.length?`Your word: ${selected.map(i=>q.tiles[i]).join(', ')}`:'Your word is empty');
  document.querySelectorAll('[data-tile]').forEach(b=>{b.disabled=selected.includes(Number(b.dataset.tile));});
  $('undo').disabled=selected.length===0;$('clearWord').disabled=selected.length===0;
  if(selected.length===q.tiles.length){const word=selected.map(i=>q.tiles[i]).join('');if(word===q.word)answer(word);else feedback('Almost! Use Undo or Clear word to try again. '+q.hint,true);}
}
function renderAlphabet(){
  const item=LETTERS[letterIndex];
  $('gameStage').innerHTML=`<article class="alphabet-card-full"><span class="eyebrow">A–Z / BIG LETTERS, LITTLE LETTERS</span><h2 class="alphabet-heading">Alphabet garden</h2><p class="alphabet-intro">Pick a letter. Say its name. Find something that starts with it.</p><div class="alphabet-layout"><div><div class="letter-poster" aria-live="polite"><div class="letter-pair" aria-label="Capital ${item.letter}, lowercase ${item.letter}">${item.letter}<span>${item.letter.toLowerCase()}</span></div><div class="poster-icon" aria-hidden="true">${item.icon}</div><h3>${item.letter} is for ${item.word}.</h3>${voiceButton()}</div><div class="poster-controls"><button type="button" id="previousLetter" aria-label="Previous letter">←</button><span>${letterIndex+1} of 26 letters</span><button type="button" id="nextLetter" aria-label="Next letter">→</button></div></div><div class="alphabet-grid" role="group" aria-label="Choose a letter">${LETTERS.map((l,i)=>`<button type="button" class="letter-pick" data-letter="${i}" aria-label="Letter ${l.letter}" aria-pressed="${i===letterIndex}">${l.letter}<small aria-hidden="true">${l.letter.toLowerCase()}</small></button>`).join('')}</div></div><div class="alphabet-footer"><p>Try it off-screen: draw a big ${item.letter} and a little ${item.letter.toLowerCase()} with your finger in the air.</p><button type="button" class="button light" id="tryLetters">Play a letter game ↗</button></div>${voiceNote()}</article>`;
  const choose=(n,focus)=>{stopVoice();letterIndex=(n+26)%26;renderAlphabet();const target=focus==='grid'?document.querySelector(`[data-letter="${letterIndex}"]`):$(focus);target?.focus({preventScroll:true});};
  document.querySelectorAll('[data-letter]').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.letter),'grid')));
  $('previousLetter').addEventListener('click',()=>choose(letterIndex-1,'previousLetter'));
  $('nextLetter').addEventListener('click',()=>choose(letterIndex+1,'nextLetter'));
  if($('hear'))$('hear').addEventListener('click',()=>say(`The letter ${item.letter}. ${item.letter} is for ${item.word}.`));
  $('tryLetters').addEventListener('click',()=>{start('letters');});
}
function complete(){
  const topic=game==='math'?(level==='3-5'?'counting':level==='9-12'?'multiplication and division':'addition and subtraction'):game==='patterns'?'patterns':level==='9-12'?'word building':'letters';
  const offline=game==='math'?'Count five things around you. Try sharing them between two pretend sea creatures. Do you have any left over?':game==='patterns'?'Make a repeating pattern with claps and taps. Ask a grown-up to continue it.':'Choose a letter and find three things that begin with it. Draw your favorite one.';
  $('gameStage').innerHTML=`<article class="puzzle-card completion"><div class="confetti-row" aria-hidden="true">✦ · ✧ · ✦</div><span class="completed-badge" aria-hidden="true">🐚</span><span class="eyebrow">FIVE LITTLE DISCOVERIES</span><h2>Look how much<br>you <em>explored.</em></h2><p>You finished five ${topic} puzzles. Every try helped you learn.</p><div class="notice"><strong>Now for a little off-screen adventure.</strong><br>${offline}</div><div class="actions"><button type="button" class="button coral" id="morePuzzles">Five new puzzles ↻</button><button type="button" class="button light" id="chooseGame">Choose another game →</button></div></article>`;
  $('morePuzzles').addEventListener('click',()=>start(game));$('chooseGame').addEventListener('click',library);
}
document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>setLevel(b.dataset.level)));
document.querySelectorAll('[data-game]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.game)));
$('allGames').addEventListener('click',library);$('restartGame').addEventListener('click',()=>start(game));
window.addEventListener('pagehide',stopVoice);
const params=new URLSearchParams(location.search);setLevel(params.get('level')||'6-8');if(Object.hasOwn(games,params.get('game')))start(params.get('game'));
