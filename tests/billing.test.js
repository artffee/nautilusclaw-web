import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createRequire} from 'node:module';
import Stripe from 'stripe';
import {config, requireReady, authenticate, checkOrigin, catalog, findCustomer, evaluateSubscriptions, createCheckout, reconcileEvent} from '../lib/billing.js';
import webhook from '../api/stripe-webhook.js';
import billing from '../api/billing.js';
import middleware from '../middleware.js';
import {PLANS} from '../plans.js';

const user = {id: '12345678-1234-4321-8123-123456789abc', email: 'parent@example.test', email_confirmed_at: '2026-10-26T00:00:00Z'};
const customer = {id: 'cus_owned', email: user.email, metadata: {app: 'nautilusclaw', parent_id: user.id}};
const cfg = {live: false, origin: 'https://nautilusclaw-app.vercel.app'};
const product = {id: 'prod_family', active: true, metadata: {app: 'nautilusclaw', tier: 'family'}};
const prices = Object.fromEntries(Object.entries(PLANS).map(([name, p]) => [name, {id: 'price_' + name, unit_amount: p.amount, lookup_key: p.lookup, currency: p.currency, recurring: {interval: p.interval, interval_count: 1}, product, active: true, livemode: false}]));
const paid = {id: 'sub_family', status: 'active', latest_invoice: {status: 'paid'}, items: {data: [{price: {id: prices.monthly.id}, current_period_end: Math.floor(Date.now()/1000) + 86400}]}};
function mockStripe(subs = []) {
  return {
    customers: {list: () => [customer], search: async () => ({data: [customer]}), retrieve: async () => customer, update: async () => {}},
    subscriptions: {list: () => subs},
    checkout: {sessions: {list: async () => ({data: []}), create: async params => ({url: 'https://checkout.stripe.com/test', params})}},
  };
}
function response() {return {headers: {}, setHeader(k,v) {this.headers[k]=v;}, status(s) {this.statusCode=s;return this;}, json(body) {this.body=body;return this;}};}

