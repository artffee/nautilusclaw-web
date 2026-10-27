# Family annual trial update — 2026-10-27

## Scope

Annual Family pricing defaults to a seven-day trial for first-time Family subscribers. The offer requires a payment method and renews at $59/year unless canceled before trial end. Monthly is $6.99 charged at checkout and has no trial. The server verifies trial eligibility and reconciles trial access from Stripe, while explicit client consent prevents a trial request silently becoming an upfront charge.

The home, pricing, and billing CTAs have adjacent privacy text: “No ads. No data resale. Parent-managed privacy.” The final phrase links to the privacy guide. This release makes no regulatory certification claim, adds no tracking or database fields, and leaves guest learning without a name, account, or microphone.

## Checks

- `npm test`: 52 passing tests, including seven new trial and pricing cases.
- `npm run verify`: 12 pages, local links/anchors, JavaScript syntax and JSON verified.
- `npm run build`: successful; server code stays outside the public asset output.
- Pricing and billing previews at 390px and 1440px iframe widths: annual and monthly toggles update price, renewal terms, CTA URL, and trial visibility correctly; no horizontal content overflow (content widths 375px and 1425px after scrollbars).
- Billing preview: switching intervals clears the parent consent checkbox; checkout stays disabled while billing is unavailable.
- Console inspection of both previews: no application errors; unrelated browser-extension metadata errors excluded.
- Hosted Lighthouse workflow includes pricing on mobile and desktop alongside existing pages. Deployment and results are recorded below after verification.

## Activation limits

Production billing remains disabled. The annual CTA therefore says “7-Day Free Trial · Coming soon.” No customer, checkout, subscription, charge, or Stripe configuration was created or changed during this update. Parent authentication was already disabled because its configured Supabase service is unavailable. A working parent account service and a signed-in Stripe sandbox trial journey are required before enabling payments. Trial reminders and the added webhook event must be configured before launch; see BILLING_SETUP.md.

## Files changed in this update

- `index.html`
- `pricing.html`
- `billing.html`
- `billing.js`
- `plans.js`
- `ocean.css`
- `guide.html`
- `api/billing.js`
- `lib/billing.js`
- `tests/billing.test.js`
- `BILLING_SETUP.md`
- `.github/workflows/lighthouse.yml`
- `docs/family-trial-verification.md`
