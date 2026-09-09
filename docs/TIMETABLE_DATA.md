# Timetable Data Guide

This file documents the live timetable data model used by the application. The source of truth is the `rawData` string inside `scripts/data.js`.

Do not treat this document as a second copy of the timetable. It exists to explain the format, constraints, and safe editing rules so the data does not drift between multiple files.

## Where The Data Lives

Search `scripts/data.js` for:

```javascript
const rawData = `Monday
```

That block contains the full timetable for the current school session.

## Current Format

The data is CSV-like plain text embedded in a JavaScript template literal.

The shape is:

1. Day name
2. Header row beginning with `Class`
3. Class rows for that day
4. Next day name

Example:

```text
Monday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 11 Science,Physics (Prateek),Biology / Maths (Hemlata / Prateek),Biology / Maths (Hemlata / Prateek),CCS (Maya),Hindi (Jainendra),English (Mumal),NoteBook Checking (Antima),Chemistry (Toshit)
```

## Column Rules

Each class row currently has 9 columns total (Timetable 2026–27, v10):

1. Class name
2. Period 1
3. Period 2
4. Period 3
5. Period 4
6. Period 5
7. Period 6
8. Period 7
9. Period 8

There is no separate `Assembly` column in the live v10 data — reporting time, the mid-morning short break, and dispersal are timing metadata in the active schedule profile only. They are not timetable columns in `rawData`.

## Allowed Cell Shapes

A cell is `Subject (Teacher)`, or `Subject (A / B / …)` when more than one teacher is in the
period. `Free` is still parsed, but v10 has no free periods left — every one of the 768 cells is
taught, so a `Free` appearing again is more likely a lost column than a real gap.

Examples from the current dataset:

- `Business Studies (Nidhika)`
- `ELGA (Bindu / Anita / Rashmita / Kusum / Ravina)`
- `Biology / Maths (Hemlata / Prateek)`

### Two things wear the same `A / B` costume

The difference decides whether an absence needs a substitute, so the parser records it rather
than leaving each caller to guess.

| Shape | Meaning | `parallel` | `shared` | If one teacher is away |
| --- | --- | --- | --- | --- |
| `ELGA (five names)` | One activity, five teachers | – | `true` | The rest absorb it. No vacancy. |
| `Biology / Maths (Hemlata / Prateek)` | Two lessons side by side, one cohort each | `true` | `false` | Hemlata's Biology group needs real cover — Prateek is teaching Maths. |

The test is arithmetic: a cell is a **parallel elective** when its subject splits on ` / ` into
exactly as many parts as it has teachers. `parseTimetable` then keeps `subjects: []` alongside
the full label, and `buildTeacherMap` gives each teacher *their own* subject, so the class grid
still reads `Biology / Maths` while the planner ranks cover for `Biology`.

v10 has 26 parallel cells (`Biology / Maths`, `Economics / Eng Lit`) and 60 ELGA cells.

### Combined senior sections

One teacher can hold several sections in the same period: 11 Science, Commerce and Arts sit
together for Hindi and English, and 11/12 Commerce joins Arts for Economics — 40 period-instances
a week across Jainendra, Mumal and Prakash. Nothing marks this in `rawData`; it emerges from the
same teacher, subject and period appearing in more than one class row.

`buildTeacherMap` keeps it as **one** slot — one room needs one cover teacher — and lists the
rest in `alsoClassNames`. That list is what makes the arrangement appear on all three class
timetables and in the shared message, instead of only on whichever section sorts first.

## Parsing Expectations

`Data.load()` in `scripts/data.js` parses `rawData` and derives everything else from it:

```javascript
{
  days: ["Monday", …],
  classNames: ["Class 1", …],
  // Teaching staff only, derived from the cells. Admin staff are not here.
  teacherNames: ["Anita", …],
  timetable: {
    Monday: {
      "Class 11 Science": [
        { subject: "Physics", teachers: ["Prateek"] },
        // A parallel elective keeps the full label and the split.
        { subject: "Biology / Maths", subjects: ["Biology", "Maths"],
          teachers: ["Hemlata", "Prateek"], parallel: true },
        …
      ]
    }
  },
  teacherMap: {
    Jainendra: {
      Monday: [ …, {
        className: "Class 11 Science",
        // The other sections sitting in the same room this period.
        alsoClassNames: ["Class 11 Commerce", "Class 11 Arts"],
        subject: "Hindi",
        shared: false
      }, … ]
    }
  },
  reserveStaff: […],   // never in teacherNames
  coverPool: […]       // teacherNames + reserveStaff, for the planner only
}
```

`timetable` is what a class sees; `teacherMap` is what a teacher sees, and the substitution
planner walks the second. Editing a teacher name changes both.

This carries more weight than it used to. The substitution engine now derives **which classes each teacher stands in front of, and how often**, straight from these rows, and ranks cover by that familiarity first. Moving a teacher out of a class here does not just change that cell — it changes who the planner will send to cover that class when someone is away.

## Shifts

`DEFAULT_SHIFTS` in `scripts/substitution.js` holds standing working windows, which are not
absences: the planner will not give someone cover before they arrive, and their teacher view
reads "Off shift" rather than "Free period". v10 ships one — **Anjana is part-time, P6–P8 only**
— and the test suite derives that window from the timetable itself, so a revision that moves her
fails a test instead of quietly handing her a first-period duty.

## Safe Editing Rules

### Preserve CSV structure

- Keep the day line by itself.
- Keep the header row immediately below the day line.
- Keep every class row aligned with the header row.
- Do not add or remove commas casually; commas are structural delimiters.

### Preserve subject formatting

- Use `Subject (Teacher)` when the slot has both a subject and a teacher.
- Keep teacher names consistent across days so teacher views remain correct.
- Do not replace a meaningful teacher label with a variant unless you intend to create a separate teacher identity.

### Preserve special values

These carry app-level meaning and should not be normalized away without checking behaviour:

- `Free` — still parsed, but v10 uses it nowhere
- `Self Study` and `NoteBook Checking` — real scheduled periods, and the two subjects the colour
  map deliberately leaves grey
- `ELGA` — the primary block; the `shared` rule above depends on it staying one subject with
  five teachers

### Watch for color-mapping and search impact

Changing subject names can affect:

- subject colour coding via `SUBJECT_CATEGORIES` in `scripts/data.js`
- teacher lookup and free-teacher calculations
- substitution suggestions, which match on canonical subject names in `scripts/substitution.js`

If you add a new subject term, check that `SUBJECT_CATEGORIES` in `scripts/data.js` classifies it (otherwise it falls back to the grey `default` category) and that `SUBJECT_ALIASES` / `SUBJECT_GROUPS` in `scripts/substitution.js` place it in the right group for cover matching. Then run:

```powershell
node --test tests/substitution-engine.test.js
```

## Recommended Edit Workflow

1. Find the relevant day and class row in `rawData`.
2. Make the smallest possible text edit.
3. Check that the row still has the expected number of columns.
4. Serve the app locally and verify:
   - the day view
   - the class view
   - the teacher view for any renamed teacher
5. If the runtime app changed, bump the service worker cache version in `sw.js`.

## Bell Schedules

Period *content* lives in `rawData`; period *times* live in `SCHEDULES` in the same file. The two are independent — `Period 1`–`Period 8` always mean the same eight columns, whichever bells are ringing.

Two schedules are defined, and `scheduleFor(date)` picks between them by calendar date:

| Schedule | Applies | Shape |
| --- | --- | --- |
| `practice` | up to and including **15 August 2026** | 8 short periods, lunch 11:00–11:20 AM, classes end 1:00 PM, zero period 1:00–2:10 PM for preparation |
| `regular` | from **16 August 2026** | Timetable 2026–27: 8 × 40-minute periods, short break 11:10–11:30 AM, classes end 2:10 PM |

The `practice` bells (source: handwritten schedule issued for the preparation period):

| Period | Time |
| --- | --- |
| 1 | 8:30 – 9:00 AM |
| 2 | 9:00 – 9:30 AM |
| 3 | 9:30 – 10:00 AM |
| 4 | 10:00 – 10:30 AM |
| 5 | 10:30 – 11:00 AM |
| Lunch | 11:00 – 11:20 AM |
| 6 | 11:20 AM – 12:00 noon |
| 7 | 12:00 – 12:30 PM |
| 8 | 12:30 – 1:00 PM |
| Zero period | 1:00 – 2:10 PM (preparation) |

The changeover needs no code edit — the regular bells resume on their own on 16 August 2026. To extend or shorten the practice window, change the single `PRACTICE_LAST_DAY` constant (format `YYYYMMDD`). The schedule is resolved when the page loads, so a device left open across the changeover picks up the new bells on its next reload.

While the practice bells are active, the home screen shows an amber notice so staff can tell the times are deliberately temporary rather than stale.

## Version History Note

The live data is **Timetable 2026–27 (v10)**, an 8-period schedule (`Period 1`–`Period 8`). It
replaced v4, which replaced the 6-period heatwave timetable of summer 2026. v10 is not a tweak
of v4: Rakesh, Harshita and Pradhyuman left, Nishant, Mumal, Roshan and SP joined, Anjana moved
to P6–P8, and parallel electives and combined senior sections appeared for the first time.

If a prior schedule ever needs to be restored, check out the relevant `rawData` block from git
history (for example via `git log -p scripts/data.js index.html`) and revalidate all derived
views, including the column count and header row expected by the parser at that point in history.

## Known, and deliberately not implemented

The v10 free-teacher chart marks **Hemlata, Rashmita, Nidhika and Nathulal** with a `*`: they
hold coordinator and exam-in-charge duties, and the chart says to give them cover only when
nobody else is free. The planner does not know this — it will rank them like anyone else. Adding
it means a new tier in `TIER_ORDER`/`TIER_SCORE` in `scripts/substitution.js`, below `general`
and above `reserve`, kept outside `AUTO_TIERS`. Recorded here so it is not mistaken for an
oversight.

## Reference Inputs

The PDFs in `docs/sources/` are reference material only. Use them to confirm schedule content when needed, but do not treat them as live runtime data sources.
