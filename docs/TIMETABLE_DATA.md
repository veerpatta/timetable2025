# Timetable Data Guide

This file documents the live timetable data model used by the application. The source of truth is the inline `rawData` string inside `index.html`.

Do not treat this document as a second copy of the timetable. It exists to explain the format, constraints, and safe editing rules so the data does not drift between multiple files.

## Where The Data Lives

Search `index.html` for:

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
Class,Assembly<br>8:00 AM - 8:30 AM,Period 1<br>8:30 AM - 9:10 AM,...,Period 8<br>01:30 PM - 02:10 PM
Class 11 Science,Assembly,Physics (Mahesh),Biology (Hemlata),...,Free
```

## Column Rules

Each class row currently has 10 columns total:

1. Class name
2. Assembly
3. Period 1
4. Period 2
5. Period 3
6. Period 4
7. Period 5
8. Period 6
9. Period 7
10. Period 8

Important: many older notes in the repo refer to only 8 periods. The live app now includes `Assembly` as a parsed timetable slot, so the row width is larger than those older docs describe.

## Allowed Cell Shapes

Most timetable cells should look like one of:

- `Assembly`
- `Subject (Teacher)`
- `Free`

Examples from the current dataset:

- `English compulsory (Pradhyuman)`
- `Business Studies (Nidhika)`
- `NoteBook Checking (Antima)`
- `Robotics (Maya)`

## Parsing Expectations

The parser in `index.html` derives these structures:

```javascript
{
  timetable: {
    Monday: {
      "Class 11 Science": [
        { subject: "Assembly", teacher: "", time: "8:00 AM - 8:30 AM" },
        { subject: "Physics", teacher: "Mahesh", time: "8:30 AM - 9:10 AM" }
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

- `Assembly`
- `Free`
- `Self Study`
- `NoteBook Checking`
- `Sports`

### Watch for color-mapping and search impact

Changing subject names can affect:

- subject color coding in `scripts/colors.js`
- teacher lookup and free-teacher calculations
- substitution suggestions
- search and filter behavior

If you add a new subject term, review `scripts/colors.js` and run:

```powershell
node tests/manual/test-mapping.js
node tests/manual/colors/verify-contrast.js
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

## Reference Inputs

The PDFs in `docs/sources/` are reference material only. Use them to confirm schedule content when needed, but do not treat them as live runtime data sources.
