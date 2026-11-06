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
- Hosted Lighthouse workflow includes pricing on mobile and desktop alongside existing pages. Deployment and measured results are recorded below.

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

## Published deployment

Production deployment `dpl_5U62MGJXDfekzVBWhbV7D4AwmJ6S` is READY from source commit `3b5fbced8cca0f1fe86c7809b1482eeb53624761`. Verified the annual offer and privacy line at https://nautilusclaw.com/pricing . The original chat handler is retained at uploaded-file SHA `c3a0201c3460299c01bab11feb5c563779c3a8a6`.

Production API checks: `/api/billing?action=config` returns 200 with `{"ready":false,"mode":"disabled"}`; GET `/api/chat` returns the existing 405 response. Deployment source confirms the original chat SHA and compiled billing/chat/webhook functions plus middleware. The live pricing and billing pages show the correct annual/monthly terms and disabled checkout, with no application console errors.

## Lighthouse results

[Live audit run](https://github.com/artffee/nautilusclaw-web/actions/runs/40435062532), Lighthouse 13.5.0, 2026-10-27. Values below are the latest measured values for each page/device; individual reruns do not rerun every matrix job.

| Page | Device | Performance | Accessibility | Best practices | SEO |
| --- | --- | ---: | ---: | ---: | ---: |
| Home | Mobile | 99 | 100 | 100 | 100 |
| Home | Desktop | 100 | 100 | 100 | 100 |
| Pricing | Mobile | 98 | 100 | 100 | 100 |
| Pricing | Desktop | 100 | 100 | 100 | 100 |
| Adventure | Mobile | 100 | 100 | 100 | 100 |
| Adventure | Desktop | 100 | 100 | 100 | 100 |
| Login | Mobile | 100 | 100 | 100 | 63 |
| Login | Desktop | 100 | 100 | 100 | 63 |

The initial mobile pricing performance result was 80 with 760ms total blocking time. One targeted repeat on unchanged production source measured 98 with 140ms total blocking time. Desktop login performance was 98 initially and 100 on a targeted repeat. All other table entries come from the first run. These are measurements, not a guarantee of consistent 100 performance. Login SEO is intentionally limited by `noindex,nofollow`; authentication pages remain excluded from search.

The complete signed-in Stripe trial lifecycle could not be exercised while parent authentication and billing are disabled. The automated trial tests use mocked Stripe objects and do not replace that activation test.
