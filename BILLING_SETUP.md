# NautilusClaw Family billing

## Current release

Pricing: free guest adventure; Family $6.99 USD/month or $59 USD/year (one annual charge, $24.88 / 29.66% below twelve monthly payments; UI conservatively says 29%). Family covers one parent account and one child profile. Existing learning-data export and deletion remain available without a subscription.

The new pages and server integration are implemented, but **checkout is disabled**. The project has no Stripe runtime API key. No live product, price, subscription, or payment was created. The existing chat beta stays accessible under its existing auth while BILLING_MODE=disabled.

Created in **Orion Mind sandbox, acct_1ULZfDGeTDDLMfda**:

| Resource | ID |
| --- | --- |
| Family product | nautilusclaw_family |
| Monthly price | price_1UUsIfGeTDDLMfdabq8tQOOK |
| Yearly price | price_1UUsIiGeTDDLMfdap2LyMcx5 |
| Parent portal | bpc_1UUsP5GeTDDLMfdaHSczKyew |
| Webhook (disabled pending setup) | we_1UUsPAGeTDDLMfdaQexqibVy |

The portal, signing secret, and BILLING_MODE=disabled are configured on the existing nautilusclaw-app Vercel project. The signing secret is a sensitive variable. It is not in the repository. Sandbox endpoint: https://nautilusclaw-app.vercel.app/api/stripe-webhook

## Activate and test sandbox

1. In the Orion Mind sandbox, create a restricted key for this service. Minimum runtime permissions: Customers read/write (including search); Products/Prices read; Subscriptions read; Invoices read; Checkout Sessions read/write; Customer Portal sessions write. Do not enable refunds, payouts, transfers, or account administration.
2. Save it as **STRIPE_RESTRICTED_KEY**, a **sensitive** environment variable in the nautilusclaw-app Vercel project. Never paste the key into chat or commit it. Keep sandbox keys separate from live keys.
3. Use a dedicated preview/test deployment and parent test account. Set APP_ORIGIN to that deployment's exact origin and use a dedicated test webhook URL/signing secret there. Set BILLING_MODE=test. Redeploy using the preserved chat file, as described below. The production values currently prepared for the sandbox are dormant, not an enabled launch.
4. Enable the matching webhook endpoint only after the test deployment is ready. API version: 2026-09-30.endive, matching stripe-node 23.0.1. Events are listed in lib/billing.js. The server rejects invalid signatures, wrong mode, and unconfirmed asynchronous payments. Webhook failures return non-2xx for Stripe retries.
5. Verify a confirmed parent login, monthly and annual checkout, duplicate clicks/open checkouts, a successful test card, declined payment, canceled checkout, asynchronous payment, forged return URL, renewal, failed renewal, and cancellation at period end. Test actual portal payment updates/invoices/cancellation. Do not use real payment details in a sandbox.
6. Check /api/chat with no subscription, active paid subscription, past-due and canceled subscription, expired auth, and a temporary Stripe outage. Check /api/chat, /api/chat/, and /api/chat.js. Confirm the middleware is present in the Vercel build output. Replays/out-of-order events must not restore canceled access.

## Enable live payments

Use the confirmed merchant account **Orion Mind, acct_1ULa8EGxcGcZZLCy** only after account selection and sandbox verification. Create a separate live product and prices with the same lookup keys in plans.js, a live portal, live webhook and restricted key. Do not copy test IDs/secrets into live mode. Ensure account onboarding, public business/support details and cancellation disclosures are ready. Confirm applicable tax registrations before enabling Stripe Tax; `automatic_tax` is deliberately absent, so this release does **not** calculate or collect tax automatically. Read https://docs.stripe.com/billing/taxes/collect-taxes before enabling tax. Configure recovery and invoice email settings in Stripe. No email or recovery settings were changed by this release.

Set BILLING_MODE=live only when all of those values and checks pass. The ready check verifies key mode, catalog amounts/currency/interval/product, webhook secret and portal configuration. Enabling a mode with missing credentials fails closed for paid AI requests. Before enabling, verify older deployments cannot still serve unmetered chat publicly; archive/disable legacy public deployments as appropriate without weakening deployment protection.

## Architecture

- Public catalog in plans.js; clients select `monthly` or `yearly`, never an amount or arbitrary Price.
- /api/billing verifies Supabase's `/auth/v1/user`, a confirmed parent email, Origin, and JSON before checkout. Stripe Customer metadata associates the verified Supabase UUID. No child profile or message content is sent to Stripe.
- Stripe is the authoritative billing store. There is no client-writable entitlement column and no database migration. Each paid access check retrieves the parent's owned Customer and current subscriptions/invoice. Invoice must be paid, status active, and subscription item period unexpired. Parent user metadata and localStorage cannot grant paid access.
- The explicit metadata association fallback avoids requiring a Supabase service-role secret or modifying the legacy account schema. A future server-owned Customer-ID mapping will reduce search latency and handle very large customer lists better. Duplicate owned customers fail closed for manual review.
- Signed webhooks resolve their Customer through Stripe's object graph, refetch current subscription state, and persist reconciliation metadata on that Customer. Replayed or late events cannot grant access from stale payloads. That metadata is observational; access always rechecks current Stripe state.
- Checkout reuses an existing matching open session, refuses another interval while a checkout is open, and uses an idempotency key per customer/time window. The UI prevents double submission. A future transactional billing table can enforce uniqueness across multiple concurrent sessions and boundary windows; review duplicate-subscription monitoring before scale-up.
- Success/cancel URLs never grant access. The return page requests authenticated server status. All billing responses are private/no-store. Stripe handles card entry and the customer portal.
- Middleware adds a billing check ahead of the original authenticated chat function; auth and moderation in that function are retained. It does not run when billing is disabled. The learning-data dashboard remains available.
- No in-memory subscription cache, invented access flags, client API secrets, or unsigned webhook handlers.

## Deployment

**Do not deploy only the Git checkout.** api/chat.js is still preserved by uploaded-file SHA in deployment-preserved-files.json. Include that exact file reference plus public HTML/CSS/JS, lib/billing.js, api/billing.js, api/stripe-webhook.js, middleware.js, package.json and package-lock.json. Do not expose server helper source as a static public asset: Vercel's output should contain only static public files plus compiled functions/middleware. Verify the chat file SHA and endpoint after deployment.

Run `npm test` and `npm run verify`. These verify access rules, price validation, server auth, duplicate checkout handling, webhook signatures, async payment handling, replay reconciliation, and configuration failure behavior. They are not a substitute for the signed-in Stripe sandbox journey described above.
