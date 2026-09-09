# Veer Patta Public School Timetable PWA

Static, offline-first timetable application for Veer Patta Public School. Vanilla JavaScript, plain CSS, a service worker. No framework, no server, no build step.

Shift timings and substitution plans sync to a Neon Postgres database directly from the browser, so a plan made in the office shows up on a phone. It is optional and best-effort: `localStorage` stays the source of truth and the app works fully offline, or with no database configured at all. See [docs/guides/BACKEND_SYNC.md](docs/guides/BACKEND_SYNC.md).

**Live:** https://vpps-timetable.web.app · **Staging:** https://vpps-timetable-test.web.app

Staging runs the same code against a separate database, so cover can be planned, pinned and shared there without a single teacher seeing it. Try changes there first — see [docs/guides/DEPLOYMENT.md](docs/guides/DEPLOYMENT.md).

The interface implements the **VPPS Mobile Timetable** design canvas: a single 430px-wide app shell with five views — Home, Today, Classes, Teachers, Substitutes — bilingual English/Hindi, light and dark.

This README is the best starting point for anyone touching the repo. For AI-agent specific operating rules, read [AGENTS.md](AGENTS.md) next.

## What This Repo Contains

### Runtime app

- `index.html`: the app shell only — head, header, empty `<main>`, bottom nav, script tags. Roughly 90 lines.
- `scripts/data.js`: the timetable dataset (`rawData`), bell schedule, subject categories, and the parser. Exposes `window.VPPSData`.
- `scripts/i18n.js`: English/Hindi dictionaries plus day and class name translation. Exposes `window.I18n`.
- `scripts/substitution.js`: subject-aware substitution matching, workload policy, shift timings, and date-keyed plan storage. Exposes `window.SubstitutionEngine`.
- `scripts/sync.js`: Neon SQL-over-HTTP client for shift timings and substitution plans. Exposes `window.VPPSSync`.
- `scripts/config.sample.js`: template for the database credential. Copy to `scripts/config.local.js`, which is gitignored.
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
    config.sample.js
    data.js
    i18n.js
    substitution.js
    sync.js
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

The scripts load in order; each one only depends on the ones before it.

```
[config.local.js]  ->  data.js  ->  i18n.js  ->  substitution.js  ->  sync.js  ->  app.js
```

`config.local.js` is gitignored and optional — a 404 there is expected and harmless.

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

Preferences persist in `localStorage` under `vppsm_theme`, `vppsm_me`, `vppsm_role`, `vppsm_grid`, `vppsm_shifts`, `vppsm_cls`, `vppsm_tsel`. Language persists under `vpps-language` via `I18n`, and substitution plans under `vpps-substitution-plans-v1` via the engine's plan store.

`vppsm_role` matters for layout: an admin opens straight into the table views, a teacher into the phone lists. An explicit switch is remembered in `vppsm_grid` and outranks the role default.

### `scripts/data.js`

`VPPSData.load()` parses `rawData` once and returns:

- `days`, `classNames`, `teacherNames`
- `timetable[day][className][periodIndex]` — `{ subject, teachers[] }` or `{ free: true }`
- `teacherMap[teacher][day][periodIndex]` — `{ className, subject, shared }` or `null`

`shared` marks co-taught periods (the ELGA blocks), which the planner treats as covered by the remaining team rather than needing a substitute.

### Substitution planner

`app.js` builds teacher profiles and a vacancy list from the absent teachers, then calls `SubstitutionEngine.generatePlan()`. Results are grouped per absent teacher.

**Cover is ranked by how useful it is to the class, familiarity first** — a teacher those children already know can hold a useful lesson where a stranger with the right subject often cannot. The tiers run `class_subject` → `class` → `exact` → `approved` → `related` → `general` → `reserve`, and fatigue, repetition and 30 days of cover history reorder candidates *within* a tier but can never cross one. Full rules in [docs/guides/SUBSTITUTION_ENGINE.md](docs/guides/SUBSTITUTION_ENGINE.md).

