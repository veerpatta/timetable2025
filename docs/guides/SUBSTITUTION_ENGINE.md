# Substitution Engine

The live app uses `scripts/substitution.js` for substitution recommendations. The module is pure JavaScript, works offline, and is shared by the browser and Node tests.

## What makes cover good

School policy is that **familiarity with the class comes first**. A teacher those children already know can hold a useful lesson; a stranger with the right subject often cannot. The tier ladder encodes that, best first:

| Tier | Meaning | Automatic |
| --- | --- | --- |
| `class_subject` | Teaches this class **and** this subject | yes |
| `class` | Teaches this class, any subject | yes |
| `exact` | Teaches this subject, other classes | yes |
| `approved` | Explicit `canCover` policy override | yes |
| `related` | Same subject group only | review |
| `general` | No connection to class or subject | review |

`class` is automatic on the school's own evidence: the timetable says this teacher works with these children every week. It still carries a `class_not_subject` warning so nobody is misled about what is being taught. `related` and `general` remain review-only.

### "First" is arithmetic, not aspiration

Tier bases in `TIER_SCORE` are spaced `TIER_GAP` (1500) apart, and every other signal is clamped to ±`MODIFIER_CAP` (700). Since a full ±700 swing cannot cross a 1500 gap, tier order holds no matter how tired, overloaded or over-used a candidate is. That keeps the score a single scalar — which the min-cost flow needs — while ordering lexicographically. `Engine.tierDominates(a, b)` states the invariant, and a test asserts it for every adjacent pair.

All weights live in one `WEIGHTS` object in `scripts/substitution.js`. Change policy there, not in scattered arithmetic.

### Within a tier

- **Familiarity strength** — eight periods a week with a class beats one.
- **Fatigue** — the length of the unbroken teaching run this would create, and whether it takes the teacher's last free period. Preparation and marking time is real.
- **Repetition today** — each cover already assigned makes the next one dearer.
- **Recent history** — periods covered in the last 30 days, capped, so a heavy fortnight is not a permanent demotion.

### Hard blocks, which no score can overcome

The teacher is absent, already has a regular class, is already covering another class that period, or is outside their shift.

## Spreading the load

Two mechanisms, because the plan is built in two passes.

**Automatic assignments** run through a min-cost max-flow. Each teacher's `source` edge is split into unit-capacity edges of increasing cost (`0, Δ, 2Δ …`), so a second cover genuinely costs the optimiser more than a first. A single edge of capacity 2 priced them identically, which is why work used to pile onto whoever scored highest. `Δ` sits below `TIER_GAP`, so spreading reorders within a tier and never overrides familiarity. Flow is still maximised before cost, so fairness never means covering fewer periods.

**Review suggestions** are made one at a time, each re-ranked against everything already proposed. Reading them all from a matrix built before the flow ran meant two vacancies in the same period could be offered the same teacher — a double booking — and one willing teacher collected every leftover period.

The engine matches the whole day together, with teacher-day and teacher-period capacities, so a flexible teacher is not consumed before a scarce specialist vacancy is considered.

## Editing before the plan goes out

The coordinator outranks the engine. Tapping any period opens a sheet listing every teacher the engine considered, in its order, with the reason it ranked them there and the reason it would not use them — blocked candidates are shown greyed out rather than hidden, because knowing *who* is unavailable and *why* saves a second look.

A choice becomes a **pin**: `state.pins[slotId]` is a teacher name, or `null` for "deliberately left open". Pins are fed to `generatePlan` as `existingAssignments`, so they consume the teacher's capacity and block their period while everything else re-allocates around them — regenerating is simply a re-run. `Engine.validateAssignment` gates the choice: a hard block is refused with its reason, a warning is allowed with one.

In the shared message a pinned assignment reads ✅ with no "please confirm", because a human already decided; a deliberately-open period reads 📌 "being arranged by the office", not ❌ "no teacher free", which would send the staff group scrambling for a period that is already handled.

## Shift timings

A shift is a teacher's standing working window — every day, not one day. It is the difference between "free this period" and "not in the building". Anjana reports after the first four periods, so P1–P4 look empty in her timetable when in fact she is not at school; without a shift the planner hands her cover before she arrives.

Shifts live in `state.shifts` in `scripts/app.js`, keyed by teacher:

```javascript
{ Anjana: { allowedPeriodIndexes: [4, 5, 6, 7], note: 'Reports after Period 4' } }
```

`Engine.shiftsToPolicyOverrides()` converts them into the `policyOverrides` shape below, so enforcement happens in `isAvailableByPolicy` — there is no second code path. A teacher with no entry works the full day.

Three sources, in order: `Engine.DEFAULT_SHIFTS` ships in the code, `localStorage.vppsm_shifts` holds this device's copy, and the `teacher_shifts` table is the shared truth once the database is reachable. An admin edits them in the Substitutes view; see [BACKEND_SYNC.md](BACKEND_SYNC.md).

