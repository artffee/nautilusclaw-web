# NautilusClaw Kids

A voice-first AI learning companion for children ages 3–12. Free forever, local-first, GDPR-ready.

> 🪼 Live: **[nautilusclaw.vercel.app](https://nautilusclaw.vercel.app)**

## What's in here

Three single-file static pages plus a shared auth module — no build step, no backend, deployable to any static host.

| File | Purpose |
| --- | --- |
| `index.html` | Marketing site (`/`) — editorial hero, age groups, mobile mockup, parent dashboard preview, pricing, voices |
| `app.html` | Kid app (`/app`) — voice chat with Nautilus, Stories, Puzzles, Growth tabs |
| `parent.html` | Parent dashboard (`/parent`) — emotion timeline, mood journal, full chat audit, art history, settings |
| `auth.js` | Shared client-side auth (localStorage + SHA-256 salted hashes, sign-in modal injection, user pill) |
| `vercel.json` | Clean URLs, security headers (`Permissions-Policy: microphone=(self)` for the voice app) |

## Features

- **Real Claude integration** — BYO Anthropic API key (Haiku 4.5 / Sonnet 4.6 / Opus 4.7). Falls back to canned demo replies for visitors without a key.
- **Age-aware system prompts** — three calibrated personas for ages 3–5, 6–8, 9–12 (per [spec §3.2](#))
- **Crisis detection** — 15 trigger phrases scanned client-side before the LLM call. Triggers a calm full-screen overlay with localized helplines (EU 116 111, UK 0800 1111, US 988, BG 116 111).
- **Parallel emotion analysis** — every utterance gets a separate 8-token Claude call to tag emotion (`happy/excited/curious/playful/sad/frustrated/worried/neutral`), surfaced in the parent dashboard
- **Wellbeing trend tracking** — 3 negative emotions in a row logs a private parent note
- **Voice input** — Web Speech API where supported, type-fallback elsewhere
- **PWA-friendly** — installable, offline-tolerant
- **Auth** — client-side sign up / sign in. Salted SHA-256 hashes via `crypto.subtle`. Cross-tab sync via `storage` event. Account-scoped state (kid profile, progress, history).
- **GDPR Article 17** — one-click "Erase all data" deletes the entire account record

## Local dev

It's static HTML — there's nothing to install. Just serve the folder:

```bash
npx serve .
# or
python -m http.server 3000
```

Open `http://localhost:3000`. The Anthropic API uses `anthropic-dangerous-direct-browser-access` for direct browser calls, so the BYO-key flow works locally as well.

## Deploy

Vercel:

```bash
vercel --prod
```

Any static host works — `vercel.json` is the only Vercel-specific file (and is harmless on others).

## Tech stack

- Vanilla HTML / CSS / JS
- Fonts: Fraunces (display) + Instrument Sans (body) + JetBrains Mono (code)
- No frameworks. No build step. No transpiler.
- Anthropic Messages API (browser-direct via `anthropic-dangerous-direct-browser-access`)
- Web Speech API for voice input
- localStorage + SubtleCrypto for client-side auth

## Roadmap

- Real backend (Node + SQLite per [spec §4](#)) for cross-device sync
- Stripe Checkout for optional Premium support tier
- Capacitor wrappers for iOS / Android binaries
- Open-source the safety filters once formal review is complete

## License

MIT (pending a final license file). Built by parents who think kids should learn to wonder for free.
