# Source PDFs

The official timetable PDFs the app's schedule was transcribed from. Reference material only:

- not loaded by the running web app
- not part of the service worker precache list
- not the source of truth — that is the `rawData` block in `scripts/data.js`

## Current session

**Timetable 2026–27 (v11)** is what the app serves:

| File | What it holds |
| --- | --- |
| `VPPS_Timetable_v11_ClassWise.pdf` | Every class, a page each. The block `rawData` was built from. |
| `VPPS_Timetable_v11_DayWise.pdf` | The same 96 day×class rows arranged by day — an independent copy, useful for checking a transcription. |
| `VPPS_Timetable_v11_TeacherWise.pdf` | A page per teacher, each headed with their weekly period count and any role. The counts are asserted in `tests/substitution-engine.test.js`. |
| `VPPS_Timetable_v11_FreeTeachers.pdf` | Who is free in each period, for arranging cover by hand. The app derives this itself. |

One deliberate divergence: the FreeTeachers chart notes Anjana as "part-time (P6-P8 only)", which is her **teaching** window. The app models her **availability**, and she is on site from P5, so `DEFAULT_SHIFTS` gives her P5–P8 and the planner may offer her P5 cover. Do not "correct" the code to match the PDF.

## Superseded

The `v10` set is kept for history: same roster and same rules, but 349 of 768 cells sit
elsewhere, so it will not reconcile against current data.

The `v4` files and the earlier `School Timetable 2026-27 (updated)` set are kept for history
too. They describe a different roster — Rakesh, Harshita and Pradhyuman have left, and Nishant,
Mumal, Roshan and SP joined — so do not reconcile current data against them.

## Reconciling a change

The v11 import was checked against all four PDFs, which is the pattern worth repeating:

1. **ClassWise** — the source the `rawData` block is built from.
2. **FreeTeachers** — derive each period's free set from `db.teacherMap` and compare with the
   chart. 48/48 period-slots matched. This is the sharpest check, because a single misplaced
   teacher shows up as two wrong slots.
3. **TeacherWise** — every teacher's derived weekly load against their page header. 16/16
   matched. This one lives in the test suite.
4. **DayWise** — per-teacher appearance counts per day, as an independent transcription.
   6/6 days matched.

The parser was validated first by running it against the **previous** edition's PDFs and
confirming it reproduced the shipped `rawData` with zero differing cells. Do that before
trusting a new import: it separates "the data changed" from "my parser is wrong".
