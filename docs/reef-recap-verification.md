# Curious Reef recap verification — October 26, 2026

## Scope

Personal, device-only Curious Reef results; correct-answer progression; companion grammar; coral contrast; free pricing clarity; search metadata. Google Analytics was intentionally omitted because the request explicitly forbids tracking or new data collection. No account, microphone, server-side learner records or analytics were added.

## Automated and browser checks

- 33 tests passed. Internal links, anchors, JavaScript and JSON-LD syntax passed. Static build includes 30 explicitly allowed public assets.
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

## Post-deployment checks

Pending live verification and follow-up Lighthouse results. This section will be replaced with measured results before handoff.
