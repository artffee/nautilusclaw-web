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
