# AGENTS.md

Repo guide for AI agents working in `timetable2025`.

## Start Here

Read in this order:

1. `README.md`
2. `AGENTS.md`
3. `docs/TIMETABLE_DATA.md`
4. The live file you plan to edit

If documentation disagrees with the implementation, trust the implementation and fix the docs.

## What This Repo Is

- Static PWA
- Vanilla JavaScript and CSS
- No framework, no backend, no runtime build step
- The UI is a port of the **VPPS Mobile Timetable** design canvas: one 430px shell, five views (Home, Today, Classes, Teachers, Substitutes), EN/HI, light/dark

## Source Of Truth

### Runtime

- `index.html`: markup shell only — header, empty `<main>`, bottom nav, script tags, pre-paint theme script
- `scripts/data.js`: `rawData`, bell schedule, subject categories, parser (`window.VPPSData`)
- `scripts/i18n.js`: EN/HI dictionaries and day/class translation (`window.I18n`)
- `scripts/substitution.js`: substitution matching and plan storage (`window.SubstitutionEngine`)
- `scripts/app.js`: state, view renderers, event handling
- `styles/app.css`: the whole design system
- `sw.js`: cache names, precache list, offline behaviour

Scripts load in dependency order: `data.js` → `i18n.js` → `substitution.js` → `app.js`.

### Documentation

- `README.md`: repo overview, architecture, workflows
- `docs/TIMETABLE_DATA.md`: timetable format and safe editing rules
- `docs/guides/SERVICE_WORKER_TESTING.md`: service worker workflow
- `tests/README.md`: validation entry point

### Reference-only material

- `docs/sources/`: source PDFs for timetable content
- `tools/one-off/`: historical helper scripts and patch artifact

Do not edit `docs/sources/` or `tools/one-off/` unless the task is explicitly about archival material.

## Critical Facts

### 1. Timetable data lives in `scripts/data.js`, not `index.html`

Search for `const rawData`. It moved out of `index.html` when the app was rebuilt to the design.

The current data model (Timetable 2026–27, v4) is `Period 1` through `Period 8` — no `Assembly` column. Each class row is 1 class column + 8 slots = 9 CSV columns.

Cells are `Subject (Teacher)`, `Subject (A / B)` for co-taught periods, or `Free`.

### 2. Service worker versioning is mandatory for cached runtime assets

If you change any cached runtime asset, bump both values in `sw.js`:

- `CACHE_NAME`
- `STATIC_CACHE_NAME`

This applies to `index.html`, `sw.js`, `manifest.webmanifest`, `scripts/*`, `styles/app.css`, and `icons/icon-512.png`. It does not apply to documentation-only changes.

A stale service worker is the single most common reason a local change "does not appear". Unregister it in DevTools → Application before concluding the code is wrong.

### 3. Every user-facing string needs both languages

New copy goes in **both** the `en` and `hi` blocks of `scripts/i18n.js`. `tests/substitution-engine.test.js` asserts that the two dictionaries expose identical key sets, so a one-sided addition fails the test.

Day names and class names are translated by `I18n.dayLabel()` and `I18n.classLabel()`, not by dictionary key.

### 4. Teacher and substitution views are derived data

Changing any `Subject (Teacher)` cell affects the class view, the teacher view, free-teacher lists, and the substitution planner. Treat teacher names as identifiers, not cosmetic labels.

### 5. There is no feature-flag system any more

The old `feat_*` flags went away with `perf.js`, `ui.js`, `a11y.js`, and `colors.js`. `localStorage` now holds only preferences: `vppsm_theme`, `vppsm_me`, `vppsm_cls`, `vppsm_tsel`, and `vpps-language`.

### 6. Print/PDF export and the free-teacher finder were removed

The design has no place for them. Do not reintroduce them without an explicit request.

## Safe Edit Workflow

### Timetable change

1. Locate the correct day and class row in `rawData` in `scripts/data.js`.
2. Preserve the CSV shape and `Subject (Teacher)` formatting.
3. Verify the affected class, teacher, and day views.
4. Bump the service worker version.

### UI change

1. Layout and copy: `scripts/app.js`. Tokens and component styling: `styles/app.css`.
2. Add any new string to both dictionaries in `scripts/i18n.js`.
3. Verify in the browser, in both languages and both themes.
4. Bump the service worker version.

### Docs-only change

Update the doc. No service worker bump needed.

## Validation Commands

```powershell
npx http-server . -p 8080 -c-1
node --test tests/substitution-engine.test.js
node --check scripts/app.js
node build-report.js
git diff --stat
```

Minimum expectations:

- inspect the exact view you changed
- run the substitution test after any `i18n.js` or `substitution.js` edit
- regenerate the build report after meaningful runtime edits

## Fast Code Navigation

```powershell
rg -n "const rawData|const PERIODS|function parseTimetable" scripts/data.js
rg -n "function render|const ACTIONS|const state" scripts/app.js
rg -n "function buildPlan|shareText|showToast" scripts/app.js
rg -n "CACHE_NAME|STATIC_CACHE_NAME|CORE_ASSETS" sw.js
rg -n "dictionaries|dayLabel|classLabel" scripts/i18n.js
```

## Files Most Agents Actually Need

- `README.md`
- `AGENTS.md`
- `scripts/app.js`
- `scripts/data.js`
- `styles/app.css`
- `sw.js`
- `docs/TIMETABLE_DATA.md`

## Common Mistakes

- Looking for `rawData` or the view renderers in `index.html` — they live in `scripts/`.
- Forgetting to bump `sw.js` cache versions, then debugging a cached old file.
- Adding a string to `en` but not `hi`, which fails the parity test.
- Hand-tuning colours or radii in `styles/app.css` instead of keeping them aligned with the design canvas.
- Treating `docs/sources/` PDFs as runtime assets.
- Editing `tools/one-off/` helper scripts as if they are part of the product.

## Current Repo Organization

- Root: runtime entry point and primary docs
- `scripts/`, `styles/`: the runtime app
- `docs/`: curated documentation, reports, and source reference material
- `tests/`: script-based and manual validation
- `tools/one-off/`: historical helper artifacts

Keep new runtime files near the existing runtime structure. Do not put one-off migration scripts back in the repo root.
