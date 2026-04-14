# Veer Patta Public School Timetable PWA

Static, offline-first timetable application for Veer Patta Public School. The app is built with vanilla JavaScript, plain CSS, and a service worker. There is no framework, no backend, and no build pipeline for the runtime app.

This README is the best starting point for anyone touching the repo. For AI-agent specific operating rules, read [AGENTS.md](AGENTS.md) next.

## What This Repo Contains

### Runtime app

- `index.html`: main entry point, main UI markup, app state, parsing logic, renderers, and the full timetable dataset.
- `scripts/`: feature modules loaded by `index.html`.
- `styles/`: shared CSS for theme, UI, accessibility, and subject colors.
- `sw.js`: service worker and cache strategy.
- `manifest.webmanifest`: install metadata for the PWA.
- `icons/`: app icon assets used by the manifest and the app shell.

### Supporting repo tooling

- `build-report.js`: measures raw and gzipped asset sizes and writes reports to `docs/reports/`.
- `tests/`: manual browser test pages and small Node-based validation scripts.

### Documentation and reference material

- `AGENTS.md`: repo operating guide for AI agents.
- `docs/README.md`: documentation index.
- `docs/TIMETABLE_DATA.md`: authoritative explanation of the timetable data format and parsing model.
- `docs/guides/`: focused guides for flags, service worker behavior, QA, assets, and feature areas.
- `docs/reports/`: generated reports such as `build-report.json`.
- `docs/sources/`: source PDFs used as reference material for the timetable session. These are not loaded by the app.

### Historical and one-off artifacts

- `tools/one-off/`: helper scripts and an old patch artifact kept for traceability. These are not part of the runtime app and should usually be ignored unless you are reconstructing earlier edits.

## Repository Map

```text
timetable2025/
  AGENTS.md
  README.md
  build-report.js
  index.html
  manifest.webmanifest
  sw.js
  docs/
    README.md
    TIMETABLE_DATA.md
    guides/
    reports/
    sources/
  icons/
  scripts/
    a11y.js
    colors.js
    perf.js
    ui.js
  styles/
    a11y.css
    colors.css
    theme.css
    ui.css
  tests/
    README.md
    manual/
  tools/
    one-off/
```

## Architecture

The app is intentionally simple, but most of the logic still lives in `index.html`.

### `index.html`

`index.html` is the real application core. It contains:

- the app shell markup
- the top-level `FEATURE_FLAGS` object
- the theme system
- the inline timetable data block in `rawData`
- timetable parsing logic
- render functions for the major views
- export and print handlers
- app initialization and service worker registration

Important view renderers in `index.html`:

- `renderDashboard()`
- `renderDayView()`
- `renderClassView()`
- `renderTeacherView()`
- `renderSubstitutionView()`

### `scripts/`

- `scripts/perf.js`: debouncing, throttling, session cache, lazy loading, lazy images, and virtual scrolling helpers exposed as `window.PerformanceOptimization`.
- `scripts/a11y.js`: keyboard shortcuts, announcements, skip link, high-contrast support, and focus enhancements exposed as `window.A11y`.
- `scripts/colors.js`: subject-to-category mapping, legend rendering, and dynamic subject coloring exposed as `window.SubjectColorCoding`.
- `scripts/ui.js`: modern UI primitives such as FABs, snackbars, bottom sheets, pull-to-refresh, and swipe cards exposed as `window.ModernUI`.

### `styles/`

- `styles/theme.css`: theme tokens and layout variables.
- `styles/ui.css`: component styling for modern UI helpers.
- `styles/a11y.css`: accessibility-specific helpers such as focus and modal treatment.
- `styles/colors.css`: subject color classes and legend styling.

### `sw.js`

The service worker precaches the app shell and uses:

- cache-first for static assets
- network-first for future timetable or API-like requests

Whenever you change a cached asset, bump both cache constants in `sw.js`. As of April 2026 the file uses `vpps-timetable-v13` and `vpps-static-v13`, but always verify the live values in `sw.js` before editing.

## Timetable Data Model

The source of truth is the inline `rawData` string in `index.html`.

The current format is:

1. Day header such as `Monday`
2. Header row beginning with `Class`
3. One row per class

Each class row currently contains:

- class name
- `Assembly`
- `Period 1` through `Period 8`

That means the parser expects 10 CSV columns per class row: 1 class column plus 9 timetable slots.

Cell values are usually one of:

- `Assembly`
- `Subject (Teacher)`
- `Free`

