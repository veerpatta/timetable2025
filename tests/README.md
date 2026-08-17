# Tests

This repository uses one automated Node test plus manual browser verification. The app is a static PWA, so the main validation loop is:

1. Run the Node test.
2. Serve the app locally.
3. Manually confirm the specific view or timetable change you touched.

## Test Layout

```text
tests/
  README.md
  substitution-engine.test.js
```

## Fast Validation

Run these from the repository root:

```powershell
node --test tests/substitution-engine.test.js
node --check scripts/app.js
npx http-server . -p 8080 -c-1
```

Then open `http://localhost:8080/`.

## What The Test Covers

### `tests/substitution-engine.test.js`

34 automated Node tests covering:

- **Ranking tiers** - the ladder from `class_subject` down to `general`, and that a teacher who knows the class outranks an outside subject specialist.
- **Tier dominance as a property** - with the worst possible fatigue, repetition and history penalties applied, a higher tier still wins. This is the test that stops a well-meaning weight change from quietly breaking school policy.
- **Fatigue** - losing the last free period, and long consecutive runs penalised more steeply than short ones.
- **Load spreading** - two vacancies go to two teachers; leftover periods are shared; the daily cap outranks a better match while anyone else is free.
- **No double booking** - nobody is proposed for two classes in the same period.
- **Shift timings** - range and list forms, the built-in default, and that allocation never places a teacher before their shift starts.
- **Hard availability rules** - absent, regular class, double-booked, unavailable.
- **Persistence** - date-keyed plans, 30-day pruning, schedule-version invalidation, recovery from corrupt data.
- **Bell schedules** - the practice/regular changeover and gapless period coverage.
- **Reserve staff** - offered to a coordinator, ranked last, never auto-assigned, and never *suggested* even when every teacher is blocked. That last case is the one that would otherwise slip through, because an admin with no timetable reads as free in every period.
- **Combining classes** - the one-grade rule, host ranking (same grade first, own teacher over a covered one), a self-study class never hosting, and deterministic choice.
- **English/Hindi parity.**

The parity check is the one that catches the most common UI mistake: adding a new string to `en` in `scripts/i18n.js` but not to `hi`.

The tier-dominance test is worth understanding before changing `WEIGHTS`: tier bases are spaced further apart than twice the modifier clamp, which is what makes "class familiarity first" arithmetic rather than aspiration.

## Manual Verification

There is no automated UI test, so check the view you changed by hand. A full pass covers:

- **Home** — hero shows the right state for the time of day (before school, live period with progress bar, short break, day complete, Sunday closed); teacher setup flow; "free right now" list.
- **Today** — day and period chips, list mode, table mode, live-period highlighting.
- **Classes** — class chips, day mode, week grid.
- **Teachers** — teacher chips, day mode, week grid, period load counts.
- **Substitutes** — mark absent teachers, coverage rows, the swap sheet, pin and regenerate, self study, share.

Mark several teachers absent at once. A plan where one name appears four or
five times, or where a period nobody could cover reads as an error rather than
self study, means something in the engine regressed.

Check each in **both languages** (header language button) and **both themes** (header theme button).

Time-dependent states are hard to reach on demand. To force one in DevTools, stub the clock before re-rendering, for example:

```js
Date.prototype.getHours = () => 11;
Date.prototype.getMinutes = () => 20;   // short break
document.querySelector('[data-action="go"][data-value="home"]').click();
```

## When To Run What

- Timetable data change in `scripts/data.js`: verify the affected class, day, and teacher views.
- Any `scripts/i18n.js` or `scripts/substitution.js` change: run the Node test.
- Any UI change: verify the view in both languages and both themes.
- Service worker change: verify cache and update behaviour in DevTools → Application. Unregister the old worker first, or you will be testing a cached build.

## Smoke Testing A Deployed Build

Use the staging site, never the live one:

```powershell
firebase deploy --only hosting:test --project schoolfeespro
```

<https://vpps-timetable-test.web.app> runs the same code against `neondb_test`,
so absences, pins and messages there never reach the staff. Confirm the red
**TEST database** badge on the Substitutes screen before you start.

A full pass covers: all five views, both languages, both themes, admin and
teacher roles, the planner end to end, swap/pin/regenerate, self study, the
WhatsApp text, the database round-trip, reload persistence, offline behaviour,
and the service worker cache version.

## Notes For Agents

- There is no `package.json`; use `npx http-server` directly.
- localhost writes to the **test** database, not the live one - `scripts/config.local.js` selects by hostname.
- A clean test run does not replace checking the exact UI path you changed.
- `docs/reports/build-report.json` is generated by `node build-report.js`. It is a size report, not a test.
