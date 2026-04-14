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

- `TIMETABLE_DATA.md`: source-of-truth rules for the inline timetable dataset in `index.html`
- `guides/FEATURE_FLAGS.md`: current flag behavior and where each flag is read
- `guides/SERVICE_WORKER_TESTING.md`: cache versioning and service worker validation workflow
- `guides/QA_CHECKLIST.md`: practical pre-merge validation checklist
- `../tests/README.md`: how to run the lightweight validation tools

## Feature Reference Guides

These explain focused areas of the app and are useful for background context:

- `guides/ACCESSIBILITY_SUMMARY.md`
- `guides/COLOR_CODING_SUMMARY.md`
- `guides/MODERN_UI_GUIDE.md`
- `guides/PERFORMANCE.md`
- `guides/assets.md`

Use the live code as the final authority if one of these guides lags behind implementation details.

## Historical Or Narrow-Scope Docs

- `guides/README-icons.md`: legacy icon note kept for traceability
- `guides/UPGRADE_NOTES.md`: historical upgrade context rather than day-to-day operating guidance

## Generated Reports

These files are outputs, not hand-maintained specs:

- `reports/build-report.json`: machine-readable size report from `node build-report.js`
- `reports/FINAL_BUILD_REPORT.txt`: build summary artifact
- `reports/FINAL_QA_REPORT.md`: QA snapshot from a prior release cycle

Regenerate size data with:

```powershell
node build-report.js
```

## Source Reference Material

`docs/sources/` stores the timetable PDFs that were used as reference inputs for the current session. They are useful when reconciling timetable data, but they are not read by the running app.

## Guidance For Agents

For implementation work, the shortest reliable path is:

1. Read `../README.md`
2. Read `../AGENTS.md`
3. Read `TIMETABLE_DATA.md`
4. Inspect the live code in `index.html`, `sw.js`, and the touched module

Treat generated reports and historical docs as supporting context, not primary truth.
