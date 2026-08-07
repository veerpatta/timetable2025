# Veer Patta Public School Timetable PWA

Static, offline-first timetable application for Veer Patta Public School. Vanilla JavaScript, plain CSS, a service worker. No framework, no backend, no build step.

The interface implements the **VPPS Mobile Timetable** design canvas: a single 430px-wide app shell with five views — Home, Today, Classes, Teachers, Substitutes — bilingual English/Hindi, light and dark.

This README is the best starting point for anyone touching the repo. For AI-agent specific operating rules, read [AGENTS.md](AGENTS.md) next.

## What This Repo Contains

### Runtime app

- `index.html`: the app shell only — head, header, empty `<main>`, bottom nav, script tags. Roughly 90 lines.
- `scripts/data.js`: the timetable dataset (`rawData`), bell schedule, subject categories, and the parser. Exposes `window.VPPSData`.
- `scripts/i18n.js`: English/Hindi dictionaries plus day and class name translation. Exposes `window.I18n`.
- `scripts/substitution.js`: subject-aware substitution matching, workload policy, and date-keyed plan storage. Exposes `window.SubstitutionEngine`.
- `scripts/app.js`: the application controller — state, the five view renderers, and event handling. Exposes nothing.
- `styles/app.css`: the entire design system — tokens, components, light and dark themes.
- `sw.js`: service worker and cache strategy.
- `manifest.webmanifest`, `icons/`: PWA install metadata and icon assets.

### Supporting repo tooling

- `build-report.js`: measures raw and gzipped asset sizes, writes to `docs/reports/`.
- `tests/`: Node test for the substitution engine, plus manual browser test pages.

### Documentation and reference material

- `AGENTS.md`: repo operating guide for AI agents.
- `docs/README.md`: documentation index.
- `docs/TIMETABLE_DATA.md`: the timetable data format and parsing model.
- `docs/guides/`: focused guides for service worker behaviour, QA, assets, and feature areas.
- `docs/reports/`: generated reports such as `build-report.json`.
- `docs/sources/`: source PDFs for the timetable session. Not loaded by the app.

### Historical and one-off artifacts

- `tools/one-off/`: helper scripts kept for traceability. Not part of the runtime app.

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
    app.js
    data.js
    i18n.js
    substitution.js
  styles/
    app.css
  tests/
    README.md
    manual/
    substitution-engine.test.js
  tools/
    one-off/
