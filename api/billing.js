import {config, stripeClient, authenticate, checkOrigin, catalog, findCustomer, subscriptionState, createCheckout, BillingError} from '../lib/billing.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Authorization');
  const cfg = config();
  try {
    const action = req.query?.action || '';
    if (req.method === 'GET' && action === 'config') {
      if (!cfg.ready) return res.status(200).json({ready: false, mode: 'disabled'});
      await catalog(stripeClient(cfg), cfg);
      return res.status(200).json({ready: true, mode: cfg.mode});
    }
    if (!['GET', 'POST'].includes(req.method)) {res.setHeader('Allow', 'GET, POST');return res.status(405).json({error: 'Method not allowed.'});}
    if (req.method === 'POST') checkOrigin(req, cfg);
    const user = await authenticate(req.headers);
    const stripe = stripeClient(cfg);
    const prices = await catalog(stripe, cfg);
    if (req.method === 'GET' && action === 'status') {
      const customer = await findCustomer(stripe, user);
      const state = await subscriptionState(stripe, customer, prices);
      const {subscriptionId, ...publicState} = state;
      return res.status(200).json({...publicState, canManage: !!customer, mode: cfg.mode});
    }
    if (req.method !== 'POST') throw new BillingError(404, 'Billing action not found.');
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (body?.action === 'checkout') {
      if (body.adultConfirmed !== true) throw new BillingError(400, 'A parent or guardian must confirm the subscription.');
      const session = await createCheckout(stripe, cfg, user, body.plan, prices);
      return res.status(200).json({url: session.url});
    }
    if (body?.action === 'portal') {
      const customer = await findCustomer(stripe, user);
      if (!customer) throw new BillingError(404, 'There is no billing account to manage yet.');
      const session = await stripe.billingPortal.sessions.create({customer: customer.id, configuration: cfg.portal, return_url: `${cfg.origin}/billing`});
      return res.status(200).json({url: session.url});
    }
    throw new BillingError(400, 'Choose a supported billing action.');
  } catch (error) {
    const known = error instanceof BillingError;
    // Never send upstream messages, keys, emails, tokens, or request bodies to logs.
    if (!known) console.error('Billing request failed', {type: error.type || error.name});
    return res.status(known ? error.status : error instanceof SyntaxError ? 400 : 503).json({
      error: known ? error.message : 'Billing could not be reached. Please try again shortly.',
      code: known ? error.code : 'BILLING_UNAVAILABLE',
    });
  }
}
