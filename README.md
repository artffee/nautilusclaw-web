# NautilusClaw Kids

Live: https://nautilusclaw-app.vercel.app/

## October 26, 2026 update

- A responsive cream, coral and ocean-green homepage with explicit pricing and availability.
- `/adventure`: a complete written ocean expedition with ages 3–5, 6–8 and 9–12, gentle hints, story choices, optional browser read-aloud, an offline activity and print support.
- `/parent-preview`: clearly labeled sample or an explicitly saved device-only guest recap. It loads no account SDK and sends no adventure choices to an AI provider.
- `/parent`: existing Supabase parent accounts, actual saved message counts and conversations, exports, printing, and confirmed clearing of learning data. No invented emotion graphs or development scores.
- `/guide`: factual privacy, safety, beta terms and availability information. No certification or press-endorsement claims.
- `/app`: preserved chat beta, with its obsolete API-key form replaced by accurate server-connection status and labeled sample replies.

## Production source recovery

The live Vercel deployment contained newer Supabase authentication, password recovery and server-based chat code than the previous GitHub main branch. The current frontend was recovered from the live deployment before these edits.

The existing `api/chat.js` server function must be retained by its Vercel file SHA in `deployment-preserved-files.json`. The available source retrieval tool truncated the server file; this repository therefore does not yet contain its full source. Do not deploy just the repository's files or replace that function with a stub. Create a deployment with the frontend files plus the preserved uploaded-file reference. Existing project environment variables remain on Vercel.

`supabase-config.js` contains the existing public anonymous client configuration; server secrets are not part of this checkout. No database schema changes were made by this update. Existing Supabase policies and the signed-in production flow still require separate end-to-end verification with a test parent account.

## Checks

```sh
python scripts/verify.py
node --test tests/auth-clear.test.cjs
```

Browser QA: complete guest journey, incorrect/correct answer feedback, story choices, opt-in recap saving and retrieval, distinct sample labeling, and phone-width layouts. Clearing account data is covered with success/failure database mocks; no real account data was erased during testing.

## Boundaries

This is an educational beta. The guest adventure is written content, not generative AI. Cloud AI availability, provider processing, browser speech behavior, and parent account storage are disclosed. There is no native app-store release, medical monitoring, or guaranteed parent-alert service. The Family subscription integration is prepared; checkout stays disabled until server credentials and the complete Stripe sandbox journey are verified.

## Family billing update

See [BILLING_SETUP.md](BILLING_SETUP.md) for exact sandbox resources, server key requirements, activation steps, and validation limits. New `/pricing` and `/billing` pages show $6.99/month or $59/year with clear renewal and cancellation details. Hosted Stripe Checkout, parent-owned customer portal, signed lifecycle webhooks, and server-side subscription verification are implemented. No live payments were enabled. `npm test`, `npm run verify`, and `npm run build` cover this release.

Only explicitly allowed public assets are copied to `dist`; server helpers and configuration secrets stay outside the static output. Preserve the existing uploaded `api/chat.js` file when deploying.


## Free learning games

`/learn` offers Math reef, an A–Z Alphabet garden, Letter detective / Word builder, and Pattern lagoon. Three age-guide levels change the puzzles. Five-puzzle rounds give hints and a clear ending; the alphabet can be explored freely. Game state stays in memory, with no accounts, analytics, or saved scores. Read-aloud is optional and uses browser speech. The production address is https://nautilusclaw.com.
