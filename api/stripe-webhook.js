import {config as billingConfig, stripeClient, catalog, reconcileEvent, BillingError} from '../lib/billing.js';
export const config = {api: {bodyParser: false}};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {res.setHeader('Allow', 'POST');return res.status(405).json({error: 'Method not allowed.'});}
  const cfg = billingConfig();
  if (!cfg.ready) return res.status(503).json({error: 'Billing is not configured.'});
  const stripe = stripeClient(cfg);
  let event;
  try {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > 1048576) return res.status(413).json({error: 'Event too large.'});
      chunks.push(bytes);
    }
    event = stripe.webhooks.constructEvent(Buffer.concat(chunks), req.headers['stripe-signature'], cfg.webhookSecret);
  } catch {return res.status(400).json({error: 'Invalid webhook signature or payload.'});}
  try {
    const prices = await catalog(stripe, cfg);
    await reconcileEvent(stripe, cfg, event, prices);
    return res.status(200).json({received: true});
  } catch (error) {
    console.error('Billing event could not be reconciled', {eventId: event.id, type: error.type || error.name});
    // A non-2xx response asks Stripe to retry; never acknowledge lost fulfillment.
    return res.status(error instanceof BillingError ? error.status : 503).json({error: 'Event reconciliation failed.'});
  }
}
