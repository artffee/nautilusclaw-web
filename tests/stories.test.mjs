import test from 'node:test';
import assert from 'node:assert/strict';
import {STORIES,LEVELS,findStory,reading,puzzleAnswer,storyTranscript} from '../story-data.mjs';

test('every world and age level has a complete, distinct path through each ending',()=>{
  assert.equal(new Set(STORIES.map(s=>s.id)).size,4);
  const completeStories=new Set();
  for(const s of STORIES){
    assert(s.activity&&s.reflect&&s.blurb);assert.equal(s.routes.length,2);assert.equal(s.endings.length,2);
    for(const age of Object.keys(LEVELS)){
      const versions=new Set();
      for(let route=0;route<2;route++)for(let ending=0;ending<2;ending++){
        const parts=storyTranscript(s,age,route,ending);assert.equal(parts.length,4);
        for(const part of parts){assert.equal(typeof part,'string');assert(part.length>60);assert(!part.includes('undefined'));}
        const text=parts.join('\n');versions.add(text);completeStories.add(text);
      }
      assert.equal(versions.size,4);
    }
    assert(reading(s.opening,'3-5').length<reading(s.opening,'6-8').length);
    assert(reading(s.opening,'6-8').length<reading(s.opening,'9-12').length);
  }
  assert.equal(completeStories.size,48);
});
test('story puzzles have one correct answer and exact, age-appropriate arithmetic',()=>{
  for(const s of STORIES)for(const [age,q] of Object.entries(s.puzzles)){
    const answer=puzzleAnswer(q);assert(Number.isInteger(answer)&&answer>=0);
    assert.equal(new Set(q.choices).size,3);assert.equal(q.choices.filter(x=>x===answer).length,1);
    assert(q.hint&&q.why&&q.prompt);
    if(age==='3-5'){assert(q.a<=5&&q.b<=5&&answer<=5);assert(['+','−'].includes(q.op));}
    if(age==='6-8')assert(answer<=20);
    if(age==='9-12')assert(['×','÷'].includes(q.op));
  }
});
test('unknown URL selections cannot resolve a story or arbitrary content',()=>{
  for(const value of [null,'unknown','__proto__','constructor','<script>'])assert.equal(findStory(value),null);
  assert.equal(reading(STORIES[0].opening,'unknown'),STORIES[0].opening['6-8']);
  assert.throws(()=>storyTranscript(STORIES[0],'6-8',5,0));
  assert.throws(()=>storyTranscript(STORIES[0],'6-8',0,5));
});
