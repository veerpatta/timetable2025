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
- No framework
- No backend
- No runtime build step
- Main logic concentrated in `index.html`

## Source Of Truth

### Runtime

- `index.html`: app shell, flags, timetable data, parser, renderers, exports, initialization
- `sw.js`: cache names, precache list, offline behavior
- `scripts/*.js`: modular helpers used by `index.html`
- `styles/*.css`: styling layers

### Documentation

- `README.md`: repo overview and workflows
- `docs/TIMETABLE_DATA.md`: timetable format and safe editing rules
- `docs/guides/FEATURE_FLAGS.md`: current flag behavior
- `docs/guides/SERVICE_WORKER_TESTING.md`: current service worker workflow
- `tests/README.md`: validation entry point

### Reference-only material

- `docs/sources/`: source PDFs for timetable content
- `tools/one-off/`: historical helper scripts and patch artifact

Do not edit `docs/sources/` or `tools/one-off/` unless the task is explicitly about archival material.

## Critical Facts

### 1. Timetable data lives inside `index.html`

Search for `const rawData`.

The current data model includes:

- `Assembly`
- `Period 1` through `Period 8`

So each class row is:

- 1 class column
- 9 timetable slots
- 10 CSV columns total

Many older notes in the repo talk about only 8 periods. That is stale for the current app because `Assembly` is now part of the parsed timetable structure.

### 2. Service worker versioning is mandatory for cached runtime assets

If you change any cached runtime asset, bump both values in `sw.js`:

- `CACHE_NAME`
- `STATIC_CACHE_NAME`

This applies to changes in:

- `index.html`
- `sw.js`
- `manifest.webmanifest`
- `scripts/*`
- `styles/*`
- `icons/icon-512.png`

It does not apply to documentation-only changes.

### 3. Feature flags are split across two systems

Inline flags in `index.html`:

- `feat_dark_mode`
- `feat_color_coding`
- `feat_modern_ui`
- `feat_perf_opt`

Module-local flags:

- `scripts/a11y.js` uses `feat_accessibility` in `localStorage` and defaults to enabled.
- `scripts/perf.js` stores sub-feature flags inside `localStorage.feat_perf_opt`.
- `scripts/colors.js` and `scripts/ui.js` can also read persisted flag values.

If a flag seems ignored, inspect both the inline object and `localStorage`.

### 4. Teacher and substitution views are derived data

Changing any `Subject (Teacher)` cell affects:

- class view
- teacher view
- free teacher finder
- substitution logic

Treat teacher names as identifiers, not cosmetic labels.

## Safe Edit Workflow

### Timetable change

1. Locate the correct day and class row in `rawData`.
2. Preserve the current CSV shape.
3. Preserve `Subject (Teacher)` formatting unless the slot is intentionally `Assembly` or `Free`.
4. Verify the affected class, teacher, and day views.
5. Bump the service worker version.

### JS or CSS change

1. Edit the targeted module or style file.
2. Verify the affected feature in the browser.
3. Bump the service worker version.
4. Run any targeted validation scripts.

### Docs-only change

1. Update the doc.
2. No service worker bump needed.

## Validation Commands

Run from the repo root:

```powershell
npx http-server . -p 8080 -c-1
node tests/manual/colors/verify-contrast.js
node tests/manual/test-mapping.js
node build-report.js
git diff --stat
```

Minimum expectations:

- inspect the exact view you changed
- run the color and mapping scripts after subject/category changes
- regenerate the build report after meaningful runtime edits

## Fast Code Navigation

Use ripgrep first.

```powershell
rg -n "const FEATURE_FLAGS|const rawData|function parseTimetableData" index.html
rg -n "function renderDashboard|function renderDayView|function renderClassView|function renderTeacherView|function renderSubstitutionView" index.html
rg -n "findFreeTeachers|findBestFreeTeacher|updatePrintContent|showToast" index.html
rg -n "CACHE_NAME|STATIC_CACHE_NAME|CORE_ASSETS|OPTIONAL_EXTERNAL_ASSETS" sw.js
rg -n "feat_accessibility|window.A11y" scripts/a11y.js
rg -n "SubjectColorCoding|getSubjectCategory" scripts/colors.js
rg -n "window.PerformanceOptimization|VirtualScroller|CacheManager" scripts/perf.js
rg -n "window.ModernUI|ModernFAB|ModernSnackbar" scripts/ui.js
```

## Files Most Agents Actually Need

For most tasks, you only need:

- `README.md`
- `AGENTS.md`
- `index.html`
- `sw.js`
- one file in `scripts/`
- one file in `styles/`
- `docs/TIMETABLE_DATA.md`
- `tests/README.md`

## Common Mistakes

- Forgetting that `Assembly` is part of the timetable columns.
- Forgetting to bump `sw.js` cache versions after runtime edits.
- Updating `window.FEATURE_FLAGS` but not checking persisted `localStorage` overrides.
- Treating `docs/sources/` PDFs as runtime assets.
- Editing `tools/one-off/` helper scripts as if they are part of the product.

## Current Repo Organization

- Root: runtime entry points and primary docs
- `docs/`: curated documentation, reports, and source reference material
- `tests/`: manual and script-based validation
- `tools/one-off/`: historical helper artifacts

Keep new runtime files near the existing runtime structure. Do not put one-off migration scripts back in the repo root.
