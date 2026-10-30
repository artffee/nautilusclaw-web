# Parent authentication activation audit — October 30, 2026

## Outcome: activation remains blocked

The restored project `zijjkbtxqjhnretrxawk` is `ACTIVE_HEALTHY`. No database
restoration, migration, account modification, provider-setting change, or website
deployment was performed in this audit. Production account forms and billing
remain disabled. This report supplements, rather than replaces, the
[October 28 API test evidence](auth-restoration-2026-10-28.md).

## Fresh observations

| Check | October 30 result |
| --- | --- |
| Public Supabase `/auth/v1/settings` | HTTP 200; email provider enabled; `disable_signup: false`; **`mailer_autoconfirm: true`** |
| Dashboard Auth settings | Redirected to sign-in; the secure sign-in request did not complete; no authenticated dashboard session established |
| Server password minimum | Not readable through the available connector; the October 28 eight-character-password acceptance remains unresolved, not newly retested |
| Leaked-password protection | Supabase security advisor still reports disabled |
| Existing migration | `20261028165233` remains applied |
| Family-table RLS | Enabled on `parent`, `child`, `message`, `concern`, and `summary` |
| Ownership policies | Authenticated-owner `USING` and `WITH CHECK` predicates retained; concern/message same-child check retained |
| Table grants | Only SELECT/INSERT/UPDATE/DELETE for authenticated users; no anon/PUBLIC grants on the five tables |
| Anonymous REST reads | HTTP 401 on all five tables, queried with `select=id&limit=0`; no family records retrieved |
| Existing account counts | Three Auth users and three parent rows; no new test users created |
| Production `/login` | HTTP 200; email, password and submit controls disabled in browser |
| Login headers | CSP, `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY` present |
| Production client configuration | `accountsEnabled: false` |
| Guest navigation | Continue as a guest opens the story library; The Moonlight Post Office starts without a name, account or microphone |
| Billing | `/api/billing?action=config` returns `{"ready":false,"mode":"disabled"}` |
| Original chat | GET `/api/chat` returns expected 405; existing deployment still contains the original uploaded source SHA |
| Application regression tests | 52 passed, zero failed |
| Static verification | 12 pages passed |
| Build | 35 public assets built successfully |

No fresh authenticated two-family API test was attempted without designated test
mailboxes. October 28's real two-account isolation and refresh-revocation results
remain the latest behavioral evidence. Today's policy/grant inspection confirms
those protections are still installed; it is not a substitute for repeating the
complete verified-email journey before launch.

## Email-delivery evidence and access limits

**No signup or recovery email was sent or received during this audit.** There is
no new delivery ID, mailbox-receipt evidence, confirmation-link result, or recovery
result to report. Existing documentation does not designate two deliverable QA
mailboxes, and the connected Resend account has no inboxes.

The connected Resend account currently has three domains out of three available:
`ivosart.com` is verified, `departmentofsurrender.com` failed, and `glagolic.com`
has not started verification. `nautilusclaw.com` is not configured there. All
three domains have receiving disabled. This does **not** establish that Supabase
uses Resend; its SMTP host, sender, templates, rate limits, and expiration settings
remain inaccessible until authorized dashboard access is completed. No domain
was removed, unrelated sender repurposed, API key created, or plan upgraded.

## Required continuation

1. Complete secure dashboard sign-in for the existing project. The connected
   Supabase tools expose database operations, but not Auth configuration.
2. Enable email confirmation and set the provider minimum password length to
   **12**, matching the application's 12–128-character new-password validation.
   Inspect additional password requirements and leaked-password protection
   availability without purchasing an upgrade. Verify policies at the API, not
   only in HTML or client JavaScript.
3. Inspect/configure the intended SMTP service and verified sender, email
   templates, rate limits, link expiry and secure password-change settings.
   Keep Site URL `https://nautilusclaw.com`. Verify these exact allowed redirects,
   with no production wildcards:

   - `https://nautilusclaw.com/login?mode=signin`
   - `https://nautilusclaw.com/login?mode=reset`
   - `https://www.nautilusclaw.com/login?mode=signin`
   - `https://www.nautilusclaw.com/login?mode=reset`
   - `https://nautilusclaw-app.vercel.app/login?mode=signin`
   - `https://nautilusclaw-app.vercel.app/login?mode=reset`

4. Designate two controlled deliverable test inboxes or aliases, with a way to
   receive their messages. Test signup without an early session, actual receipt,
   confirmation, sign-in, parent creation, sign-out and refresh rejection; then
   actual recovery receipt, link completion, new-password sign-in and old-password
   rejection. Test weak signup/replacement passwords, expired/reused/invalid
   links, rejected external redirects, and cross-family reads and mutations.
   Record sanitized timestamps and delivery IDs without passwords or link tokens.
   Remove only the disposable test data after verification.
5. Only after every launch check succeeds, enable the forms and publish using
   the preserved-file Vercel workflow. Keep billing disabled and rerun guest and
   login browser checks on both production addresses.

## Deployment preservation

The current custom domain resolves to production deployment
`dpl_5U62MGJXDfekzVBWhbV7D4AwmJ6S`, project
`prj_kCILWbwrcZSp1odUzKxuBoGinE2O`, team
`team_h9a6UAtdfEyOIHcS9zYtSfOm`. Its source tree confirms `api/chat.js` upload
SHA `c3a0201c3460299c01bab11feb5c563779c3a8a6`. Retain that exact upload reference
and CommonJS package scope during release. Repository-only deployment remains
unsafe because full original chat source is not in GitHub. The repair branch's
automatic Git deployment remains disabled. This audit changes documentation only.

Login page: https://nautilusclaw.com/login (reachable, forms intentionally disabled).

Password-security remediation reference:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