```

## Architecture

Four scripts load in order; each one only depends on the ones before it.

```
data.js  ->  i18n.js  ->  substitution.js  ->  app.js
```

### `index.html`

Markup only. It holds the header (logo, title, language and theme buttons, status strip), an empty `<main id="app-main">`, the toast element, and an empty `<nav id="app-nav">`. Everything inside `main` and `nav` is rendered by `app.js`.

The one piece of logic it carries is an inline script that reads the saved theme and sets `data-theme` before first paint, so the shell never flashes light.

### `scripts/app.js`

The controller. A single `state` object drives a full re-render of `main` and `nav` on every change — there is no diffing and no virtual DOM, because the whole view is a few hundred nodes.

View renderers:

- `renderHome()` — hero card (live period and progress), first-run teacher setup, the signed-in teacher's day, and who is free right now.
- `renderBoard()` — "Who is teaching?" for one period across all classes, plus a full-day table.
- `renderClassView()` — one class, by day or as a week grid.
- `renderTeacherView()` — one teacher, by day or as a week grid.
- `renderSubs()` — substitution planner.

Interaction uses one delegated `click` handler on `document.body`. Buttons declare `data-action` and `data-value`; `ACTIONS` maps the action name to a state mutation, then `render()` runs.

Preferences persist in `localStorage` under `vppsm_theme`, `vppsm_me`, `vppsm_cls`, `vppsm_tsel`. Language persists under `vpps-language` via `I18n`.

### `scripts/data.js`

`VPPSData.load()` parses `rawData` once and returns:

- `days`, `classNames`, `teacherNames`
- `timetable[day][className][periodIndex]` — `{ subject, teachers[] }` or `{ free: true }`
- `teacherMap[teacher][day][periodIndex]` — `{ className, subject, shared }` or `null`

`shared` marks co-taught periods (the ELGA blocks), which the planner treats as covered by the remaining team rather than needing a substitute.

### Substitution planner

`app.js` builds teacher profiles and a vacancy list from the absent teachers, then calls `SubstitutionEngine.generatePlan()`. Results are grouped per absent teacher.

A named cover renders as a green pill; only a genuinely unstaffable period renders amber. The engine's match tier (exact subject, related subject, general availability) is carried in the pill's `title` attribute, so a coordinator can see how well qualified each suggestion is without the UI shouting.

### `sw.js`

Precaches the app shell; cache-first for static assets, network-first for anything else. **Whenever you change a cached asset, bump both cache constants in `sw.js`.**

## Timetable Data Model

The source of truth is `rawData` in `scripts/data.js`.

Format:

1. Day header such as `Monday`
2. Header row beginning with `Class`
3. One row per class

Each class row is the class name followed by `Period 1` through `Period 8` — 9 CSV columns.

Cell values are either `Subject (Teacher)`, `Subject (Teacher A / Teacher B)` for co-taught periods, or `Free`. Real examples:

- `English compulsory (Pradhyuman)`
- `ELGA (Bindu / Anita / Rashmita / Kusum / Ravina)`
- `NoteBook Checking (Antima)`

Teacher names are keys, not labels: renaming a teacher changes teacher views, free-teacher lists, and substitution matching. See [docs/TIMETABLE_DATA.md](docs/TIMETABLE_DATA.md).

The bell schedule (`PERIODS`, `BREAK`, `REPORTING_MIN`, `CLOSE_MIN`) also lives in `scripts/data.js` and drives the live-period highlighting, the status strip, and the hero progress bar.

## Local Development

No install step.

```powershell
npx http-server . -p 8080 -c-1
```

Open `http://localhost:8080`. Use `-c-1` so cached assets do not hide local changes. If the service worker serves a stale file, unregister it in DevTools → Application → Service Workers and clear the cache storage.

The same server is defined in `.claude/launch.json` as the `timetable` configuration, so an agent working in this repo can start the preview itself rather than reinventing the command.

### Useful commands

```powershell
node build-report.js
node --test tests/substitution-engine.test.js
node --check scripts/app.js
rg -n "const rawData|function parseTimetable" scripts/data.js
rg -n "CACHE_NAME|STATIC_CACHE_NAME|CORE_ASSETS" sw.js
```

## Main Workflows

### Update timetable data

1. Edit the relevant class row inside `rawData` in `scripts/data.js`.
2. Keep the `Subject (Teacher)` pattern and the column count.
3. Verify the affected day, class, and teacher views locally.
4. Bump the service worker cache version in `sw.js`.

### Change the UI

1. Layout and copy live in `scripts/app.js`; tokens and component styling live in `styles/app.css`.
2. Any new user-facing string needs a key in **both** `en` and `hi` in `scripts/i18n.js` — the test asserts parity.
3. Bump the cache version in `sw.js`.

### Update only documentation

No service worker bump needed; the cached shell is unchanged.

## Validation Checklist

- `node --test tests/substitution-engine.test.js` after substitution, policy, or translation changes.
- `node build-report.js` after meaningful runtime changes.
- Manual browser check of the specific view you changed, in both languages and both themes.
- Service worker check in DevTools after `sw.js` edits.

See [tests/README.md](tests/README.md) and [docs/guides/QA_CHECKLIST.md](docs/guides/QA_CHECKLIST.md).

## Guidance For AI Agents

Read in order: `README.md`, `AGENTS.md`, `docs/TIMETABLE_DATA.md`, then the live code.

```powershell
rg -n "function render" scripts/app.js
rg -n "const ACTIONS|const state" scripts/app.js
rg -n "const rawData|const PERIODS" scripts/data.js
```

Do not assume the narrative docs are more accurate than the live code. If a guide conflicts with the implementation, prefer the implementation and then update the guide.

## Design Source

The UI is a direct port of the **VPPS Mobile Timetable** design canvas. Colour tokens, radii, type sizes, and spacing in `styles/app.css` come from that design — keep them in sync with it rather than hand-tuning values.
