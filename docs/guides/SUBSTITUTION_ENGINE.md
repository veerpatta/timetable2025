# Substitution Engine

The live app uses `scripts/substitution.js` for substitution recommendations. The module is pure JavaScript, works offline, and is shared by the browser and Node tests.

## What makes cover good

School policy is that **familiarity with the class comes first**. A teacher those children already know can hold a useful lesson; a stranger with the right subject often cannot. The tier ladder encodes that, best first:

| Tier | Meaning | Automatic |
| --- | --- | --- |
| `class_subject` | Teaches this class **and** this subject | yes |
| `class` | Teaches this class, any subject | yes |
| `exact` | Teaches this subject, other classes | yes |
| `approved` | Explicit `canCover` policy override | yes — but see below: **dormant in the app today** |
| `related` | Same subject group only | review |
| `general` | No connection to class or subject | review |
| `last_resort` | Duty-holder — coordinator or exam in-charge | review |
| `reserve` | Admin staff — asked, never volunteered | never |

`class` is automatic on the school's own evidence: the timetable says this teacher works with these children every week. It still carries a `class_not_subject` warning so nobody is misled about what is being taught. `related` and `general` remain review-only.

The bottom two tiers are about **who the person is**, not what they can teach, and neither climbs: a duty-holder who teaches the very class and subject still ranks `last_resort`, because the star protects her coordinator time rather than describing her qualifications.

**`approved` never fires in the running app.** It is reachable only through a `canCover` policy override, and nothing in the app writes one: the sole `policyOverrides` source is `Engine.shiftsToPolicyOverrides(state.shifts)` (`scripts/app.js:1060`), which emits `{ availability }` and nothing else. There is no UI, no stored setting and no seed data for `canCover` — it is set only in the test suite. Treat the tier as a designed extension point that is wired into the engine but not yet into the product, rather than as behaviour you can rely on or debug against. Wiring it up — for example seeding `canCover` from `SUBJECT_GROUPS` so a Physics teacher is an approved cover for Chemistry — would raise the automatic share without touching the fatigue gates, and is the obvious next move if more auto-assignment is wanted.

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

### Why most cover needs confirming

Three further conditions do not block a candidate but do disable `autoEligible`, so the period becomes an amber "confirm this" row rather than an automatic assignment: `full_day` (this cover would take the teacher to a full teaching day), `excessive_consecutive` (it would extend their unbroken run past `maxConsecutive`, default 3) and `over_substitution_limit` (they already hold `maxAutoSubstitutions`, default 2).

On the v11 timetable this is what decides the shape of a plan, so it is worth stating plainly. Simulating all 114 single-teacher absences (19 teachers × 6 days) gives **674 vacancies, of which 27% are auto-assigned, 73% come through as amber suggestions, and none is left open** — every vacancy gets a named teacher. (Re-measured after the half-day work: identical to the period, which is the point — nothing about a full day changed.) Of the 908 candidates who are free, qualified for an automatic tier and not duty-holders, `full_day` rejects **49%**, `excessive_consecutive` **27%**, and `over_substitution_limit` **0%** — the daily cap never binds on this roster.

The cause is load, not calibration drift: teachers here average **6.44 of 8 periods a day**, and 70 of the 114 teacher-days are seven-period days. So `full_day` bars nearly anyone holding a single free period. That is deliberate. Taking a teacher's last free period is a decision a coordinator makes, not one the app makes for them, and the amber row is how it gets asked. Note that `lastFreePeriod` (−620) already penalises the same situation through the score; the gate is the stricter statement of the same policy, and the one that cannot be outweighed. Relaxing it is the single highest-leverage change available if the school ever decides it wants more automatic cover — and it should be a deliberate policy decision, not a tuning tweak.

## Half days

An absence is one date. It is not always the whole of it: teachers leave after the fourth period for a hospital appointment, or arrive at the fifth from one, and until this existed the app could only be told "away" or "here".