test('billing is disabled by default and an enabled mode with missing or mismatched secrets fails closed', () => {
  assert.equal(config({}).enabled, false);
  assert.equal(config({BILLING_MODE:'test'}).ready, false);
  assert.throws(() => requireReady(config({BILLING_MODE:'live', STRIPE_RESTRICTED_KEY:['rk','test','fixture'].join('_')})), e => e.status === 503);
});
test('only a confirmed, server-verified parent can own billing', async () => {
  await assert.rejects(authenticate({}, () => {throw Error('must not call');}), e => e.status === 401);
  await assert.rejects(authenticate({authorization:'Bearer forged'}, async () => ({ok:false,status:401})), e => e.status === 401);
  await assert.rejects(authenticate({authorization:'Bearer fixture'}, async () => ({ok:true,json:async()=>({...user,email_confirmed_at:null})})), e=>e.status===401);
  const got = await authenticate({authorization:'Bearer fixture'}, async (url,opts) => {
    assert.ok(url.endsWith('/auth/v1/user'));assert.equal(opts.headers.authorization,'Bearer fixture');
    return {ok:true,json:async()=>user};
  });assert.equal(got.id,user.id);
});
test('state-changing billing requests reject cross-origin and non-JSON input', () => {
  assert.throws(()=>checkOrigin({headers:{origin:'https://evil.example','content-type':'application/json'}},cfg),e=>e.status===403);
  assert.throws(()=>checkOrigin({headers:{origin:cfg.origin,'content-type':'text/plain'}},cfg),e=>e.status===415);
  checkOrigin({headers:{origin:cfg.origin,'content-type':'application/json'}},cfg);
});
test('catalog rejects changed price, currency, interval, product ownership, and live/test mismatch', async () => {
  const stripe={prices:{list:async()=>({data:Object.values(prices)})}};
  assert.equal((await catalog(stripe,cfg)).yearly.unit_amount,5900);
  for(const change of [{unit_amount:1},{currency:'eur'},{recurring:{interval:'day',interval_count:1}},{livemode:true},{product:{...product,metadata:{app:'another-app'}}}]) {
    stripe.prices.list=async()=>({data:[{...prices.monthly,...change},prices.yearly]});
    await assert.rejects(catalog(stripe,cfg),e=>e.status===503);
  }
});
test('matching email alone cannot grant ownership of another Stripe customer', async () => {
  const stripe=mockStripe();stripe.customers.list=()=>[{...customer,metadata:{app:'nautilusclaw',parent_id:'someone-else'}}];stripe.customers.search=async()=>({data:[]});
  assert.equal(await findCustomer(stripe,user),null);
  stripe.customers.search=async()=>({data:[customer]});assert.equal((await findCustomer(stripe,user)).id,customer.id);
  stripe.customers.list=()=>[customer,{...customer,id:'cus_duplicate'}];
  await assert.rejects(findCustomer(stripe,user),e=>e.code==='DUPLICATE_CUSTOMERS');
});
test('access requires a paid, active, unexpired subscription for the configured Family price', () => {
  assert.equal(evaluateSubscriptions([paid],prices).active,true);
  for(const status of ['past_due','unpaid','canceled','paused','incomplete','incomplete_expired','trialing'])
    assert.equal(evaluateSubscriptions([{...paid,status}],prices).active,false,status);
  assert.equal(evaluateSubscriptions([{...paid,latest_invoice:{status:'open'}}],prices).active,false);
  assert.equal(evaluateSubscriptions([{...paid,items:{data:[{price:{id:'price_other'},current_period_end:9999999999}]}}],prices).active,false);
  assert.equal(evaluateSubscriptions([paid],prices,paid.items.data[0].current_period_end*1000).active,false);
});
test('cancellation at period end retains paid access until expiry and shows cancellation', () => {
  const state=evaluateSubscriptions([{...paid,cancel_at:paid.items.data[0].current_period_end}],prices);
  assert.equal(state.active,true);assert.equal(state.cancelAtPeriodEnd,true);
});
test('checkout ignores client amounts and rejects arbitrary plan IDs', async () => {
  await assert.rejects(createCheckout(mockStripe(),cfg,user,'price_evil',prices),e=>e.status===400);
  const stripe=mockStripe();let captured;
  stripe.checkout.sessions.create=async(params,opts)=>{captured={params,opts};return {url:'https://checkout.stripe.com/test'};};
  await createCheckout(stripe,cfg,user,'yearly',prices);
  assert.deepEqual(captured.params.line_items,[{price:'price_yearly',quantity:1}]);
  assert.equal(captured.params.customer,customer.id);assert.equal(captured.params.client_reference_id,user.id);
  assert.equal(captured.params.mode,'subscription');assert.equal(captured.params.subscription_data.billing_mode.type,'flexible');
  assert.equal(captured.params.payment_method_types,undefined);
  assert.equal(captured.params.automatic_tax,undefined);
  assert.ok(captured.opts.idempotencyKey.includes(customer.id));
  assert.equal(captured.params.success_url,cfg.origin+'/billing?checkout=success');
});
test('checkout blocks an existing subscription, reuses matching open checkout, and refuses competing interval', async () => {
  await assert.rejects(createCheckout(mockStripe([paid]),cfg,user,'monthly',prices),e=>e.code==='ALREADY_SUBSCRIBED');
  const stripe=mockStripe();const session={id:'cs_existing',url:'https://checkout.stripe.com/existing',metadata:{app:'nautilusclaw',plan:'monthly'}};
  stripe.checkout.sessions.list=async()=>({data:[session]});
  assert.equal((await createCheckout(stripe,cfg,user,'monthly',prices)).id,session.id);
  await assert.rejects(createCheckout(stripe,cfg,user,'yearly',prices),e=>e.code==='CHECKOUT_OPEN');
});
test('webhook rejects wrong mode and never fulfils an unpaid asynchronous checkout', async () => {
  await assert.rejects(reconcileEvent(mockStripe(),cfg,{livemode:true},prices),e=>e.status===400);
  const result=await reconcileEvent({},cfg,{livemode:false,type:'checkout.session.completed',data:{object:{payment_status:'unpaid'}}},prices);
  assert.equal(result.pending,true);
});
test('replayed/out-of-order paid events reconcile current canceled state instead of restoring access', async () => {
  const stripe=mockStripe([{...paid,status:'canceled'}]);const writes=[];stripe.customers.update=async(id,body)=>writes.push({id,body});
  const event={id:'evt_old_paid',livemode:false,type:'invoice.paid',data:{object:{customer:customer.id}}};
  await reconcileEvent(stripe,cfg,event,prices);await reconcileEvent(stripe,cfg,event,prices);
  assert.equal(writes.length,2);assert.equal(writes[0].body.metadata.family_status,'free');assert.equal(writes[1].body.metadata.family_subscription,'');
});
test('webhooks ignore unrelated customers and surface persistence failures for retries', async () => {
  const stripe=mockStripe([paid]);stripe.customers.retrieve=async()=>({...customer,metadata:{app:'other'}});
  const event={id:'evt_paid',livemode:false,type:'checkout.session.async_payment_succeeded',data:{object:{customer:customer.id,payment_status:'paid'}}};
  assert.equal((await reconcileEvent(stripe,cfg,event,prices)).ignored,true);
  stripe.customers.retrieve=async()=>customer;stripe.customers.update=async()=>{throw Error('transient');};
  await assert.rejects(reconcileEvent(stripe,cfg,event,prices),/transient/);
});
test('webhook verifies exact raw bytes and rejects forged or stale signatures before processing', async () => {
  const saved={...process.env};
  Object.assign(process.env,{BILLING_MODE:'test',STRIPE_RESTRICTED_KEY:['rk','test','synthetic'].join('_'),STRIPE_WEBHOOK_SECRET:'unit-test-signing-secret',STRIPE_PORTAL_CONFIGURATION:'bpc_fixture'});
  try {
    const stripe=new Stripe(process.env.STRIPE_RESTRICTED_KEY);
    const payload=JSON.stringify({id:'evt_fixture',type:'invoice.paid',livemode:false,data:{object:{customer:customer.id}}});
    const signature=stripe.webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET});
    assert.equal(stripe.webhooks.constructEvent(payload,signature,process.env.STRIPE_WEBHOOK_SECRET).id,'evt_fixture');
    for(const [body,header] of [[payload,'t=1,v1=forged'],[payload+' ',signature],[payload,stripe.webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET,timestamp:1})]]) {
      const req=Readable.from([Buffer.from(body)]);req.method='POST';req.headers={'stripe-signature':header};const res=response();
      await webhook(req,res);assert.equal(res.statusCode,400);
    }
  } finally {for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);}
});
test('unconfigured production returns an honest unavailable state, not a checkout link', async () => {
  const old=process.env.BILLING_MODE;process.env.BILLING_MODE='disabled';
  try {
    const res=response();await billing({method:'GET',query:{action:'config'},headers:{}},res);
    assert.deepEqual(res.body,{ready:false,mode:'disabled'});assert.match(res.headers['Cache-Control'],/no-store/);
    const denied=response();await billing({method:'GET',query:{action:'status'},headers:{}},denied);assert.equal(denied.statusCode,401);
  } finally {if(old===undefined)delete process.env.BILLING_MODE;else process.env.BILLING_MODE=old;}
});
test('enabled chat subscription gate denies missing authentication even when Stripe is unconfigured', async () => {
  const old=process.env.BILLING_MODE;process.env.BILLING_MODE='test';
  try {const res=await middleware(new Request(cfg.origin+'/api/chat',{method:'POST'}));assert.equal(res.status,401);}
  finally {if(old===undefined)delete process.env.BILLING_MODE;else process.env.BILLING_MODE=old;}
});

