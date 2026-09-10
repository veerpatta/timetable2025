# Backend Sync

The app keeps two things in a shared Postgres database (Neon): the standing **shift timings**, and the **substitution plan** for each date. Everything else — the timetable itself, preferences, theme — stays where it always was.

This is a mirror, never a gate. `localStorage` remains the source of truth, every database call is best-effort, and a failure degrades to "saved on this device only" without blocking anything. The app is fully usable with no database at all.

## How it connects

There is no server. The browser posts straight to Neon's SQL-over-HTTP endpoint with `fetch`, which keeps the repo's "no framework, no backend, no build step" shape intact.

```
POST https://<endpoint>.<region>.aws.neon.tech/sql
Neon-Connection-String: postgresql://user:password@<endpoint>.../neondb?sslmode=require
{ "query": "select 1", "params": [] }
```

**Do not set a `Content-Type` header.** Neon's CORS preflight allows only `Authorization` and its own `Neon-*` headers. Setting `Content-Type: application/json` fails preflight in a browser; omitting it lets `fetch` default to the safelisted `text/plain`, which the endpoint parses as JSON anyway. `scripts/sync.js` says as much at the call site — it is not an oversight to tidy up.

## Two databases, chosen by hostname

| Where | Database |
| --- | --- |
| https://vpps-timetable.web.app | `neondb` — the plan the staff read |
| https://vpps-timetable-test.web.app | `neondb_test` |
| `localhost` / `127.0.0.1` | `neondb_test` |

`config.local.js` does the selecting, so one file and one deploy directory serve both sites. This is not a nicety: before it existed, trying something out on a laptop wrote a fictional absence straight into the live plan — which is how the rule was learned. The Substitutes screen shows a red **TEST database · not the live plan** badge whenever the app is not on `neondb`.

## Setup

1. Copy `scripts/config.sample.js` to `scripts/config.local.js`.
2. Fill in `neonSqlUrl` (the connection host with `/sql` appended) and both connection strings.
3. Reload. The tables are created on first use, in whichever database you are pointed at, and `Engine.DEFAULT_SHIFTS` seeds `teacher_shifts` if it is empty.

`scripts/config.local.js` is **gitignored on purpose**. This repository is public, and a Postgres URL committed to a public repo is picked up by GitHub secret scanning, which asks Neon to reset the password — the app then breaks with no warning and no obvious cause. Keep the credential out of git and deploy the file alongside the site.

Be clear-eyed about what this does and does not protect: anyone who opens the deployed page can read the connection string. That is an accepted trade for having no server. Rotate the password when convenient, and prefer a limited role over `neondb_owner`.

Without the file the app runs exactly as before, on one device, and the Substitutes view shows "Database not connected".

## Schema

```sql
create table if not exists teacher_shifts (
  teacher          text primary key,
  allowed_periods  smallint[] not null,
  note             text,
  policy_version   smallint    not null default 1,
  updated_at       timestamptz not null default now()
);

create table if not exists substitution_plans (
  plan_date        date primary key,
  day_name         text        not null,
  schedule_version text        not null,
  absences         jsonb       not null default '[]'::jsonb,
  assignments      jsonb       not null default '[]'::jsonb,
  pins             jsonb       not null default '{}'::jsonb,
  updated_at       timestamptz not null default now()
);
```

`pins` and `policy_version` were added after the first release and are applied with `alter table … add column if not exists` inside the same idempotent schema step, so an existing database picks them up with no migration. Rows written before the column existed default to version 1.

`policy_version` records which edition of `Engine.DEFAULT_SHIFTS` a row was written against. The stored set normally wins over the shipped default — otherwise the shift editor would not survive a refresh — so without this stamp a shipped policy change would reach nobody. `loadShifts()` reports the **lowest** version across the rows, and `startSync()` discards a set below `Engine.SHIFT_POLICY_VERSION` in favour of the built-in default, writing it back at the new version. See [SUBSTITUTION_ENGINE.md](SUBSTITUTION_ENGINE.md).

Both writes are upserts. `teacher_shifts` is replaced wholesale on save, so a teacher removed from the map is back to a full day.

## Fairness history

`loadCoverHistory(days, excludeDate)` aggregates how many periods each teacher has covered, so the engine can rank a teacher who covered nothing this week above one who covered three periods yesterday:

```sql
select coalesce(a->>'coverTeacher',
         case when a->>'status' in ('assigned','review') then a->>'cover' end) as teacher,
       count(*)::int as covers
from substitution_plans p, jsonb_array_elements(p.assignments) a
where p.plan_date >= current_date - (30 * interval '1 day')
  and p.plan_date <> $2::date
group by 1;
```

Two details that matter:

- It reads **`coverTeacher`**, which is always a real name or null. The older `cover` field is a display string; in a bilingual app it contains translated words like "Team", so it is trusted only as a fallback on rows that actually named someone. Plans written before this column existed still count correctly.
- `excludeDate` keeps the plan being edited out of its own history, which would otherwise make the ranking depend on its own output.

Offline, `app.js` computes the same figures from the local plan store, so fairness still works with no database.

## Retention

Plans are keyed by real date, and `purgeOld()` runs on every sync:

```sql
delete from substitution_plans where plan_date < current_date - (30 * interval '1 day');
```

No cron job, no scheduler, no extra infrastructure — the table cannot grow without bound. Change the window with `retentionDays` in the config file.

## What the app does on load

1. `purgeOld()` — drop expired plans.
2. `loadShifts()` — adopt the shared shift timings, or seed the table from `DEFAULT_SHIFTS` when it is empty **or stamped below the shipped `SHIFT_POLICY_VERSION`**.
3. `loadPlan(today)` — pick up a plan someone else already made, unless this device is already editing one.

A failure at any step is logged and ignored.

## Checking it by hand

```bash
curl -s -X POST "$NEON_SQL_URL" -H "Neon-Connection-String: $NEON_URL" -d '{"query":"select plan_date, day_name, jsonb_array_length(assignments) from substitution_plans order by plan_date desc","params":[]}'
```

In the browser console, `window.VPPSSync` exposes the whole surface: `isConfigured()`, `status()`, `sql()`, `loadShifts()`, `saveShifts()`, `loadPlan()`, `savePlan()`, `purgeOld()`.

## Things worth knowing

- `scripts/config.local.js` is **not** precached by the service worker. It is optional and may 404; precaching a 404 fails the whole install.
- It is also fetched **network-first**, unlike every other asset. The worker is cache-first by design for an offline timetable, but that would let a rotated password keep failing on every installed device from a cached copy, with nothing on screen explaining why.
- The `<script>` tag for it in `index.html` is expected to fail when the file is absent. That is not a bug.
- Sync never runs before the first render. The app paints from `localStorage`, then catches up.
