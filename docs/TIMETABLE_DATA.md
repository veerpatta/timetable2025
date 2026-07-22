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
Class 11 Science,Physics (Prateek),Chemistry (Toshit),Biology (Hemlata),English compulsory (Pradhyuman),Hindi (Jainendra),Chemistry (Toshit),Maths (Prateek),Biology (Hemlata)
```

## Column Rules

Each class row currently has 9 columns total (Timetable 2026–27, v4):

1. Class name
2. Period 1
3. Period 2
4. Period 3
5. Period 4
6. Period 5
7. Period 6
8. Period 7
9. Period 8

There is no separate `Assembly` column in the live v4 data — reporting time, the mid-morning short break, and dispersal are timing metadata in the active schedule profile only. They are not timetable columns in `rawData`.

## Allowed Cell Shapes

Most timetable cells should look like one of:

- `Subject (Teacher)`
- `Free`

Examples from the current dataset:

- `English compulsory (Pradhyuman)`
- `Business Studies (Nidhika)`
- `ELGA (Bindu / Anita / Rashmita / Kusum / Ravina)`

## Parsing Expectations

The parser in `scripts/data.js` (`parseTimetable`) derives these structures:

```javascript
{
  timetable: {
    Monday: {
      "Class 11 Science": [
        { subject: "Physics", teacher: "Mahesh", time: "7:30 AM – 8:10 AM" },
        { subject: "Biology", teacher: "Hemlata", time: "8:10 AM – 8:50 AM" }
      ]
    }
  },
  teacherDetails: {
    Mahesh: {
      Monday: [
        { period: 1, class: "Class 11 Science", subject: "Physics" }
      ]
    }
  },
  periodHeaders: [],
  classNames: [],
  teacherNames: [],
  days: []
}
```

The exact derived shape may evolve, but the key point is that teacher schedules and substitution helpers are generated from the timetable rows. Editing a teacher name changes downstream behavior.

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

These values have app-level meaning and should not be normalized away without checking behavior:

- `Free`
- `Core Revision`
- `Science Practice`
- `SST Practice`

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

## Version History Note

The 6-period heatwave timetable that was active for summer 2026 has been superseded by Timetable 2026–27 (v4), an 8-period schedule (`Period 1`–`Period 8`). If a prior schedule ever needs to be restored, check out the relevant `rawData` block from git history (for example via `git log -p scripts/data.js index.html`) and revalidate all derived views, including the column count and header row expected by the parser at that point in history.

## Reference Inputs

The PDFs in `docs/sources/` are reference material only. Use them to confirm schedule content when needed, but do not treat them as live runtime data sources.
