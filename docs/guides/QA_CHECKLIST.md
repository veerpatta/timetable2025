# QA Checklist

Use this checklist before merging meaningful runtime changes. The goal is to keep the validation practical and matched to this repo's actual architecture.

## Always Check

- the app loads without console errors
- the exact user flow you changed still works
- the timetable still parses correctly
- no obvious layout regression appears on desktop or mobile width

## Before The Live Site

Deploy to staging and exercise it there. It runs the same code against a
separate database, so nothing you try reaches the staff.

```powershell
firebase deploy --only hosting:test --project schoolfeespro
```

Then open <https://vpps-timetable-test.web.app> and confirm the Substitutes
screen shows the red **TEST database** badge. If it says "Saved to the school
database" you are on the live site - stop.

## If You Changed The Substitution Engine

- a teacher who takes that class is preferred over an outside subject specialist
- nobody is proposed for two classes in the same period
- no single teacher collects most of the chart
- a teacher with a restricted shift is never given cover outside it
- a period nobody can cover reads **Self Study**, not an error
- tap a period, swap the cover, confirm the pin survives and the rest re-allocates
- send the WhatsApp message and read it as a teacher would

## If You Changed Timetable Data In `scripts/data.js`

- verify the affected day view
- verify the affected class view
- verify the affected teacher view
- confirm the edited row still matches the header width (1 class column + 8 periods = 9 CSV columns)
- bump the service worker cache version in `sw.js`

## If You Changed The UI

- check the view in both languages (header language button)
- check the view in both themes (header theme button)
- check at phone width and at desktop width
- confirm no horizontal page scroll appears; wide grids must scroll inside their own container
- confirm the bottom nav still clears the last card

## If You Changed Copy Or `scripts/i18n.js`

- run:

```powershell
node --test tests/substitution-engine.test.js
```

- the dictionary parity test fails if a key exists in `en` but not `hi`

## If You Changed Substitution Logic

- run the same Node test
- mark two or three teachers absent in the app and confirm the plan groups, cover pills, and share output look right
- confirm co-taught (ELGA) periods still show "Team covers"

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
