import {next} from '@vercel/functions';
import {config as billingConfig, stripeClient, authenticate, catalog, findCustomer, subscriptionState, BillingError} from './lib/billing.js';

// Preserve the existing authenticated/moderated chat function byte-for-byte.
// Apply the additional subscription check before every spelling of its route.
export const config = {runtime: 'nodejs', matcher: ['/api/chat', '/api/chat/:path*', '/api/chat.js']};
export default async function middleware(request) {
  const cfg = billingConfig();
  if (!cfg.enabled || request.method !== 'POST') return next();
  try {
    const user = await authenticate(request.headers);
    const stripe = stripeClient(cfg); // Missing credentials fail closed when enabled.
    const prices = await catalog(stripe, cfg);
    const customer = await findCustomer(stripe, user);
    const state = await subscriptionState(stripe, customer, prices);
    if (!state.active) throw new BillingError(402, 'A parent can manage Family access from the billing page.', 'SUBSCRIPTION_REQUIRED');
    return next();
  } catch (error) {
    const known = error instanceof BillingError;
    return Response.json({error: known ? error.message : 'Billing verification is temporarily unavailable.', code: known ? error.code : 'BILLING_UNAVAILABLE'}, {
      status: known ? error.status : 503, headers: {'Cache-Control': 'private, no-store', Vary: 'Authorization'},
    });
  }
}
