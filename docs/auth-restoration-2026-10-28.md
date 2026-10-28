# Parent authentication restoration — October 28, 2026

## Status: provider restored; public activation blocked

The original Supabase project `zijjkbtxqjhnretrxawk` in the CaptainNemo
organization was found through the authorized integration with status `INACTIVE`.
Its restore operation succeeded and status subsequently became `ACTIVE_HEALTHY`.
No replacement project was created. Its URL and enabled publishable key match
the existing production configuration. The earlier DNS error did not prove deletion.

The live Auth settings and REST endpoints now respond. **Do not set
`accountsEnabled: true` yet.** Email confirmation is disabled, the provider
accepts passwords shorter than the app's required 12 characters, and complete
email verification/recovery has not been tested.

Production stays at https://nautilusclaw.com/login and
https://nautilusclaw-app.vercel.app/login with account forms disabled. No website
deployment was made during this repair. `BILLING_MODE` remains disabled.

## Applied database repair

Migration `20261028165233_harden_parent_auth_isolation` was applied to the
original hosted database. The matching migration is retained in this repository;
the fresh-install schema includes the same rules. No existing family data was
changed by the migration.

- All five application tables (`parent`, `child`, `message`, `concern`, `summary`)
  retain RLS. Policies explicitly target authenticated users and check ownership
  for both existing and resulting rows.
- Anonymous/PUBLIC table grants were removed. Authenticated users retain only
  SELECT/INSERT/UPDATE/DELETE, with unnecessary TRUNCATE/REFERENCES/TRIGGER grants
  revoked. Guests do not use these database tables.
- Concerns may reference only a message belonging to the same owned child.
- The signup trigger function keeps its necessary privileged execution, but its
  search path is empty and browser roles can no longer call it as an RPC.
  Real signup still creates a parent row successfully.
- The security advisor's two public-function warnings cleared. Its remaining
  warning is disabled leaked-password protection. See the
  [provider remediation guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Confirmed live tests

Two disposable parent accounts were created via the real public Auth API, using
random credentials held only in process memory and reserved `example.invalid`
addresses. Because the provider currently auto-confirms email, no confirmation
emails were sent. These tests verify the API behavior under the current unsafe
confirmation setting; they do **not** verify mailbox ownership or the complete
browser signup journey.

| Check | Observed result |
| --- | --- |
| Signup and automatic parent-row creation, both accounts | Pass; new parent state was empty |
| Email/password API sign-in, both accounts | Pass |
| Own parent-state update and own child/message/concern/summary insertion | Pass |
| A reading/updating/deleting B's rows, and B doing the same to A | All five tables return no rows; no cross-account mutation |
| Inserting records owned by the other parent | Rejected with 403 / SQLSTATE 42501 on all five tables |
| Reassigning a child to the other parent | Rejected in both directions |
| Referencing the other parent's message from an owned concern | Rejected in both directions |
| Anonymous reads of all five application tables | Rejected with 401 |
| Global API sign-out, both accounts | 204 |
| Refresh-token use after sign-out, both accounts | Rejected with 400 |
| Email confirmation required before a session is issued | **Fail: `mailer_autoconfirm: true`** |
| Server rejects an eight-character replacement password | **Fail: accepted with 200**; the disposable account's strong password was immediately restored |

The diagnostic recorded 72 checks: 70 passed and the two launch checks above
failed. Sanitized per-check evidence is in
[`auth-restoration-api-results.json`](auth-restoration-api-results.json).
Sign-out invalidates refresh sessions; this is not a claim that already-issued
access JWTs become instantly invalid on every service.

Both disposable accounts were signed out, then removed with their cascading test
records. Exact counts returned to the three pre-existing Auth users and three
parent rows. No disposable test users or sessions remain.

## Application and production preservation

- Existing suite: 52/52 tests pass. Build passes for 35 public assets; static
  verification passes for 12 pages. Guest separation, learning games, stories,
  login routing/session handling, and legacy CommonJS compatibility remain covered.
- Live browser: login still disables email/password/submit controls. Continue as
  guest opens the story library and starts The Moonlight Post Office without a
  child's name, an account, or microphone access.
- Live login returns 200 with CSP, DENY framing, no-store, no-referrer, and
  camera/microphone/geolocation disabled. This turn did not repeat the prior
  320/390/1440px responsive audit; no interface assets changed.
- Live billing config is `{"ready":false,"mode":"disabled"}`. No subscription
  setup, purchase, or billing activation was performed.
- Existing production deployment `dpl_5U62MGJXDfekzVBWhbV7D4AwmJ6S` includes
  `api/chat.js` with upload SHA `c3a0201c3460299c01bab11feb5c563779c3a8a6`.
  GET `/api/chat` still gives the expected 405. A full authenticated AI response
  was not retested. The preserved source and CommonJS package scope must remain.
- This repair branch disables its own automatic Git deployments so review does
  not accidentally publish the incomplete repository-only backend.

## Access and checks still needed before activation

The connected Supabase tools can restore/query the project but do not expose
Auth configuration. The dashboard opened at the sign-in screen; the secure
sign-in request did not complete. No dashboard session was established.

1. Complete authorized dashboard access to this original project. Turn on email
   confirmation; set the server minimum password length to 12; inspect password
   requirements and leaked-password protection availability. Do not purchase an
   upgrade without separate authorization.
2. Inspect SMTP/sender-domain verification, email templates, delivery logs, Auth
   rate limits, and email-link expiration. These settings remain **unverified**.
3. Set/verify Site URL `https://nautilusclaw.com` and the exact `/login?mode=signin`
   and `/login?mode=reset` redirects on `https://nautilusclaw.com`,
   `https://www.nautilusclaw.com`, and `https://nautilusclaw-app.vercel.app`.
   Do not use production wildcards. Verify templates honor the intended redirect.
4. Use two controlled, deliverable test mailboxes (or verified aliases). Exercise
   signup -> email receipt -> confirmation -> sign-in -> parent data -> sign-out,
   then recovery-email receipt -> recovery link -> new password -> fresh sign-in.
   Check weak-password rejection, invalid/expired/reused links, redirect rejection,
   account isolation, and production/mobile browser behavior. Never claim admin
   confirmation or synthetic inboxes demonstrate email delivery.
5. Only after those pass, activate the forms and deploy through the preserved-file
   Vercel workflow. Include the exact original chat upload reference. Keep billing
   disabled. Verify both production login addresses and guest learning after release.

Current external requirements: Supabase dashboard access for Auth settings and
access to two real test inboxes. GitHub, Vercel, and Supabase database access are
already available; no replacement provider or new project is needed.