test('new ESM billing modules coexist with the legacy CommonJS handler', () => {
  const require = createRequire(import.meta.url);
  const legacy = require('./fixtures/legacy-handler.js');
  const res = response();legacy({method:'GET'},res);
  assert.equal(res.statusCode,405);
});


test('first annual checkout includes exactly seven free days and no upfront invoice items', async () => {
  const {params} = await createCheckout(mockStripe(),cfg,user,'yearly',prices,true);
  assert.equal(params.subscription_data.trial_period_days,7);
  assert.equal(params.subscription_data.trial_settings.end_behavior.missing_payment_method,'cancel');
  assert.equal(params.payment_method_collection,'always');
  assert.equal(params.subscription_data.metadata.offer,'annual-7day-v1');
  assert.equal(params.metadata.offer,'annual-7day-v1');
  assert.equal(params.subscription_data.add_invoice_items,undefined);
  assert.deepEqual(params.line_items,[{price:'price_yearly',quantity:1}]);
  assert.match(params.custom_text.submit.message,/After 7 days, \$59\/year/);
  const monthly=await createCheckout(mockStripe(),cfg,user,'monthly',prices,false);
  assert.equal(monthly.params.subscription_data.trial_period_days,undefined);
  await assert.rejects(createCheckout(mockStripe(),cfg,user,'monthly',prices,true),e=>e.status===400);
});

