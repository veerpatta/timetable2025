# QA Checklist

Use this checklist before merging meaningful runtime changes. The goal is to keep the validation practical and matched to this repo's actual architecture.

## Always Check

- the app loads without console errors
- the exact user flow you changed still works
- the timetable still parses correctly
- no obvious layout regression appears on desktop or mobile width

## If You Changed Timetable Data In `index.html`

- verify the affected day view
- verify the affected class view
- verify the affected teacher view
- confirm the edited row still matches the header width
- confirm `Assembly` plus `Period 1` through `Period 8` remain aligned
- bump the service worker cache version in `sw.js`

## If You Changed `scripts/colors.js` Or Color Tokens

- run:

```powershell
node tests/manual/test-mapping.js
node tests/manual/colors/verify-contrast.js
```

- open `tests/manual/colors/test-colors.html`
- verify no new subject naming broke category mapping

## If You Changed Accessibility Or UI Behavior

- open `tests/manual/accessibility/test-a11y.html`
- test keyboard navigation
- press `?` for shortcuts
- press `m` for theme toggle
- press `k` for high contrast
- press `Esc` to close dialogs

## If You Changed Performance Logic

- open `tests/manual/performance/perf-test.html`
- verify the main app still renders correctly
- confirm search or render interactions still feel responsive

## If You Changed A Cached Runtime Asset

- bump both service worker cache constants in `sw.js`
- load the app locally with `npx http-server . -p 8080 -c-1`
- verify the new service worker activates
- verify old cache versions are removed
- verify offline reload still works

## If You Changed Build-Significant Runtime Files

Run:

```powershell
node build-report.js
```

Check:

- the report updates successfully
- bundle size remains reasonable for the app shell
- no unexpected large asset slipped into the runtime surface

## Manual Smoke Test

At minimum, click through:

- Dashboard
- Day view
- Class view
- Teacher view
- Substitution view if your change touches teacher or timetable logic

## Final Pre-Merge Check

- `git diff --stat` looks intentional
- documentation is updated if behavior changed
- no one-off helper script or source PDF was accidentally edited for a runtime task
