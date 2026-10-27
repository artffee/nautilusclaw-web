import Stripe from 'stripe';
import {PLANS, APP, FAMILY_TRIAL} from '../plans.js';

export class BillingError extends Error {
  constructor(status, message, code = 'BILLING_ERROR') { super(message); this.status = status; this.code = code; }
}
export function config(env = process.env) {
  const mode = env.BILLING_MODE || 'disabled';
  const key = env.STRIPE_RESTRICTED_KEY || '';
  const keyMode = /^(?:rk|sk)_live_/.test(key) ? 'live' : /^(?:rk|sk)_test_/.test(key) ? 'test' : null;
  return {
    mode, key, live: mode === 'live',
    enabled: mode === 'live' || mode === 'test',
    ready: ['live', 'test'].includes(mode) && keyMode === mode &&
      !!env.STRIPE_WEBHOOK_SECRET && !!env.STRIPE_PORTAL_CONFIGURATION,
    origin: env.APP_ORIGIN || 'https://nautilusclaw-app.vercel.app',
    portal: env.STRIPE_PORTAL_CONFIGURATION,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  };
}
export function requireReady(cfg) {
  if (!cfg.ready) throw new BillingError(503, 'Family checkout is not open yet. The guest adventure is free.', 'BILLING_UNAVAILABLE');
}
export function stripeClient(cfg) {
  requireReady(cfg);
  return new Stripe(cfg.key, {maxNetworkRetries: 2, timeout: 10000});
}
export async function authenticate(headers, fetcher = fetch) {
  const auth = typeof headers.get === 'function' ? headers.get('authorization') : headers.authorization;
  if (!auth || !/^Bearer \S+$/.test(auth)) throw new BillingError(401, 'Sign in to your parent account to continue.', 'SIGN_IN');
  const response = await fetcher('https://zijjkbtxqjhnretrxawk.supabase.co/auth/v1/user', {
    headers: {authorization: auth, apikey: 'sb_publishable_1cMDNccUCG4-_ZdWhMd3QQ_NhWwLcaZ'},
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new BillingError(response.status >= 500 ? 503 : 401, 'Your parent sign-in could not be verified. Please try signing in again.', 'SIGN_IN');
  const user = await response.json();
  if (!/^[a-f0-9-]{36}$/i.test(user.id || '') || !user.email || !user.email_confirmed_at)
    throw new BillingError(401, 'Confirm your parent email, then sign in again.', 'SIGN_IN');
  return user;
}
export function checkOrigin(req, cfg) {
  if (req.headers.origin !== cfg.origin) throw new BillingError(403, 'Open billing from the NautilusClaw website.');
  if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) throw new BillingError(415, 'Send a JSON request.');
}
export async function catalog(stripe, cfg) {
  const {data} = await stripe.prices.list({active: true, lookup_keys: Object.values(PLANS).map(p => p.lookup), expand: ['data.product'], limit: 10});
  const prices = {};
  for (const [name, plan] of Object.entries(PLANS)) {
    const matches = data.filter(p => p.lookup_key === plan.lookup);
    const p = matches[0];
    if (matches.length !== 1 || p.unit_amount !== plan.amount || p.currency !== plan.currency ||
        p.livemode !== cfg.live || p.recurring?.interval !== plan.interval || p.recurring?.interval_count !== 1 ||
        !p.product?.active || p.product.metadata?.app !== APP || p.product.metadata?.tier !== 'family')
      throw new BillingError(503, 'Family checkout is being updated. Please try again later.', 'CATALOG_UNAVAILABLE');
    prices[name] = p;
  }
  if (prices.monthly.product.id !== prices.yearly.product.id) throw new BillingError(503, 'Family checkout is being updated.');
  return prices;
}
const owns = (customer, user) => !customer.deleted && customer.metadata?.app === APP && customer.metadata?.parent_id === user.id;
export async function findCustomer(stripe, user, create = false) {
  // Metadata is an explicit fallback because the existing app has no server-owned
  // billing table. Never trust IDs or entitlement claims from client state.
  let found = [];
  for await (const c of stripe.customers.list({email: user.email, limit: 100})) {
    if (owns(c, user)) found.push(c);
  }
  if (!found.length) {
    // Also handles a parent who changed their verified email. UUID is validated above.
    const result = await stripe.customers.search({query: `metadata['app']:'${APP}' AND metadata['parent_id']:'${user.id}'`, limit: 100});
    found = result.data.filter(c => owns(c, user));
  }
  if (found.length > 1) throw new BillingError(409, 'This account needs a billing review before another subscription can be created.', 'DUPLICATE_CUSTOMERS');
  if (found.length) return found[0];
  if (!create) return null;
  return stripe.customers.create({email: user.email, metadata: {app: APP, parent_id: user.id}}, {idempotencyKey: `${APP}:customer:${user.id}`});
}
export function evaluateSubscriptions(subscriptions, prices, now = Date.now()) {
  const ids = new Set(Object.values(prices).map(p => p.id));
  const family = subscriptions.filter(s => s.items?.data.some(i => ids.has(i.price?.id)));
  const current = family.filter(s => !['canceled', 'incomplete_expired'].includes(s.status));
  const paid = current.find(s => s.status === 'active' && s.latest_invoice?.status === 'paid' &&
    s.items.data.some(i => ids.has(i.price?.id) && i.current_period_end * 1000 > now));
  const trial = current.find(s => s.status === 'trialing' && s.metadata?.app === APP &&
    s.metadata?.offer === FAMILY_TRIAL.offer && s.trial_start * 1000 <= now &&
    s.trial_end * 1000 > now && s.trial_end > s.trial_start &&
    s.trial_end - s.trial_start <= FAMILY_TRIAL.days * 86400 &&
    (!s.cancel_at || s.cancel_at * 1000 > now) &&
    s.items.data.some(i => i.price?.id === prices.yearly.id));
  const sub = paid || trial || current[0];
  const item = sub?.items.data.find(i => ids.has(i.price?.id));
  return {
    active: !!(paid || trial), hasSubscription: current.length > 0,
    trialing: !!trial && !paid, trialEnd: trial?.trial_end || null,
    trialEligible: !subscriptions.some(s =>
      (s.metadata?.app === APP || s.items?.data.some(i => ids.has(i.price?.id))) &&
      !['incomplete', 'incomplete_expired'].includes(s.status)),
    status: sub?.status || 'free',
    periodEnd: trial && !paid ? Math.min(trial.trial_end, trial.cancel_at || Infinity) : item?.current_period_end || null,
    cancelAtPeriodEnd: !!(sub?.cancel_at_period_end || sub?.cancel_at),
    plan: item ? Object.keys(prices).find(k => prices[k].id === item.price.id) : null,
    subscriptionId: sub?.id || null,
  };
}
export async function subscriptionState(stripe, customer, prices) {
  if (!customer) return evaluateSubscriptions([], prices);
  const subs = [];
  for await (const s of stripe.subscriptions.list({customer: customer.id, status: 'all', limit: 100, expand: ['data.latest_invoice']})) subs.push(s);
  return evaluateSubscriptions(subs, prices);
}
export async function createCheckout(stripe, cfg, user, planName, prices, trialRequested = planName === FAMILY_TRIAL.plan) {
  if (!Object.hasOwn(PLANS, planName)) throw new BillingError(400, 'Choose monthly or yearly billing.');
  const customer = await findCustomer(stripe, user, true);
  const state = await subscriptionState(stripe, customer, prices);
  if (state.hasSubscription) throw new BillingError(409, 'You already have a Family subscription. Use Manage billing to view or cancel it.', 'ALREADY_SUBSCRIBED');
  if (typeof trialRequested !== 'boolean' || (trialRequested && planName !== FAMILY_TRIAL.plan))
    throw new BillingError(400, 'Review the trial and billing terms before continuing.');
  const trial = planName === FAMILY_TRIAL.plan && state.trialEligible;
  if (trialRequested !== trial) throw new BillingError(409,
    trial ? 'Your annual plan includes a free trial. Refresh your plan to review the terms.'
      : 'The free trial is for first-time Family subscribers. Refresh your plan and review the price before continuing.', 'TRIAL_ELIGIBILITY_CHANGED');
  if (trial && customer.balance > 0) throw new BillingError(409, 'Review your existing billing balance before starting a free trial.');
  const offer = trial ? FAMILY_TRIAL.offer : 'standard';
  const open = await stripe.checkout.sessions.list({customer: customer.id, status: 'open', limit: 100});
  for (const session of open.data.filter(s => s.metadata?.app === APP)) {
    if (session.metadata?.plan === planName &&
        (session.metadata?.offer === offer || (planName === 'monthly' && !session.metadata?.offer))) return session;
    // Never silently create a second checkout for another interval.
    throw new BillingError(409, 'An earlier checkout has different billing terms. Let it expire before starting this offer.', 'CHECKOUT_OPEN');
  }
  const bucket = Math.floor(Date.now() / 1800000);
  return stripe.checkout.sessions.create({
    mode: 'subscription', customer: customer.id,
    client_reference_id: user.id,
    line_items: [{price: prices[planName].id, quantity: 1}],
    payment_method_collection: 'always',
    subscription_data: {billing_mode: {type: 'flexible'}, metadata: {app: APP, offer},
      ...(trial ? {trial_period_days: FAMILY_TRIAL.days, trial_settings: {end_behavior: {missing_payment_method: 'cancel'}}} : {})},
    metadata: {app: APP, plan: planName, offer},
    integration_identifier: 'nautilus-family-zpqmyatn',
    success_url: `${cfg.origin}/billing?checkout=success`,
    cancel_url: `${cfg.origin}/billing?checkout=canceled`,
    expires_at: (bucket + 2) * 1800,
    custom_text: {submit: {message: trial ? 'No subscription charge today. After 7 days, $59/year unless canceled before the trial ends. Payment method required. Cancel through the parent billing page.' : 'A recurring NautilusClaw Family subscription, charged at checkout. Cancel from the parent billing page before renewal to stop the next payment.'}},
  }, {idempotencyKey: `${APP}:checkout:${customer.id}:${offer}:${bucket}`});
}
export const WEBHOOK_EVENTS = [
  'checkout.session.completed', 'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed', 'customer.subscription.created',
  'customer.subscription.updated', 'customer.subscription.deleted',
  'customer.subscription.paused', 'customer.subscription.resumed', 'customer.subscription.trial_will_end',
  'invoice.paid', 'invoice.payment_failed', 'invoice.payment_action_required',
];
export async function reconcileEvent(stripe, cfg, event, prices) {
  if (event.livemode !== cfg.live) throw new BillingError(400, 'Event mode does not match this endpoint.');
  if (!WEBHOOK_EVENTS.includes(event.type)) return {ignored: true};
  const object = event.data.object;
  if (event.type === 'checkout.session.completed' && !['paid', 'no_payment_required'].includes(object.payment_status)) return {pending: true};
  if (event.type === 'checkout.session.async_payment_succeeded' && object.payment_status !== 'paid') return {pending: true};
  const customerId = typeof object.customer === 'string' ? object.customer : object.customer?.id;
  if (!customerId) return {ignored: true};
  // Resolve the ownership boundary through the Stripe Customer, not event metadata.
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || customer.metadata?.app !== APP || !customer.metadata?.parent_id) return {ignored: true};
  const state = await subscriptionState(stripe, customer, prices);
  // Re-fetch authoritative state on every delivery. Replays/out-of-order events
  // cannot restore expired access. Authorization always rechecks Stripe too;
  // this persisted reconciliation record is never itself an access credential.
  await stripe.customers.update(customer.id, {metadata: {
    family_subscription: state.subscriptionId || '',
    family_status: state.status,
    family_last_event: event.id,
  }});
  return {reconciled: true};
}

