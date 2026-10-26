# Supabase setup (Phase 1, problem #2)

This replaces the localStorage "auth" with real sign-in, a Postgres database, and
row-level security so a parent can only ever see their own family's data — syncing
across the kid's tablet and the parent's phone.

## 1. Create the project (free tier is fine)

1. Go to <https://supabase.com> → **New project**.
2. Pick a name (e.g. `nautilusclaw`), a strong database password, and a region near your users (EU for GDPR).
3. Wait ~2 minutes for it to provision.

## 2. Create the tables + security rules

1. In the project: **SQL Editor → New query**.
2. Paste the entire contents of [`schema.sql`](./schema.sql) and click **Run**.
3. You should see "Success". This creates `parent`, `child`, `message`, `concern`,
   `summary` and enables Row-Level Security on all of them.

## 3. (Recommended) Turn on email confirmation

**Authentication → Providers → Email** is on by default. For a child-data product,
keep "Confirm email" enabled so accounts are verified.

## 4. Get your keys

**Project Settings → API**, copy two values:

| Value | Where it goes | Secret? |
| --- | --- | --- |
| **Project URL** (`https://....supabase.co`) | `supabase-config.js` | Public — safe in the browser |
| **anon / public key** | `supabase-config.js` | Public — protected by RLS |
| service_role key | server functions only (later) | **SECRET — never in client code** |

Then:

```bash
cp supabase-config.example.js supabase-config.js
# edit supabase-config.js — paste the Project URL and anon key
```

## 5. Hand the two public values back to me

Paste the **Project URL** and the **anon (public) key** and I'll wire `auth.js`,
`app.html`, and `parent.html` to use the database instead of localStorage. (These two
are public by design — they ship in the browser anyway. Do **not** share the
`service_role` key.)

## What you get after wiring

- Real sign-in that works across devices (kid's tablet ↔ parent's phone)
- Every chat, emotion tag, and safety flag stored per child, readable only by that parent
- One-click GDPR erase that cascades server-side
- The foundation for real (non-mock) learning summaries and parent alerts



## Dedicated parent login (October 2026)

`/login` reuses this project's Auth service and `public.parent` table. It asks only
for a grown-up's email and password; it does not import guest records or create
child profiles. Passwords go directly to Supabase Auth, never into `parent.state`.
The SDK is pinned in package-lock.json and copied locally at build time.

Before declaring live authentication verified, use the Supabase dashboard or a
connected Supabase integration to confirm:

- This existing project is active and the schema above is installed. Preserve
  existing records. Check RLS on every exposed table, including any billing
  tables. Test two disposable parent accounts against one another's row IDs.
- Email/password authentication and email confirmation are enabled. Set the
  provider's minimum password length to 12 and enable leaked-password protection
  if available. The page enforces 12–128 characters for new passwords, but that
  alone does not change the provider's server policy.
- Site URL is `https://nautilusclaw.com`. Add exact redirect URLs for both
  `/login?mode=signin` and `/login?mode=reset` on `https://nautilusclaw.com`,
  `https://www.nautilusclaw.com`, and `https://nautilusclaw-app.vercel.app`.
  Do not add production wildcards. Confirm email templates use the redirect URL.
- Configure verified email delivery and confirm the service's authentication
  rate limits. No client-only lockout is presented as brute-force protection.
- Verify signup → confirmation → sign-in → parent row → sign-out, plus the full
  emailed password recovery flow. No successful live flow has been claimed while
  the provider connection remains unavailable.

Sessions now use sessionStorage (with an in-memory fallback when unavailable),
so parents sign in again in a new browser tab. The old localStorage session is
not reused and is removed on sign-out. No password is saved by this application.
Recovery links can establish a session in a new tab; after a successful password
change, this app signs that tab out and asks for a fresh sign-in.

Current blocker: the configured project hostname returned ENOTFOUND from a hosted
runner. Restore or connect the intended project, verify the settings and isolation
above, then set `accountsEnabled: true` in `supabase-config.js` and redeploy.
