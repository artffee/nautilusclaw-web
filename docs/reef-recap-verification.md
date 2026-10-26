# Curious Reef recap verification — October 26, 2026

## Scope

Personal, device-only Curious Reef results; correct-answer progression; companion grammar; coral contrast; free pricing clarity; search metadata. Google Analytics was intentionally omitted because the request explicitly forbids tracking or new data collection. No account, microphone, server-side learner records or analytics were added.

## Automated and browser checks

- 33 tests passed. Internal links, anchors, JavaScript and JSON-LD syntax passed. Static build includes 31 explicitly allowed public assets.
- 390px iframe viewport: ages 3–5; wrong then correct camouflage answers; two wrong counting answers and one correct answer; story button hidden until correct; octopus/coral garden story; final grammar correct; save requires grown-up checkbox; actual recap survives navigation/reload and shows 2 hints.
- 1440px iframe viewport: ages 9–12; first-try correct answers; turtle/sunlit shallows story; personal recap shows 12 fish, one try, zero hints and current age level, taking precedence over the earlier saved recap.
- Neither adventure nor recap had horizontal overflow in those viewports. No app-origin console errors were returned (browser-extension metadata errors are unrelated to the app).
- `/parent-preview` remained clearly marked as an illustrative sample even with a personal recap saved. Sample code no longer reads browser storage.
- Print buttons share the actual recap content; finish-screen print CSS includes the hidden personal recap. The browser print action was exercised, but this environment did not expose a native print-preview dialog or physical printer output.
- White on coral `#ba4129`: 5.42:1; white on hover `#a93823`: 6.41:1. Every shared coral button uses these states.

## Lighthouse baseline (live production, before deployment)

Lighthouse 13.5.0, default mobile and desktop presets, all four categories enabled. Public pages tested from isolated GitHub-hosted Ubuntu runners. No browser trust changes or certificate bypasses were used in these successful audits.

Run: https://github.com/artffee/nautilusclaw-web/actions/runs/40409534945

| Page | Device | Performance | Accessibility | Best practices | SEO |
| --- | --- | ---: | ---: | ---: | ---: |
| `/` | Mobile | 98 | 96 | 100 | 100 |
| `/` | Desktop | 100 | 96 | 100 | 100 |
| `/adventure` | Mobile | 99 | 96 | 100 | 100 |
| `/adventure` | Desktop | 100 | 96 | 100 | 100 |

The baseline identifies the existing coral buttons and small coral brand text as contrast failures. Scores are observed lab results, not a promise of identical performance on every run.

## Final deployed checks

The final application source is commit `ccdc18838d2e75c47e7725bcb85d32fc00cfcf30` and production deployment `dpl_AEL883hr6SiuqF2hzaQnTbhRtV2c`. The existing `api/chat.js` upload SHA `c3a0201c3460299c01bab11feb5c563779c3a8a6` was preserved. The deployed chat endpoint returns its expected 405 for GET; billing configuration returns 200 with mode disabled.

Both the 390px and 1440px runs were repeated against the deployed `/adventure` in fixed-width browser frames. Phone: ages 6–8, camouflage retry, 6 then 7 fish, one hint, octopus/coral garden; desktop: ages 9–12, 12 fish on the first try, turtle/sunlit shallows. Both reached the finish screen without app-origin console errors. The live personal recap shows real answers and hints, and its Save recap action confirms a device-only save. A separate direct public-page run verified the same personal recap end to end. Browser printing remains subject to the native-preview limitation above.

The home-page monthly/yearly controls still switch between $6.99/month and $59/year and preserve the matching billing link. To reduce mobile startup work, `home.js` loads the existing billing module when pricing approaches the viewport, with a fast-click/keyboard fallback. The build embeds the exact shared home CSS rather than making two render-blocking stylesheet requests. Source CSS remains shared, and the build checks confirmed an exact match. Neither change alters the design or introduces tracking.

Final Lighthouse run: https://github.com/artffee/nautilusclaw-web/actions/runs/40409894197

| Page | Device | Performance | Accessibility | Best practices | SEO |
| --- | --- | ---: | ---: | ---: | ---: |
| `/` | Mobile | 100 | 100 | 100 | 100 |
| `/` | Desktop | 100 | 100 | 100 | 100 |
| `/adventure` | Mobile | 100 | 100 | 100 | 100 |
| `/adventure` | Desktop | 100 | 100 | 100 | 100 |

Mobile-home preliminary runs scored 72 and 92 for performance. Deferring billing work restored 98; inlining home styles brought the final measured result to 100. Final results are measured lab scores, not a guarantee for every device or run. The unchanged adventure assets retain their successful post-fix audit results. Personal recap and account pages intentionally retain noindex rather than seeking an SEO score for private content.

## Files changed in this request

- `.github/workflows/lighthouse.yml`
- `README.md`
- `adventure.html`
- `adventure.js`
- `docs/reef-recap-verification.md`
- `guide.html`
- `home.js`
- `index.html`
- `learn.html`
- `ocean.css`
- `parent-preview.html`
- `parent-view.js`
- `pricing.html`
- `recap.html`
- `recap.js`
- `reef-recap.mjs`
- `robots.txt`
- `scripts/build.mjs`
- `scripts/verify.py`
- `sitemap.xml`
- `stories.html`
- `tests/reef-recap.test.mjs`
