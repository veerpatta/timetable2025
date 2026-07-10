# Substitution Engine

The live app uses `scripts/substitution.js` for substitution recommendations. The module is pure JavaScript, works offline, and is shared by the browser and Node tests.

## Qualification and workload rules

Automatic assignments must satisfy all of these rules:

- the teacher is not absent;
- the teacher has no regular class or other substitution in that period;
- the teacher is inside any configured availability window;
- the subject appears in the teacher's weekly timetable history or in an explicit `canCover` policy override;
- the teacher has fewer than two automatic substitutions for that calendar date;
- the assignment does not remove the final free period or extend an already long teaching run.

Related-department and general free teachers are suggestions only. The coordinator must review and explicitly approve them. Named reliability bonuses are not used.

The engine matches the whole day together, with teacher-day and teacher-period capacities, so a flexible teacher is not consumed before a scarce specialist vacancy is considered.

## Teacher policy overrides

Runtime policy overrides live beside the active roster in `index.html` and are merged with timetable-derived subjects and grades. Each entry may define:

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

## Local plan storage

Plans are stored under `localStorage.vpps-substitution-plans-v1`, keyed by ISO calendar date. Each record includes the timetable version, weekday, absent teachers, assignments, match tier, warnings, source, and update time.

- Plans are local to the current browser/device.
- Past plans are deleted after 30 days.
- A timetable-version change invalidates incompatible saved plans.
- Sunday is rejected as a planning date; the app defaults to the next school day.

## Validation

Run:

```powershell
node --test tests/substitution-engine.test.js
```

Then verify the date, absent-teacher selection, Auto Assign, warning approval, refresh restoration, sharing, and mobile card layout in a browser.
