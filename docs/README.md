# Documentation Index

The `docs/` folder holds three different kinds of material:

1. Current operational documentation for working on the repo
2. Generated reports and release artifacts
3. Source reference materials that informed the timetable

If you are new to the repo, start with:

1. `../README.md`
2. `../AGENTS.md`
3. `TIMETABLE_DATA.md`

## Current Operational Docs

These are the most useful docs when editing the app today:

- `TIMETABLE_DATA.md`: source-of-truth rules for the timetable dataset in `scripts/data.js`
- `guides/SERVICE_WORKER_TESTING.md`: cache versioning and service worker validation workflow
- `guides/QA_CHECKLIST.md`: practical pre-merge validation checklist
- `guides/SUBSTITUTION_ENGINE.md`: subject qualification, workload policy, persistence, and substitution-engine validation
- `guides/assets.md`: icon and asset notes
- `../tests/README.md`: how to run the validation test and what to check by hand

Use the live code as the final authority if one of these guides lags behind implementation details.

## Historical Or Narrow-Scope Docs

- `guides/README-icons.md`: legacy icon note kept for traceability

Guides describing the pre-redesign modules (`perf.js`, `ui.js`, `a11y.js`, `colors.js`, the `feat_*` flag system, print/PDF export) were removed when those modules were removed. Their content is in git history if you need it.

## Generated Reports

These files are outputs, not hand-maintained specs:

- `reports/build-report.json`: machine-readable size report from `node build-report.js`
- `reports/FINAL_BUILD_REPORT.txt`: build summary artifact from a prior release cycle
- `reports/FINAL_QA_REPORT.md`: QA snapshot from a prior release cycle

The two `FINAL_*` files predate the design rebuild and describe the older architecture. Treat them as history.

Regenerate size data with:

```powershell
node build-report.js
```

## Source Reference Material

`docs/sources/` stores the timetable PDFs used as reference inputs for the current session. They are useful when reconciling timetable data, but they are not read by the running app.

## Guidance For Agents

For implementation work, the shortest reliable path is:

1. Read `../README.md`
2. Read `../AGENTS.md`
3. Read `TIMETABLE_DATA.md`
4. Inspect the live code in `scripts/`, `styles/app.css`, and `sw.js`

Treat generated reports and historical docs as supporting context, not primary truth.
