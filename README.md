# NautilusClaw Kids

Live: https://nautilusclaw.com/

## Parent authentication repair — October 28, 2026

The original Supabase project is restored and its database access hardened.
Real API signup/sign-in/sign-out and isolation between two disposable parents
were tested. Public account forms remain disabled because email confirmation and
the server password policy failed launch checks; emailed verification/recovery
still needs dashboard and test-mailbox access. See the
[restoration report](docs/auth-restoration-2026-10-28.md). No website deployment or
paid billing activation was performed.

## October 26, 2026 update

- A responsive cream, coral and ocean-green homepage with explicit pricing and availability.
- `/adventure`: a complete written ocean expedition with ages 3–5, 6–8 and 9–12, gentle hints, story choices, optional browser read-aloud, an offline activity and print support.
- `/parent-preview`: illustrative sample only, never a personal record. `/recap` shows actual guest answers and story choices without an account SDK or network submission.
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

## Storybook Club

`/stories` adds five complete written adventures: Nia and the Planet Parade, The Moonlight Post Office, The Forest of Lost Sounds, The Great Dino Picnic, and The Dragon Who Lost His Roar. Each has three reading levels, two independent choices (four path/ending combinations), an age-adjusted number or planet-order puzzle, hints, optional browser speech with a stop control, and a complete printable story. All 60 combinations are validated. The original Curious Reef remains at `/adventure`, linked from the library. Storybook choices stay in page memory; no account, analytics, payment code, or persistent reading record is added.

Validate with `npm test`, `npm run verify`, and `npm run build`. Preserve the uploaded `api/chat.js` SHA when publishing, as described above.

### Planet story

`/stories?story=planets` tells Nia and the Planet Parade. A tap-to-order puzzle covers Mercury through Mars for ages 3–5 and all eight planets for the older levels, with undo, clear, hints, and an optional reference map. No dragging is required. Planet names/order and the star/dwarf-planet distinction were checked against NASA: https://science.nasa.gov/solar-system/planets/ and https://science.nasa.gov/solar-system/planets/planet-sizes-and-locations-in-our-solar-system/. Illustrations explicitly show neither real scale nor current positions.

## Curious Reef recap and accessibility fixes

- `reef-recap.mjs` shares the age-specific content, answer validation, story wording, storage validation and recap rendering between the adventure and `/recap`.
- Completed session recaps use `sessionStorage` (`nautilus-reef-session-v2`). Permanent `localStorage` saving still requires the grown-up checkbox; legacy version-1 recaps remain readable with missing-answer details explicitly disclosed. Restarting clears current results without erasing a separately saved recap. Storage failures keep the recap readable and printable on the finish screen.
- Actual camouflage attempts, counting attempts and displayed hints are included with age level, companion and place. Both Print recap controls use the personal recap; `/parent-preview` always remains a sample.
- Counting progression stays hidden and locked until a correct answer. Returning to a solved question preserves its result. All companion/story combinations use appropriate articles.
- Shared coral uses white text on #ba4129, with a darker #a93823 hover state. The existing pricing section now explicitly says guest learning is free, has no ads and needs no account.
- Canonicals, Open Graph metadata, WebSite structured data, robots.txt and a sitemap improve search discovery. Personal/account recap pages stay noindex. No Google Analytics, tags, pixels, external analytics scripts, new accounts or server collection were added.
- `npm test` covers answer attempts, hint counts, all companion/place combinations, fresh starts, legacy/malformed records, blocked storage, sample separation and contrast; `npm run verify` checks page destinations, anchors, JS and JSON-LD syntax.

Live before/after Lighthouse results, full guest-flow checks, changed files and verification limits are recorded in [docs/reef-recap-verification.md](docs/reef-recap-verification.md). Home billing work is deferred until pricing approaches the viewport; home CSS is inlined from the shared source during the build.


### Dark parent login

The responsive `/login` page includes sign-in, parent registration, password
recovery, accessible form states, and an always-visible guest option. It uses
the existing Supabase database and a pinned, locally served SDK. See
[supabase/SETUP.md](supabase/SETUP.md) for provider configuration and
[docs/login-verification.md](docs/login-verification.md) for verification limits.