Every period ends in one of six honest states, and the pill colour, the grid cell and the WhatsApp marker all agree:

| State | Meaning |
| --- | --- |
| ✅ assigned | Allocated automatically, within workload limits |
| 👥 team | Co-taught; a remaining co-teacher covers it |
| ⚠️ review | A suggestion the engine declined to auto-assign, with the actual reason |
| 🔗 combined | The class joined another under one teacher, once you confirmed it |
| 📖 self study | Nobody was free, so the class sits self study |
| 📌 open | The coordinator held this period to arrange themselves |

**The plan is editable before it goes out.** Tapping any period lists every candidate the engine considered, with the reason it ranked them there and the reason it cannot use them. Choosing pins the period; pinned choices survive a regenerate while the rest re-allocate around them.

**Three admin staff** — Director Mam, Raj Sir and Gyan Sir — can be assigned by hand but are never chosen automatically, and never suggested. They are declared in `RESERVE_STAFF` rather than derived from the timetable, and stay out of the Teachers view, the free-teacher lists and the fairness ledger.

**Classes can be combined.** When nobody is free, the planner offers to send the class next door — same or adjacent grade only — and shows the merge on both classes and on the host teacher's own day. It is always an offer.

**Shift timings** are separate from absences: a shift is a teacher's standing working window, every day. Someone who reports after the fourth period is never offered cover before they arrive, is excluded from the free-teacher lists, and reads "Off shift" rather than "Free period".

### `sw.js`

Precaches the app shell; cache-first for static assets, network-first for anything else. **Whenever you change a cached asset, bump both cache constants in `sw.js`.**

## Timetable Data Model

The source of truth is `rawData` in `scripts/data.js`.

Format:

1. Day header such as `Monday`
2. Header row beginning with `Class`
3. One row per class

Each class row is the class name followed by `Period 1` through `Period 8` — 9 CSV columns.

Cell values are `Subject (Teacher)`, or `Subject (Teacher A / Teacher B)` when more than one teacher is in the period. Real examples:

- `Hindi (Jainendra)`
- `NoteBook Checking (Antima)`
- `ELGA (Bindu / Anita / Rashmita / Kusum / Ravina)` — one activity, five teachers
- `Biology / Maths (Hemlata / Prateek)` — two subjects side by side, one cohort each

Those last two look alike and behave differently: the parser calls the second a **parallel elective**, because the subject splits into as many parts as the cell has teachers. A co-taught block can be absorbed by the teachers still present; a parallel elective cannot, and an absence there needs a real substitute.

Teacher names are keys, not labels: renaming a teacher changes teacher views, free-teacher lists, and substitution matching. See [docs/TIMETABLE_DATA.md](docs/TIMETABLE_DATA.md).

The bell schedule (`PERIODS`, `BREAK`, `REPORTING_MIN`, `CLOSE_MIN`) also lives in `scripts/data.js` and drives the live-period highlighting, the status strip, and the hero progress bar.

## Local Development

No install step.

```powershell
npx http-server . -p 8080 -c-1
```

Open `http://localhost:8080`. Use `-c-1` so cached assets do not hide local changes. If the service worker serves a stale file, unregister it in DevTools → Application → Service Workers and clear the cache storage.

The same server is defined in `.claude/launch.json` as the `timetable` configuration, so an agent working in this repo can start the preview itself rather than reinventing the command.

**localhost talks to the test database, never the live one.** `scripts/config.local.js` picks its database from the hostname. Without that, trying something out on a laptop writes a fictional absence into the plan the whole staff is reading — which is how the rule was learned.

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
- Service worker check in DevTools after `sw.js` edits — bump both cache constants.
- Deploy to **staging** and exercise it there before the live site.

See [tests/README.md](tests/README.md), [docs/guides/QA_CHECKLIST.md](docs/guides/QA_CHECKLIST.md) and [docs/guides/DEPLOYMENT.md](docs/guides/DEPLOYMENT.md).

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
