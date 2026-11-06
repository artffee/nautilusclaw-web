import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,LETTERS,mathRound,letterDeck,patternRound} from '../learning-core.mjs';
function rng(seed){seed=Math.imul(seed,99173)>>>0;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function choices(q){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.equal(q.choices.filter(x=>x===q.answer).length,1);}
test('math rounds have correct arithmetic, valid distractors and age-appropriate ranges',()=>{
  for(const level of Object.keys(LEVELS))for(let seed=1;seed<=150;seed++)for(let i=0;i<5;i++){
    const q=mathRound(level,i,rng(seed*13+i));choices(q);
    assert(q.choices.every(x=>Number.isInteger(x)&&x>=0));
    const expected={count:q.a,add:q.a+q.b,subtract:q.a-q.b,multiply:q.a*q.b,divide:q.a/q.b}[q.kind];
    assert.equal(q.answer,expected);assert(Number.isInteger(q.answer));
    if(level==='3-5')assert(q.answer>=1&&q.answer<=(i<2?5:10));
    if(level==='6-8')assert(q.answer>=0&&q.answer<=20);
    if(level==='9-12')assert(q.answer>=2&&q.answer<=81);
    if(q.visual?.kind==='subtract')assert(q.visual.b<=q.visual.a);
  }
});
test('the alphabet covers every letter once and words match their displayed first letter',()=>{
  assert.equal(LETTERS.map(x=>x.letter).join(''),'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  for(const x of LETTERS){assert.equal(x.word[0].toUpperCase(),x.letter);assert(x.icon);}
});
test('letter rounds have one correct choice and spelling tiles can reconstruct repeated-letter words',()=>{
  const seen=new Set();
  for(let seed=1;seed<=100;seed++)for(const level of Object.keys(LEVELS)){
    const deck=letterDeck(level,rng(seed));assert.equal(deck.length,5);assert.equal(new Set(deck.map(q=>q.word)).size,5);
    for(const q of deck){if(q.kind==='spell'){
      assert.deepEqual([...q.tiles].sort(),[...q.word].sort());assert.notEqual(q.tiles.join(''),q.word);assert.equal(q.answer,q.word);seen.add(q.word);
    }else{choices(q);assert.equal(q.answer,q.word[0].toUpperCase());}}
  }
  for(const word of ['shell','moon','reef'])assert(seen.has(word));
});
test('shape and number patterns always follow the demonstrated rule',()=>{
  for(let seed=1;seed<=100;seed++)for(const level of Object.keys(LEVELS))for(let i=0;i<5;i++){
    const q=patternRound(level,i,rng(seed+i));choices(q);
    if(q.kind==='numbers'){
      const nums=q.sequence.map(Number),step=nums[1]-nums[0];assert(step>=2&&step<=9);
      for(let n=1;n<nums.length;n++)assert.equal(nums[n]-nums[n-1],step);
      assert.equal(q.answer,nums.at(-1)+step);
    }else{
      const period=level==='3-5'?2:3;
      q.sequence.forEach((x,n)=>assert.equal(x,q.sequence[n%period]));
      assert.equal(q.answer,q.sequence[q.sequence.length%period]);
      assert(q.choices.every(x=>q.labels[x]));
    }
  }
});