Both wrong answers cost something. Marked away all day, the morning she taught becomes four vacancies nobody needs to fill, and the app refuses the cover she could have given in the afternoon. Not marked at all, the periods she really is away go uncovered.

So an absence carries the periods it applies to:

```javascript
{ Jainendra: [4, 5, 6, 7] }   // away from Period 5; in school, and coverable, for P1-P4
```

A whole day is simply every period, which is why **the old shape still means what it always did**: `Engine.normalizeAbsences` accepts a bare list of names, a map of names to period lists, or a list of `{ teacher, periods }` objects, and a name with no periods is away all day. Saved plans and database rows written before this existed keep working untouched.

`absentTeachers` on every engine entry point takes any of those shapes. Inside, one `absent` block becomes period-aware — `isAbsentAt(index, teacher, periodIndex)` — and that is the whole of the change to matching. A half-day absentee is an ordinary candidate in the half they are present for, ranked and gated like anybody else.

### A half day is not a shift

The distinction is load-bearing and the two are stored in different places:

| | Shift | Absence |
| --- | --- | --- |
| Holds for | every day | one date |
| Lives in | `teacher_shifts`, `localStorage.vppsm_shifts` | the plan for that date |
| Example | Anjana is part-time, P5-P8 | Anjana went home after P6 on Tuesday |
| Edited in | the admin drawer | the absence row, by anyone planning |

Keeping them apart is what lets a part-time teacher have a half day. They compose: the periods a teacher is available for are the ones inside their shift **and** outside their absence.

### The day a teacher is measured against

Fatigue is measured over the periods a teacher is actually in school for, which `getLoadFacts` reports as `dayLength`. That is not always the eight on the bell schedule: a part-timer is on site for four, and somebody who goes home after the break is here for four more.

Measured against eight, both looked as though they had hours of preparation time going spare, and the `full_day` gate would say *"teacher would have no free period"* about periods they are not in the building for — a sentence a coordinator can see is false, on the screen where they are deciding whether to trust the rest of it. Away and off-shift periods are now neither busy nor free: they are not part of today, and they break a consecutive run, because leaving the building is the longest break there is.

For a full-time teacher with no absence `dayLength` is 8 and every number is exactly what it was — a test asserts it, and the whole-day simulation below is unchanged to the period.

### The allocator leaves one free period

`full_day` scores one candidate against a plan that does not yet contain the flow's other choices. The flow decides several covers at once, so on a day with two people away it could hand somebody two automatic covers and fill their day between them, each having looked fine alone.

`autoCoverAllowance()` states the same policy where the flow can act on it: a teacher's source capacity is also capped at *free periods minus one*, so automatic cover never takes the last one. Pinned periods are excluded from the count rather than capped, because a pin is a decision somebody already made. On the whole-day simulation this changes nothing — no plan there ever filled a day — and it closes the multi-absence case that did.

## Reserve staff

Three admin staff — Director Mam, Raj Sir and Gyan Sir — will take a period when it is genuinely needed, but the planner must never volunteer them.

They could not be chosen at all before, because `db.teacherNames` is derived from timetable cells: a person with no periods does not exist to the app. They are declared instead, in `RESERVE_STAFF` in `scripts/data.js`, and surface as `db.reserveStaff` plus `db.coverPool` (teaching staff + reserve). **`db.teacherNames` deliberately does not include them**, which is what keeps them out of the Teachers view, the free-teacher lists, the shift editor, the absence chips and the fairness ledger without a single special case in any of those places.

In the engine they are a bottom tier, `reserve`, below `general` — so they sort last by the ordinary rules rather than by an exception bolted onto the sort. `autoEligible` is false for them unconditionally.

**The part that actually matters is the suggestion path.** A reserve profile has no timetable, so it reads as free in every period; the moment every regular teacher is blocked it would be proposed as the fallback — quietly taking the hardest period of the day, which is precisely the one a coordinator wants to decide. `generatePlan` therefore filters reserve candidates out of the review suggestions as well as the flow. A test asserts that with the only teacher absent, **nothing at all** is proposed and the period is reported open.

