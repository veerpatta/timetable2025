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
- No framework, no server, no runtime build step
- The UI is a port of the **VPPS Mobile Timetable** design canvas: one 430px shell, five views (Home, Today, Classes, Teachers, Substitutes), EN/HI, light/dark
- Shift timings and substitution plans sync to Neon Postgres straight from the browser. There is still no server: `scripts/sync.js` posts to Neon's SQL-over-HTTP endpoint. It is optional and best-effort — the app is fully usable without it

## Source Of Truth

### Runtime

- `index.html`: markup shell only — header, empty `<main>`, bottom nav, script tags, pre-paint theme script
- `scripts/config.sample.js`: template for the database credential. Copy to `scripts/config.local.js`, which is **gitignored**
- `scripts/data.js`: `rawData`, bell schedule, subject categories, parser (`window.VPPSData`)
- `scripts/i18n.js`: EN/HI dictionaries and day/class translation (`window.I18n`)
- `scripts/substitution.js`: substitution matching, shift timings, plan storage (`window.SubstitutionEngine`)
- `scripts/sync.js`: Neon SQL-over-HTTP client for shifts and plans (`window.VPPSSync`)
- `scripts/app.js`: state, view renderers, event handling
- `styles/app.css`: the whole design system
- `sw.js`: cache names, precache list, offline behaviour

Scripts load in dependency order: `config.local.js` (optional) → `data.js` → `i18n.js` → `substitution.js` → `sync.js` → `app.js`.

### Documentation

- `README.md`: repo overview, architecture, workflows
- `docs/TIMETABLE_DATA.md`: timetable format and safe editing rules
- `docs/guides/SUBSTITUTION_ENGINE.md`: ranking tiers, shifts, coverage states, editing
- `docs/guides/BACKEND_SYNC.md`: the Neon tables, sync behaviour, retention
- `docs/guides/DEPLOYMENT.md`: the two hosted sites and how to ship to them
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

The old `feat_*` flags went away with `perf.js`, `ui.js`, `a11y.js`, and `colors.js`. `localStorage` holds preferences and saved state:

| Key | Holds |
| --- | --- |
| `vppsm_theme` | light/dark |
| `vppsm_me` | the teacher profile on this phone |
| `vppsm_role` | `teacher` or `admin` — admin defaults to the table views |
| `vppsm_grid` | which of the four views are in table/week mode |
| `vppsm_shifts` | this device's copy of the shift timings |
| `vppsm_cls`, `vppsm_tsel` | last selected class and teacher |
| `vpps-language` | EN/HI |
| `vpps-substitution-plans-v1` | date-keyed substitution plans |

### 6. Substitution ranking is tiered, and the tiers are load-bearing

Cover is ranked by how useful it is to the class, familiarity first: `class_subject` → `class` → `exact` → `approved` → `related` → `general`. Fatigue, repetition and history reorder candidates *within* a tier and can never cross one — tier bases are spaced further apart than twice the modifier clamp, and `Engine.tierDominates()` plus a test hold that line.

All weights live in the `WEIGHTS` object in `scripts/substitution.js`. Change policy there rather than adding arithmetic at a call site, and keep `MODIFIER_CAP < TIER_GAP / 2` or the ordering guarantee silently disappears.

### 7. A shift is not an absence

An absence is one day. A **shift** is a teacher's standing working window, and the whole app respects it: the planner will not give someone cover duty before they arrive, the free-teacher lists exclude them, and the teacher views read "Off shift" rather than "Free period".

Anjana reports after Period 4. Enforcement runs through `isAvailableByPolicy` via `Engine.shiftsToPolicyOverrides()` — do not add a second code path for it. See `docs/guides/SUBSTITUTION_ENGINE.md`.

### 8. There are two deployed sites, and localhost is not the live one

`vpps-timetable.web.app` is what the staff read; `vpps-timetable-test.web.app` is staging. `scripts/config.local.js` picks its database from the hostname, so localhost and any `-test` host write to `neondb_test` and never to `neondb`. Do not "simplify" that away: before it existed, local testing put fictional absences into the live plan.

The credential file is gitignored, so a fresh clone cannot deploy a working build — copy `scripts/config.sample.js` first. Ship to staging and exercise it there before the live target. See `docs/guides/DEPLOYMENT.md`.

### 9. Uncovered periods are self study, not a gap

When nobody is free the period reads **Self Study**, styled neutrally, marked 📖 in the shared message. It is an outcome, not an unresolved hole, and the red state is reserved for a period the coordinator deliberately held. Do not reintroduce "No one free" as an outcome.

### 10. Print/PDF export and the free-teacher finder were removed

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
firebase deploy --only hosting:test --project schoolfeespro
git diff --stat
```

Minimum expectations:

- inspect the exact view you changed
- run the substitution test after any `i18n.js` or `substitution.js` edit
- regenerate the build report after meaningful runtime edits
- deploy to staging and exercise it there before the live site

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
