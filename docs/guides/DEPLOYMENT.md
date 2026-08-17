# Deployment

Two sites, both Firebase Hosting, both in the `schoolfeespro` Firebase project:

| Target | URL | Database |
| --- | --- | --- |
| `live` | https://vpps-timetable.web.app | `neondb` — the plan the staff read |
| `test` | https://vpps-timetable-test.web.app | `neondb_test` — a staging copy |

There is **no backend service**. The app calls Neon directly over HTTPS, so there is no process to start, nothing to keep running, and nothing to restart. Deploying means copying static files to a host; the database has been live since it was provisioned.

## Deploying

```bash
firebase deploy --only hosting:test --project schoolfeespro
```

```bash
firebase deploy --only hosting:live --project schoolfeespro
```

Or both at once with `--only hosting`. Targets are mapped in `.firebaserc`; `firebase.json` deploys the repository root and excludes `docs/`, `tests/`, `tools/`, `test-results/`, dotfiles and Markdown.

**Try it on `test` first.** That is what it is for: the staging site runs the same code against a separate database, so you can mark anyone absent, pin cover and send yourself the message without a single teacher seeing it.

## The one thing that is not in git

`scripts/config.local.js` holds the database credential and is **gitignored**, so it reaches the site from your local checkout rather than from the repository. Consequences worth knowing:

- A fresh `git clone` cannot deploy a working build. Copy `scripts/config.sample.js` to `scripts/config.local.js` and fill it in first.
- Deploy from a checkout that has the file, or the deployed app silently falls back to single-device mode and the admin panel reads "Database not connected".

## How an environment picks its database

`config.local.js` chooses by hostname, so one file and one deploy directory serve both sites:

- hostname contains `-test`, or is `localhost` / `127.0.0.1` → `neondb_test`
- anything else → `neondb`

This is not a nicety. Before it existed, trying something out on a laptop wrote a fictional absence straight into the plan the whole staff was reading — which is exactly how it was discovered. The running app shows which database it is on: the Substitutes screen displays a red **TEST database · not the live plan** badge on staging.

## Rotating the credential

The deployed page serves the connection string to anyone who opens it. That is the accepted trade for having no server. When you rotate:

1. Change the password in the Neon console.
2. Update `scripts/config.local.js`.
3. Redeploy both targets.

Devices pick the new credential up on their next load. The service worker fetches `config.local.js` **network-first** specifically so that a rotation cannot be masked by a cached copy — every other asset is cache-first, and a stale credential would otherwise keep failing on every installed device with no visible cause. Prefer a Neon role limited to `teacher_shifts` and `substitution_plans` over `neondb_owner`.

## Why deploys used to not arrive

Firebase Hosting serves everything with `Cache-Control: max-age=3600` by default. With a precaching service worker on top, that produced a deploy that reached nobody:

1. The browser held the old `app.js` for an hour.
2. The new worker installed, and `cache.addAll` **reused that stale copy** from the HTTP cache.
3. Being cache-first, the worker then served the old build indefinitely — a version bump that changed nothing.

Two fixes, both needed:

- `firebase.json` serves `**/*.@(js|css|html|webmanifest)` as `no-cache`. The service worker is the cache; an HTTP cache on top of it only ever serves stale builds.
- `sw.js` precaches with `fetch(asset, { cache: 'reload' })` instead of `cache.addAll`, so install always fetches fresh bytes regardless of what the browser is holding.

If a change ever appears not to deploy, check that both are still in place before suspecting the code. `curl` sees the new file while the browser does not — that asymmetry is the signature.

## After deploying

Check the live site rather than assuming:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://vpps-timetable.web.app
```

Then open it and confirm the Substitutes screen reads "Saved to the school database" (or the red TEST badge on staging). A service-worker change also needs both cache names in `sw.js` bumped, or returning devices keep the old build.
