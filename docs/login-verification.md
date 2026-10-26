# Parent login verification

Implemented October 26, 2026 for NautilusClaw Kids.

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

44 unit tests pass, including sign-out races, token clearing, guest isolation,
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
- `tests/login-security.test.cjs`
- `tests/login-routing.test.mjs`
- `vercel.json`

The generated vendor SDK and temporary responsive QA pages are not source files.
The deployed legacy `api/chat.js` must continue to be preserved by Vercel upload
reference `c3a0201c3460299c01bab11feb5c563779c3a8a6`.
