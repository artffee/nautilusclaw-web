const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname,'../auth.js'),'utf8');
async function fixture(fail=false) {
  let written;
  const original={kid:{name:'Test Explorer',age:'6-8'},progress:{history:[{role:'kid',text:'Test question'}],xp:3},concerns:[{text:'Test flag'}]};
  const sb={auth:{getSession:async()=>({data:{session:{user:{id:'parent-1',email:'test@example.invalid'},access_token:'test-only'}}}),onAuthStateChange:()=>{}},from:()=>({select:()=>({eq:()=>({single:async()=>({data:{name:'Test Parent',state:original}})})}),update:payload=>({eq:(key,id)=>({select:async()=>{assert.equal(key,'id');assert.equal(id,'parent-1');written=payload;return fail?{error:{message:'Test database failure'},data:null}:{error:null,data:[{id}]};}})})})};
  const context={window:{SUPABASE_CONFIG:{url:'https://example.invalid',anonKey:'test'},supabase:{createClient:()=>sb}},console,setTimeout,clearTimeout,URL};
  vm.runInNewContext(source,context);await new Promise(setImmediate);
  return {auth:context.window.NautilusAuth,written:()=>written};
}
test('clearing learning data waits for a confirmed database update and keeps sign-in identity',async()=>{
 const f=await fixture();await f.auth.clearLearningData();const u=f.auth.currentUser();
 assert.equal(u.email,'test@example.invalid');assert.equal(u.parentName,'Test Parent');assert.equal(u.kid,null);assert.equal(u.progress.history.length,0);assert.equal(u.concerns.length,0);assert.equal(f.written().state.progress.xp,0);
});
test('database failure rejects the clear operation and preserves the in-memory record',async()=>{
 const f=await fixture(true);await assert.rejects(f.auth.clearLearningData(),/Could not confirm/);assert.equal(f.auth.currentUser().progress.history.length,1);assert.equal(f.auth.currentUser().kid.name,'Test Explorer');
});