They still appear in the swap sheet, below a divider, so asking them remains one tap.

## Duty-holders

The v11 free-teacher chart marks four names with a `*` — **Hemlata, Rashmita, Nidhika and Nathulal** — and says in its header to "use them for cover only if no one else is free". They hold coordinator and exam in-charge duties: the free periods on their row are that work, not spare capacity.

They are declared in `DUTY_STAFF` in `scripts/data.js` and surface as `db.dutyStaff`. Unlike reserve staff they are **ordinary teaching staff and stay in `db.teacherNames`** — they teach a full timetable, appear in every view, and carry a normal share of the load. The star changes one thing only: where they sit in the ranking.

In the engine they are the `last_resort` tier, below `general` and above `reserve`, and `autoEligible` is false for them unconditionally — the min-cost flow never places them, so a coordinator confirms every time.

**What separates them from reserve staff is that they are still suggested.** Reserve staff are filtered out of the review suggestions too; duty-holders are not. "Only if no one else is free" has to mean they are offered on the day that actually happens, or the rule would just read as "never" and a class would sit self study while a teacher was free. Tests assert both halves: an ordinary teacher takes the period whenever one exists, and the duty-holder is suggested — not auto-assigned — when none does.

The swap sheet keeps them past the twelve-candidate trim, for the same reason: they rank last by design, so the trim is exactly what would hide them on the day they are needed.

## Combining two classes

When nobody is free, a school does not leave thirty children alone — it sends them next door. `Engine.canCombine` allows a merge within one grade (`MAX_GRADE_GAP`), which on this timetable means 27 legal pairs: Class 5 with 4 or 6, the three Class 11 streams with each other, never Class 1 with Class 9.

Finding a host is easy — measured on the real Monday timetable, every taught period has on average **3.3** qualifying hosts and none has zero. Choosing well is the job, so `Engine.chooseMergeHost` ranks them:

1. **Same grade** over an adjacent one.
2. Then a class still taught by **its own teacher** over one already being covered — handing a substitute a second room is how a plan starts to fall over.
3. Then class order, for determinism.

A class that is itself self study can never host.

**It is offered, never taken.** Every merge costs the host class part of its lesson, and with a host almost always available an automatic merge would fire constantly. The suggestion appears on the self-study row and in the swap sheet; only tapping it applies anything.

**Both classes are told.** The overlay writes a record for the merged class (where the children went, and to whom) *and* for the host (`joined: ['Class 2']`, rendered "+ 2"). The host teacher's own day shows it too — and note that the teacher views gate duty on `slot ? null : subForTeacher(...)`, so a host, who already has a class that period, is invisible to that path. Their own period record carries the merge instead. Without that, the person acquiring thirty extra children finds out when they arrive.

## Spreading the load

Two mechanisms, because the plan is built in two passes.

**Automatic assignments** run through a min-cost max-flow. Each teacher's `source` edge is split into unit-capacity edges of increasing cost (`0, Δ, 2Δ …`), so a second cover genuinely costs the optimiser more than a first. A single edge of capacity 2 priced them identically, which is why work used to pile onto whoever scored highest. `Δ` sits below `TIER_GAP`, so spreading reorders within a tier and never overrides familiarity. Flow is still maximised before cost, so fairness never means covering fewer periods.

**Review suggestions** are made one at a time, each re-ranked against everything already proposed. Reading them all from a matrix built before the flow ran meant two vacancies in the same period could be offered the same teacher — a double booking — and one willing teacher collected every leftover period.

The engine matches the whole day together, with teacher-day and teacher-period capacities, so a flexible teacher is not consumed before a scarce specialist vacancy is considered.

## Editing before the plan goes out

The coordinator outranks the engine. Tapping any period opens a sheet listing every teacher the engine considered, in its order, with the reason it ranked them there and the reason it would not use them — blocked candidates are shown greyed out rather than hidden, because knowing *who* is unavailable and *why* saves a second look.

