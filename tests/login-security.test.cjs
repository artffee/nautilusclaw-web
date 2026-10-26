const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../auth.js'),'utf8');
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
const session={user:{id:'test-parent-1',email:'qa@example.invalid'},access_token:'test-token-not-a-credential'};
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function fixture(options={}){
 let event,clientOptions,requests=[],writes=[],timerClears=0;
 const stored=new Map(), removed=[];
 const storage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>{removed.push(k);stored.delete(k);}};
 const sb={auth:{getSession:()=>options.initial||Promise.resolve({data:{session:options.session||null}}),onAuthStateChange:fn=>event=fn,
 signInWithPassword:async args=>{requests.push(['signin',args]);return options.signin||{data:{session}};},
 signUp:async args=>{requests.push(['signup',args]);return options.signup||{data:{session:null}};},
 signOut:async args=>{requests.push(['signout',args]);return {error:options.logoutError};}, stopAutoRefresh:async()=>{},
 resetPasswordForEmail:async(...args)=>{requests.push(['reset',...args]);return {};},updateUser:async args=>{requests.push(['password',args]);return {};}
 },from:()=>({select:()=>({eq:(field,id)=>({single:()=>options.profile||Promise.resolve({data:{name:'',state:{progress:{xp:7}}}})})}),upsert:async row=>{writes.push(row);return {};}})};
 const window={SUPABASE_CONFIG:{url:'https://test.supabase.co',anonKey:'public-test'},supabase:{createClient:(...args)=>{clientOptions=args[2];return sb;}},sessionStorage:storage,localStorage:storage,location:{origin:'https://nautilusclaw.com',pathname:'/parent',search:'',assign:u=>requests.push(['navigate',u])}};
 vm.runInNewContext(source,{window,console,URL,setTimeout,clearTimeout:id=>{timerClears++;clearTimeout(id);}});
 return {auth:window.NautilusAuth,emit:(...args)=>event(...args),requests,writes,stored,removed,options:()=>clientOptions,clears:()=>timerClears};
}
test('SDK uses tab storage; signup omits names and never imports guest activity',async()=>{
 const f=fixture();await f.auth.ready;f.stored.set('nautilusclaw-kids-demo',JSON.stringify({name:'Must stay local',history:[{text:'private'}],xp:5}));
 const result=await f.auth.signup({email:' QA@example.invalid ',password:'test-only-passphrase'});
 assert.equal(result.confirmationRequired,true);assert.equal(f.writes.length,0);
 const args=f.requests[0][1];assert.equal(args.email,'qa@example.invalid');assert.equal(args.options.data,undefined);assert.equal(args.options.emailRedirectTo,'https://nautilusclaw.com/login?mode=signin');assert.equal(f.options().auth.storageKey,'nautilus-parent-auth');
});
test('new passwords require 12 characters, while existing shorter passwords can sign in',async()=>{
 const f=fixture();await f.auth.ready;await assert.rejects(f.auth.signup({email:'qa@example.invalid',password:'short'}),/12 and 128/);assert.equal(f.requests.length,0);await f.auth.signin({email:'qa@example.invalid',password:'legacy'});assert.equal(f.auth.currentUser().email,session.user.email);
});
test('sign-out clears the token, profile and stored session and cancels pending persistence',async()=>{
 const f=fixture({session});await f.auth.ready;f.auth.updateCurrentUser({kid:{name:'Local test'}});f.stored.set('nautilus-parent-auth','test');await f.auth.signout();
 assert.equal(f.auth.getToken(),null);assert.equal(f.auth.currentUser(),null);assert.ok(f.clears()>0);assert.equal(f.stored.has('nautilus-parent-auth'),false);
 f.emit('TOKEN_REFRESHED',session);await tick();assert.equal(f.auth.currentUser(),null);assert.equal(f.auth.getToken(),null);assert.equal(f.writes.length,0);
});
test('a late initial session cannot revive an account after sign-out',async()=>{
 const init=deferred(),f=fixture({initial:init.promise});await f.auth.signout();init.resolve({data:{session}});await f.auth.ready;assert.equal(f.auth.getToken(),null);assert.equal(f.auth.currentUser(),null);
});
test('a pending profile read cannot revive an account after sign-out',async()=>{
 const profile=deferred(),f=fixture({session,profile:profile.promise});await tick();await f.auth.signout();profile.resolve({data:{name:'Late account',state:{}}});await f.auth.ready;assert.equal(f.auth.currentUser(),null);assert.equal(f.auth.getToken(),null);
});
test('account profile errors fail closed without overwriting saved state',async()=>{
 const f=fixture({profile:Promise.resolve({error:{message:'private database detail'}})});await f.auth.ready;await assert.rejects(f.auth.signin({email:'qa@example.invalid',password:'test-password'}),/account data could not load/);assert.equal(f.auth.currentUser(),null);assert.equal(f.auth.getToken(),null);f.auth.updateCurrentUser({kid:{}});assert.equal(f.writes.length,0);
});
test('login errors do not expose account existence or raw provider details',async()=>{
 for(const message of ['Email not confirmed','Invalid login credentials','secret internal database configuration']){
  const f=fixture({signin:{error:{message,status:400}}});await f.auth.ready;await assert.rejects(f.auth.signin({email:'qa@example.invalid',password:'test'}),/We could not complete that request/);
 }
});
test('rate limits and outages produce useful bounded messages',async()=>{
 for(const [status,pattern] of [[429,/Too many attempts/],[503,/unavailable right now/]]) {const f=fixture({signin:{error:{status}}});await f.auth.ready;await assert.rejects(f.auth.signin({email:'qa@example.invalid',password:'test'}),pattern);}
});
test('password reset returns to the dedicated page and requires a recovery event',async()=>{
 const f=fixture({session});await f.auth.ready;await f.auth.requestReset('qa@example.invalid');assert.equal(f.requests[0][2].redirectTo,'https://nautilusclaw.com/login?mode=reset');await assert.rejects(f.auth.updatePassword('new-test-only-password'),/reset link/);
 f.emit('PASSWORD_RECOVERY',session);await tick();await f.auth.updatePassword('new-test-only-password');assert.equal(f.auth.getToken(),null);assert.equal(f.auth.isRecovery(),false);
});
test('auth events do not perform a synchronous database request inside the SDK lock',async()=>{
 const f=fixture();await f.auth.ready;f.emit('SIGNED_IN',session);assert.equal(f.auth.getToken(),null);await tick();assert.equal(f.auth.getToken(),session.access_token);
});
