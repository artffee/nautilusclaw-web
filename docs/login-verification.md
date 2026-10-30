# Parent login verification

Implemented October 26, 2026 for NautilusClaw Kids.

**October 28 status:** The original Supabase project has been restored and its
database permissions hardened. Live API sign-in, sign-out and two-account RLS
tests pass, but email confirmation is disabled and the server accepts an
eight-character password. Forms remain disabled; complete email signup/recovery
is not verified. See [current restoration evidence](auth-restoration-2026-10-28.md).
The sections below retain the original implementation/release record.

## Delivered

- Dedicated dark `/login` with responsive layout, sign-in, account creation,
  email reset request, recovery state, password visibility, accessible labels,
  status messages, focus indicators, reduced motion, and a free guest route.
- Existing Supabase Auth and parent database retained. No new data fields,
  tracking, automatic guest imports, microphone access, or child accounts.
- Tab-scoped sessions; tokens and pending saves cleared on sign-out; stale
  async responses cannot restore a signed-out account. Profile read failures
  cannot overwrite existing account data.
- Local, version-pinned Supabase SDK; strict login CSP, no framing, no-referrer,
  no-store, camera/microphone/location disabled; safe internal redirects.
- New passwords checked for 12–128 characters; existing shorter passwords may
  still sign in. Provider settings must enforce server-side password policy.

## Checks

45 unit tests pass, including sign-out races, token clearing, guest isolation,
profile failures, generic errors, rate-limit messages, recovery gating, and
redirect attacks. Build and static verification pass for 12 pages.

Browser checks at 320px, 390px, and 1440px pass without horizontal overflow.
Signup and reset-request navigation work; no application console errors appeared.
A vulnerable transitive Zod dependency was patched to 4.6.6 with a scoped npm
override; the production dependency audit now reports zero known vulnerabilities.
Deployed audit results are recorded after release below. Real account creation, email delivery, recovery, and cross-account
RLS verification remain dependent on the existing Supabase service and access to
its project settings. Initial API checks from this workspace returned HTTP 503
with an upstream connection failure; this does not establish a provider outage.

## Changed files

- `.gitignore`
- `.github/workflows/lighthouse.yml`
- `README.md`
- `app.html`
- `auth.js`
- `billing.js`
- `docs/login-verification.md`
- `index.html`
- `login.html`
- `login.css`
- `login.js`
- `login-core.mjs`
- `package.json`
- `package-lock.json`
- `parent-view.js`
- `scripts/build.mjs`
- `scripts/verify.py`
- `supabase/SETUP.md`
- `supabase-config.js`
- `tests/login-security.test.cjs`
- `tests/login-routing.test.mjs`
- `vercel.json`

The generated vendor SDK and temporary responsive QA pages are not source files.
The deployed legacy `api/chat.js` must continue to be preserved by Vercel upload
reference `c3a0201c3460299c01bab11feb5c563779c3a8a6`.

## Release

Production deployment `dpl_91vesUucr7EDzcDSwEpqXZGsMgkk` is READY, based on
commit `f9b3551451fc5b457e9336effbd691537cacc26b`. The login is available at
https://nautilusclaw.com/login and https://nautilusclaw-app.vercel.app/login.
The original chat upload is preserved.

## Live checks and database blocker

Lighthouse 13.5.0, run 40415856218: login mobile and desktop each scored
100 performance, 100 accessibility, and 100 best practices. SEO is 63 because
the account page intentionally opts out of indexing; guest discovery pages retain
normal SEO. Home scored 100 in all four categories on both devices. Adventure
scored 100 in all desktop categories; the mobile run measured performance 99 and
100 for the other categories, with unchanged adventure assets.

An independent GitHub-hosted API check returned ENOTFOUND for the configured
Supabase project host on both Auth and REST routes. Real sign-in and database
access are blocked, not verified. `accountsEnabled: false` now keeps the forms
disabled with an honest unavailable message until the connected project is
restored and its RLS, email redirects and password policy are verified. Guest
learning remains available. No account records or credentials were submitted.

Live login headers confirmed CSP, no-store, no-referrer, DENY framing, and
camera/microphone/location disabled. The chat endpoint still returns its expected
405 for GET; billing configuration returns 200.

## Final release evidence

Final production deployment `dpl_EU8n2bhGMUtRDNohVFwFddHUgTwz` is READY and
serves commit `c01ce50f3e05e8d653e3966ffe516be325dd647d`. It preserves the
original chat upload. Final mobile and desktop login audits after the outage
state was published both remain 100 performance / 100 accessibility /
100 best practices / 63 SEO (intentional noindex). Mobile measured at
2026-10-26T22:57:44Z and desktop at 2026-10-26T22:58:45Z in workflow
40415856218. Live browser checks confirm the disabled forms, visible outage
message, working account-mode navigation, and no application console errors.
The final 390px preview also fits without horizontal overflow.

Next required action: add/connect the Supabase integration to inspect and restore
the intended project, verify RLS with isolated test accounts and configure email
redirects/password policy, then enable accounts and verify the complete flow.