Real examples from the live data include:

- `English compulsory (Pradhyuman)`
- `Business Studies (Nidhika)`
- `NoteBook Checking (Antima)`
- `Robotics (Maya)`

Changing teacher names affects teacher views, substitution logic, and free-teacher calculations because teacher schedules are derived from this dataset.

See [docs/TIMETABLE_DATA.md](docs/TIMETABLE_DATA.md) for the full editing rules.

## Feature Flags

There are two flag layers in the current repo:

### Inline app flags in `index.html`

These are the main switches used by the app shell:

- `feat_dark_mode`
- `feat_color_coding`
- `feat_modern_ui`
- `feat_perf_opt`

### Module-local flags in `localStorage`

Some modules also read their own persisted flags:

- `scripts/a11y.js` uses `feat_accessibility` and defaults to enabled if unset.
- `scripts/colors.js` can be forced on or off via `feat_color_coding` in `localStorage`.
- `scripts/ui.js` can also read `feat_modern_ui` from `localStorage`.
- `scripts/perf.js` stores a JSON object under `feat_perf_opt` for sub-feature toggles.

If you are debugging flag behavior, check both `window.FEATURE_FLAGS` and `localStorage`.

See [docs/guides/FEATURE_FLAGS.md](docs/guides/FEATURE_FLAGS.md).

## Local Development

There is no install step required for the runtime app.

### Serve locally

```powershell
npx http-server . -p 8080 -c-1
```

Open `http://localhost:8080`.

Use `-c-1` during development so cached assets do not hide local changes.

### Useful commands

```powershell
node build-report.js
node tests/manual/colors/verify-contrast.js
node tests/manual/test-mapping.js
rg -n "const FEATURE_FLAGS|const rawData|function parseTimetableData" index.html
rg -n "CACHE_NAME|STATIC_CACHE_NAME|CORE_ASSETS" sw.js
```

## Main Workflows

### Update timetable data

1. Edit the relevant class row inside `rawData` in `index.html`.
2. Preserve the `Subject (Teacher)` pattern where applicable.
3. Keep the column count aligned with the header row.
4. Verify the affected day, class, and teacher views locally.
5. If the runtime app changed, bump the service worker cache version in `sw.js`.

### Update a JS or CSS module

1. Edit the file in `scripts/` or `styles/`.
2. Verify the relevant UI path in the browser.
3. Bump the cache version in `sw.js`.
4. Run any targeted checks from `tests/`.

### Update only documentation

Documentation-only changes do not require a service worker version bump because the cached app shell is unchanged.

## Validation Checklist

Run the minimum set that matches your change:

- `node tests/manual/colors/verify-contrast.js` after subject color or theme edits.
- `node tests/manual/test-mapping.js` after subject naming or category mapping edits.
- `node build-report.js` after meaningful runtime changes.
- Manual browser verification for the specific day/class/teacher/substitution flow you changed.
- Service worker check in DevTools after `sw.js` edits.

See [tests/README.md](tests/README.md) and [docs/guides/QA_CHECKLIST.md](docs/guides/QA_CHECKLIST.md).

## Guidance For AI Agents

Read these in order:

1. `README.md`
2. `AGENTS.md`
3. `docs/TIMETABLE_DATA.md`
4. The live code in `index.html`, `sw.js`, and the touched module

When locating implementation quickly, start with:

```powershell
rg -n "const rawData|function renderDashboard|function renderDayView|function renderClassView|function renderTeacherView|function renderSubstitutionView" index.html
rg -n "feat_accessibility|FEATURE_FLAG|window.A11y" scripts/a11y.js
rg -n "SubjectColorCoding|getSubjectCategory" scripts/colors.js
rg -n "window.PerformanceOptimization|VirtualScroller|CacheManager" scripts/perf.js
rg -n "window.ModernUI|ModernFAB|ModernSnackbar" scripts/ui.js
```

Do not assume the older narrative docs are more accurate than the live code. If a guide conflicts with the implementation, prefer the implementation and then update the guide.

## Notes On Documentation Status

The repo contains both current operational docs and historical/reference material. The authoritative operational surface is:

- `README.md`
- `AGENTS.md`
- `docs/TIMETABLE_DATA.md`
- `docs/guides/FEATURE_FLAGS.md`
- `docs/guides/SERVICE_WORKER_TESTING.md`
- live code

The remaining docs in `docs/guides/` are helpful background, but if they conflict with runtime behavior, update them or treat them as secondary to the code.
