# Service Worker Testing Guide

This guide covers the current service worker behavior in `sw.js` and the minimum checks to run after editing cached runtime assets.

## Current Model

`sw.js` defines two cache names:

- `CACHE_NAME`
- `STATIC_CACHE_NAME`

As of April 2026, the file uses version `v13`, but always verify the live values in `sw.js` before making changes.

## What The Service Worker Caches

### Core local assets

The `CORE_ASSETS` list currently precaches:

- `./`
- `./index.html`
- `./manifest.webmanifest`
- `./icons/icon-512.png`
- `./scripts/perf.js`
- `./scripts/a11y.js`
- `./scripts/colors.js`
- `./scripts/ui.js`
- `./styles/theme.css`
- `./styles/a11y.css`
- `./styles/colors.css`
- `./styles/ui.css`

### Optional external assets

The `OPTIONAL_EXTERNAL_ASSETS` list attempts to cache these when available:

- `html2canvas`
- `jsPDF`
- `lucide`
- Google Fonts stylesheet

Optional external asset failures do not fail installation.

## When You Must Bump The Cache Version

Bump both cache constants whenever you change a precached runtime asset, including:

- `index.html`
- `sw.js`
- `manifest.webmanifest`
- anything in `scripts/`
- anything in `styles/`
- `icons/icon-512.png`

You do not need a service worker bump for:

- docs-only changes
- moving reference files that are not part of `CORE_ASSETS`

## Local Test Workflow

Serve with caching disabled at the HTTP layer:

```powershell
npx http-server . -p 8080 -c-1
```

Open `http://localhost:8080`, then use browser DevTools.

## Minimum Checks After A Service Worker Relevant Change

### 1. Registration

Verify:

- service worker registers successfully
- no install or activation errors appear in the console

The app registers `./sw.js` from `index.html` during startup.

### 2. Cache creation

In DevTools, check that:

- the current static cache exists
- the current dynamic cache exists
- core assets are present in the static cache

### 3. Update behavior

After bumping cache versions and reloading:

- the new service worker installs
- old cache versions are removed on activation
- the new cache names appear in Cache Storage

### 4. Offline behavior

After the app has loaded once online:

1. enable offline mode in DevTools
2. reload the page
3. verify the main app still renders
4. switch between the key views you touched

If a document request misses both cache and network, the service worker returns a simple offline HTML response.

## Fetch Strategy Summary

### Static assets

Static assets use cache-first with network fallback.

### Timetable-like or API-like requests

Requests whose path contains `timetable` or `api` use network-first with cache fallback. The current app keeps timetable data inline, so this path is mainly future-facing.

## Useful DevTools Checks

### Application tab

- Service Worker status
- Cache Storage contents
- unregister or update controls

### Network tab

Look for responses served from the service worker after the first load.

## Practical Regression Checklist

Run this after changing any cached asset:

- hard reload the app
- confirm the new cache version appears
- confirm the old cache version is gone
- verify the affected UI path
- verify the app still opens offline

## Troubleshooting

### Changes do not appear

- verify you bumped both cache constants
- hard refresh the page
- close other tabs using the same app
- check DevTools for a waiting service worker

### Offline mode fails

- confirm the app loaded online first
- confirm the asset exists in `CORE_ASSETS`
- confirm the cache contains the expected file

### Old cache survives

- verify the activation cleanup still excludes only the current cache names
- reload after the new worker activates

## Quick Commands

```powershell
rg -n "CACHE_NAME|STATIC_CACHE_NAME|CORE_ASSETS|OPTIONAL_EXTERNAL_ASSETS" sw.js
```
