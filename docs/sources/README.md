# Source PDFs

The official timetable PDFs the app's schedule was transcribed from. Reference material only:

- not loaded by the running web app
- not part of the service worker precache list
- not the source of truth — that is the `rawData` block in `scripts/data.js`

## Current session

**Timetable 2026–27 (v10)** is what the app serves:

| File | What it holds |
| --- | --- |
| `VPPS_Timetable_v10_ClassWise.pdf` | Every class, a page each. The block `rawData` was built from. |
| `VPPS_Timetable_v10_DayWise.pdf` | The same 96 day×class rows arranged by day — an independent copy, useful for checking a transcription. |
| `VPPS_Timetable_v10_TeacherWise.pdf` | A page per teacher, each headed with their weekly period count and any role. The counts are asserted in `tests/substitution-engine.test.js`. |
| `VPPS_Timetable_v10_FreeTeachers.pdf` | Who is free in each period, for arranging cover by hand. The app derives this itself. |

One deliberate divergence: the FreeTeachers chart notes Anjana as "part-time (P6-P8 only)", which is her **teaching** window. The app models her **availability**, and she is on site from P5, so `DEFAULT_SHIFTS` gives her P5–P8 and the planner may offer her P5 cover. Do not "correct" the code to match the PDF.

## Superseded

The `v4` files and the earlier `School Timetable 2026-27 (updated)` set are kept for history.
They describe a different roster — Rakesh, Harshita and Pradhyuman have left, and Nishant,
Mumal, Roshan and SP joined — so do not reconcile current data against them.

## Reconciling a change

The v10 import was checked by parsing the ClassWise and DayWise PDFs separately and comparing
them cell by cell (96/96 rows identical), then by checking every teacher's derived weekly load
against the header on their TeacherWise page. Both checks are worth repeating for the next
revision; the second one now lives in the test suite.