test('returning Family subscribers cannot repeat a trial or be silently charged by a trial CTA', async () => {
  const previous={...paid,status:'canceled'};
  assert.equal(evaluateSubscriptions([previous],prices).trialEligible,false);
  const stripe=mockStripe([previous]);
  await assert.rejects(createCheckout(stripe,cfg,user,'yearly',prices,true),e=>e.code==='TRIAL_ELIGIBILITY_CHANGED');
  const result=await createCheckout(stripe,cfg,user,'yearly',prices,false);
  assert.equal(result.params.subscription_data.trial_period_days,undefined);
  assert.match(result.params.custom_text.submit.message,/charged at checkout/);
  await assert.rejects(createCheckout(mockStripe(),cfg,user,'yearly',prices,false),e=>e.code==='TRIAL_ELIGIBILITY_CHANGED');
  const historical={...previous,metadata:{app:'nautilusclaw'},items:{data:[{price:{id:'retired_price'}}]}};
  assert.equal(evaluateSubscriptions([historical],prices).trialEligible,false);
});

test('an old annual checkout cannot replace the advertised no-upfront-charge offer', async () => {
  const stripe=mockStripe();
  const old={id:'cs_old',metadata:{app:'nautilusclaw',plan:'yearly'}};
  stripe.checkout.sessions.list=async()=>({data:[old]});
  await assert.rejects(createCheckout(stripe,cfg,user,'yearly',prices,true),e=>e.code==='CHECKOUT_OPEN');
  old.metadata.offer='annual-7day-v1';
  assert.equal((await createCheckout(stripe,cfg,user,'yearly',prices,true)).id,'cs_old');
});

const trialStart=Math.floor(Date.now()/1000)-30;
const trial={...paid,status:'trialing',metadata:{app:'nautilusclaw',offer:'annual-7day-v1'},trial_start:trialStart,trial_end:trialStart+7*86400,items:{data:[{price:{id:'price_yearly'},current_period_end:trialStart+7*86400}]}};
test('a verified annual free trial grants access only during its bounded trial window', () => {
  const s=evaluateSubscriptions([trial],prices);
  assert.equal(s.active,true);assert.equal(s.trialing,true);assert.equal(s.trialEnd,trial.trial_end);assert.equal(s.trialEligible,false);
  assert.equal(evaluateSubscriptions([trial],prices,trial.trial_end*1000).active,false);
  for(const change of [{metadata:{}},{trial_end:trialStart+8*86400},{trial_start:trial.trial_end},{status:'paused'},{status:'canceled'},{cancel_at:trialStart},{items:paid.items}])
    assert.equal(evaluateSubscriptions([{...trial,...change}],prices).active,false,JSON.stringify(change));
});

test('zero-payment checkout events recheck the current trial instead of trusting the return or event', async () => {
  const writes=[];const stripe=mockStripe([trial]);stripe.customers.update=async(id,body)=>writes.push(body);
  const event={id:'evt_trial',livemode:false,type:'checkout.session.completed',data:{object:{customer:customer.id,payment_status:'no_payment_required'}}};
  assert.equal((await reconcileEvent(stripe,cfg,event,prices)).reconciled,true);
  assert.equal(writes[0].metadata.family_status,'trialing');
  stripe.subscriptions.list=()=>[{...trial,status:'canceled'}];
  await reconcileEvent(stripe,cfg,event,prices);
  assert.equal(writes[1].metadata.family_status,'free');
});

test('an outstanding balance cannot create a misleading no-charge trial checkout', async () => {
  const stripe=mockStripe();stripe.customers.list=()=>[{...customer,balance:100}];
  await assert.rejects(createCheckout(stripe,cfg,user,'yearly',prices,true),/existing billing balance/);
});

test('displayed trial and returning subscriber terms match server checkout intent', async () => {
  const {familyOffer}=await import('../plans.js');
  assert.equal(familyOffer('yearly',true).trial,true);
  assert.match(familyOffer('yearly',true).terms,/After 7 days, \$59\/year/);
  assert.match(familyOffer('yearly',true).consent,/cancel before it ends/);
  assert.equal(familyOffer('yearly',false).trial,false);
  assert.match(familyOffer('yearly',false).terms,/\$59 charged at checkout/);
  assert.equal(familyOffer('monthly').trial,false);
  assert.match(familyOffer('monthly').terms,/No free trial/);
});