Shifts also drive the free-teacher lists on Home and the Today board, and render as "Off shift" rather than "Free period" in the teacher views.

## Teacher policy overrides

Runtime policy overrides are passed to `Engine.buildTeacherProfiles()` by `buildPlan()` in `scripts/app.js`, and are merged with timetable-derived subjects and grades. Each entry may define:

```javascript
{
  canTeach: ['Subject demonstrated outside the current timetable'],
  canCover: ['Officially approved additional subject'],
  gradeBands: ['primary', 'middle', 'secondary', 'senior'],
  availability: { allowedPeriodIndexes: [0, 1, 2] },
  maxAutoSubstitutions: 2
}
```

Only add an override when it is backed by school policy. Do not use this configuration to invent teacher qualifications.

## Coverage states

Every planned period ends in exactly one of five states, and the same state drives the pill in the UI and the marker in the shared message:

| State | UI | Message | Meaning |
| --- | --- | --- | --- |
| `assigned` | green | ✅ | The engine allocated this automatically: right subject or the class's own teacher, within workload limits. |
| `team` | blue | 👥 | Co-taught period; a remaining co-teacher covers it. Nothing to arrange. |
| `review` | amber | ⚠️ | A suggestion the engine declined to auto-assign. The message names the actual reason — subject not verified, workload limit, long consecutive run — not the match tier. |
| `selfstudy` | neutral | 📖 | Nobody was free. The class sits self study, which is what the school does anyway. |
| `open` | red | 📌 | The coordinator deliberately held the period to arrange themselves. |

Two of these are deliberate choices about how the plan reads:

`review` used to be presented as settled, which meant an unvetted suggestion reached WhatsApp looking exactly like a decision. It no longer does.

`selfstudy` is styled neutrally rather than as an alarm. An uncovered period is an outcome, not a hole in the chart — leaving it as "no one free" made it look unresolved right up to the bell, and drew the eye away from the periods that genuinely still need a decision. A period the coordinator held is the one that reads as pending, because it is.

## A substitution shows everywhere, not just in the planner

A substitution changes who stands in front of a class, so it appears wherever that period is drawn: the Today board, the class timetable, the teacher timetable and a teacher's own day on Home. The replaced name is struck through in red with the cover beside it, and an arrow carries the direction so the meaning is not left to colour alone.

Two indexes in `app.js` do this, both built from the current plan and keyed for the planned day only — a plan is made for one date, and showing it against every Monday of the year would be a lie:

- `subForClass(day, className, periodIndex)` — the class period that changed hands.
- `subForTeacher(day, teacher, periodIndex)` — the **free period that became cover duty**. This one matters most: a teacher who opens the app and sees an empty P3 does not turn up to cover it. Those periods render in green as duty, reading "Class 1 · covering for Bindu".

## The shared message

Deliberately not the screen. The planner keeps reasons, warnings and times because that is where decisions are made; twenty people on a phone need to find their own name and stop reading.

One aligned row per period inside WhatsApp's monospace block, sorted by period so the day reads top to bottom:

```
🏫 *VPPS · Substitution Plan* — Mon, 17 Aug

P  CLASS    SUBJECT  COVER
1  1        Maths    self study
2  2        EVS      Ravina ?
4  6        Sports   Jainendra

✅ 4 covered · ⚠️ 4 to check · 📖 1 self study · 👥 3 team
```

- A trailing `?` marks a cover that still needs confirming; the count is in the summary.
- Team-covered periods are left out of the table entirely — nobody has to do anything about them — and counted in the summary instead.
- Class names use the short form to keep lines from wrapping on a narrow phone. The column header carries the meaning.
- In Hindi the columns only align approximately: Devanagari glyphs are not monospace width, so padding by character count cannot line them up exactly. The table is still readable; it is a limitation of the medium, not a bug to chase.

## Plan storage

Plans are keyed by ISO calendar date — not by weekday — so they can expire. The date is resolved from the selected weekday within the current school week.

- `localStorage.vpps-substitution-plans-v1` is the source of truth and works offline. Past plans are deleted after 30 days.
- The `substitution_plans` table mirrors them so a plan made in the office is visible on a phone. Same 30-day retention, enforced on every sync. Pins live in a `pins` column and travel with the plan.

Each stored assignment carries **both** `cover` and `coverTeacher`. `cover` is what a human reads and is translated — for a co-taught period it holds the word "Team", or "टीम संभालेगी" if the plan was saved in Hindi. `coverTeacher` is always a real name or `null`. The fairness history counts `coverTeacher` only; counting `cover` would have credited a teacher named "Team" and produced different history depending on the language the plan happened to be saved in.

The current plan is excluded from its own history — letting it count would make the ranking depend on its own output.
- A timetable-version change invalidates incompatible saved plans.
- Sunday is rejected as a planning date; the app defaults to the next school day.

## Validation

Run:

```powershell
node --test tests/substitution-engine.test.js
```

Then verify the date, absent-teacher selection, Auto Assign, warning approval, refresh restoration, sharing, and mobile card layout in a browser.