A choice becomes a **pin**. `state.pins[slotId]` takes three forms: a teacher's name, `null` for "deliberately left open", and `{ combineWith: 'Class 6' }` for a merge. The object form rides in the existing `pins jsonb` column, so nothing needed migrating. Pins are fed to `generatePlan` as `existingAssignments`, so they consume the teacher's capacity and block their period while everything else re-allocates around them — regenerating is simply a re-run. `Engine.validateAssignment` gates the choice: a hard block is refused with its reason, a warning is allowed with one.

In the shared message a pinned assignment reads ✅ with no "please confirm", because a human already decided; a deliberately-open period reads 📌 "being arranged by the office", not ❌ "no teacher free", which would send the staff group scrambling for a period that is already handled.

## Shift timings

A shift is a teacher's standing working window — every day, not one day. It is the difference between "free this period" and "not in the building". Anjana is part-time and is on site for the last four periods only, so P1–P4 look empty in her timetable when in fact she is not at school; without a shift the planner hands her cover before she arrives.

A shift is **availability, not teaching load**, and the two are deliberately different: Anjana arrives for P5 but the timetable gives her P6–P8, which is precisely what makes P5 a period she can be asked to cover. What the test suite enforces is containment — nobody may be timetabled to teach outside the window they are present for. Everyone else on the roster works the full day and has no entry at all.

Shifts live in `state.shifts` in `scripts/app.js`, keyed by teacher:

```javascript
{ Anjana: { allowedPeriodIndexes: [4, 5, 6, 7], note: 'Part-time: Periods 5-8 only' } }
```

`Engine.shiftsToPolicyOverrides()` converts them into the `policyOverrides` shape below, so enforcement happens in `isAvailableByPolicy` — there is no second code path. A teacher with no entry works the full day.

Three sources, in order: `Engine.DEFAULT_SHIFTS` ships in the code, `localStorage.vppsm_shifts` holds this device's copy, and the `teacher_shifts` table is the shared truth once the database is reachable. An admin edits them in the Substitutes view; see [BACKEND_SYNC.md](BACKEND_SYNC.md).

### Why the shipped default carries a version

The stored copy beats `DEFAULT_SHIFTS` on every load — it has to, or the admin shift editor would be undone by a refresh. The cost is that a shipped policy change reaches nobody: every phone and the database already hold the previous answer, so deploying a new default changes nothing anyone can see.

`Engine.SHIFT_POLICY_VERSION` breaks that tie exactly once. `localStorage.vppsm_shifts` stores `{ policyVersion, shifts }` and `teacher_shifts` carries a `policy_version` column. A stored set stamped below the shipped version — including an unstamped one from before the envelope existed — is stale by definition and gives way to `DEFAULT_SHIFTS`, which is written back at the new version. A set stamped at or above it is a deliberate admin edit and is left alone.

**Bump `SHIFT_POLICY_VERSION` in the same commit as any change to `DEFAULT_SHIFTS`.** A test asserts it is a number and at least 2; nothing can assert that you remembered to raise it.

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

Every planned period ends in exactly one of six states, and the same state drives the pill in the UI and the marker in the shared message:

| State | UI | Message | Meaning |
| --- | --- | --- | --- |
| `assigned` | green | ✅ | The engine allocated this automatically: right subject or the class's own teacher, within workload limits. |
| `team` | blue | 👥 | Co-taught period; a remaining co-teacher covers it. Nothing to arrange. |
| `review` | amber | ⚠️ | A suggestion the engine declined to auto-assign. The message names the actual reason — subject not verified, workload limit, long consecutive run — not the match tier. |
| `selfstudy` | neutral | 📖 | Nobody was free. The class sits self study, which is what the school does anyway. |
| `combined` | blue | 🔗 | The class joined another under one teacher, at the coordinator's confirmation. |
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
