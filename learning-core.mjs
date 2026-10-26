// Written learning content. No accounts, analytics, or remote generation.
export const LEVELS = {
  '3-5': {name: 'Little explorer', description: 'Count, match letters, and spot shapes.'},
  '6-8': {name: 'Explorer', description: 'Add, subtract, and discover beginning letters.'},
  '9-12': {name: 'Deep diver', description: 'Multiply, divide, and build words.'},
};
export const LETTERS = [
  ['A','apple','🍎'],['B','boat','⛵'],['C','crab','🦀'],['D','dolphin','🐬'],
  ['E','egg','🥚'],['F','fish','🐟'],['G','grapes','🍇'],['H','hat','🎩'],
  ['I','igloo','🧊'],['J','jellyfish','🪼'],['K','kite','🪁'],['L','leaf','🍃'],
  ['M','moon','🌙'],['N','nest','🪺'],['O','octopus','🐙'],['P','penguin','🐧'],
  ['Q','queen','👑'],['R','rainbow','🌈'],['S','sun','☀️'],['T','turtle','🐢'],
  ['U','umbrella','☂️'],['V','volcano','🌋'],['W','whale','🐋'],['X','xylophone','🎵'],
  ['Y','yo-yo','🪀'],['Z','zebra','🦓'],
].map(([letter,word,icon])=>({letter,word,icon}));
export const WORDS = [
  ['fish','🐟'],['crab','🦀'],['shell','🐚'],['coral','🪸'],['whale','🐋'],
  ['boat','⛵'],['moon','🌙'],['star','⭐'],['wave','🌊'],['reef','🪸'],
].map(([word,icon])=>({word,icon}));
export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i=result.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
const int=(lo,hi,r)=>lo+Math.floor(r()*(hi-lo+1));
export function numberChoices(answer, random=Math.random) {
  const values = new Set([answer]);
  for (const offset of shuffle([-2,-1,1,2,3],random)) {
    if(answer+offset>=0) values.add(answer+offset);
    if(values.size===4) break;
  }
  return shuffle([...values],random);
}
export function mathRound(level, round=0, random=Math.random) {
  let q;
  if(level==='3-5') {
    const n=int(1,round<2?5:10,random);
    q={kind:'count',a:n,b:0,answer:n,prompt:'How many shells can you find?',
      hint:'Touch each shell once. Say one number for each shell as you count.',
      explanation:`You found ${n} ${n===1?'shell':'shells'}!`,visual:{kind:'count',count:n}};
  } else if(level==='9-12') {
    const a=int(2,9,random),b=int(2,9,random);
    if(round%2===0) q={kind:'multiply',a,b,answer:a*b,prompt:`${a} × ${b} = ?`,
      hint:`Think of ${a} equal groups of ${b}. Add ${b}, ${a} times.`,
      explanation:`${a} groups of ${b} make ${a*b}. ${a} × ${b} = ${a*b}.`,visual:{kind:'groups',count:a,each:b}};
    else q={kind:'divide',a:a*b,b,answer:a,prompt:`${a*b} ÷ ${b} = ?`,
      hint:`Share ${a*b} shells equally between ${b} groups. How many go in each group?`,
      explanation:`${a*b} ÷ ${b} = ${a}. Each of the ${b} groups gets ${a} shells.`,visual:null};
  } else {
    const a=int(2,10,random),b=int(1,10,random);
    if(round%2===0) q={kind:'add',a,b,answer:a+b,prompt:`${a} + ${b} = ?`,
      hint:`Start at ${a}. Count on ${b} more. The dots show both groups.`,
      explanation:`${a} and ${b} together make ${a+b}. ${a} + ${b} = ${a+b}.`,visual:{kind:'add',a,b}};
    else {const bigger=Math.max(a,b),smaller=Math.min(a,b);q={kind:'subtract',a:bigger,b:smaller,answer:bigger-smaller,prompt:`${bigger} − ${smaller} = ?`,
      hint:`Start with ${bigger} dots. Take away the ${smaller} crossed-out dots. Count what is left.`,
      explanation:`${bigger} − ${smaller} = ${bigger-smaller}. ${bigger-smaller===0?'None are left.':'That is how many are left.'}`,visual:{kind:'subtract',a:bigger,b:smaller}};}
  }
  return {...q,choices:numberChoices(q.answer,random)};
}
export function letterDeck(level, random=Math.random) {
  if(level==='9-12') return shuffle(WORDS,random).slice(0,5).map(x=>{
    let tiles=shuffle([...x.word],random);
    if(tiles.join('')===x.word) tiles=[...tiles.slice(1),tiles[0]];
    return {kind:'spell',...x,answer:x.word,tiles,prompt:'Build the word.',hint:`The word is ${x.word}. Try saying each letter: ${[...x.word].join(', ')}.`,explanation:`You built ${x.word}!`};
  });
  return shuffle(LETTERS.filter(x=>level==='3-5'||!['X','Q'].includes(x.letter)),random).slice(0,5).map(x=>{
    const choices=shuffle([x.letter,...shuffle(LETTERS.filter(y=>y.letter!==x.letter).map(y=>y.letter),random).slice(0,3)],random);
    return {kind:level==='3-5'?'match':'initial',...x,answer:x.letter,choices,
      prompt:level==='3-5'?'Find the matching little letter.':`Which letter begins “${x.word}”?`,
      hint:`${x.letter} and ${x.letter.toLowerCase()} are the same letter. ${x.letter} is for ${x.word}.`,
      explanation:level==='3-5'?`${x.letter} and ${x.letter.toLowerCase()} are a pair!`:`${x.word} starts with ${x.letter}.`};
  });
}
const SHAPES=[['●','circle'],['▲','triangle'],['★','star'],['◆','diamond']];
export function patternRound(level, round=0, random=Math.random) {
  if(level==='9-12') {
    const start=int(1,12,random),step=int(2,9,random),answer=start+step*4;
    return {kind:'numbers',answer,sequence:Array.from({length:4},(_,i)=>String(start+step*i)),choices:numberChoices(answer,random),
      prompt:'What number comes next?',hint:`Add ${step} each time.`,explanation:`The rule is “add ${step}.” ${start+step*3} + ${step} = ${answer}.`};
  }
  const shapes=shuffle(SHAPES,random),pattern=level==='3-5'?[0,1]:round%2?[0,1,2]:[0,1,1];
  const length=level==='3-5'?5:7,answer=shapes[pattern[length%pattern.length]][0];
  return {kind:'shapes',answer,sequence:Array.from({length},(_,i)=>shapes[pattern[i%pattern.length]][0]),choices:shuffle(SHAPES.map(x=>x[0]),random),
    prompt:'What shape comes next?',labels:Object.fromEntries(SHAPES),
    hint:`The pattern repeats: ${pattern.map(i=>shapes[i][1]).join(', ')}.`,
    explanation:`A ${Object.fromEntries(SHAPES)[answer]} comes next. You spotted the repeating pattern!`};
}
