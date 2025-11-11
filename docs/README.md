# Documentation Index

The `docs/` directory collects both the long-form product guides that ship with the timetable experience and the release
artifacts generated during QA/build verification. Use this index to jump to the right reference material.

## Product Guides (`docs/guides/`)
Manual, hand-authored documentation maintained by the team. Highlights include:

- `ACCESSIBILITY_SUMMARY.md` – WCAG-focused implementation notes.
- `assets.md` – Icon and asset management guide (replaces README-icons.md).
- `COLOR_CODING_SUMMARY.md` – Subject color system reference.
- `FEATURE_FLAGS.md` – Feature flag catalogue and rollback playbook.
- `MODERN_UI_GUIDE.md` – Modern UI patterns and components.
- `PERFORMANCE.md` – Performance engineering guidelines.
- `QA_CHECKLIST.md` – End-to-end release validation steps.
- `README-icons.md` – Icon export requirements (legacy, see assets.md).
- `SERVICE_WORKER_TESTING.md` – Service worker validation procedures.
- `UPGRADE_NOTES.md` – 1.x → 2.x migration notes and history.

Add new guides here whenever we expand functionality or need deeper operational notes.

## Release Reports (`docs/reports/`)
Build outputs and QA snapshots that are typically generated during the release process:

- `docs/reports/FINAL_QA_REPORT.md` – Hand-authored final QA summary (source of truth for sign-off).
- `docs/reports/FINAL_BUILD_REPORT.txt` – Generated from `node build-report.js`.
- `docs/reports/build-report.json` – Machine-readable output from `node build-report.js`.

Generated artifacts are committed for traceability. If you regenerate a report, rerun `node build-report.js` so the latest
metrics land back in `docs/reports/`.
