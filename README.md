# Timetable 2025

## Project Structure

- `public/` – production-ready static assets
  - `public/index.html` – application entry point
  - `public/manifest.webmanifest` – PWA manifest
  - `public/sw.js` – service worker
  - `public/assets/` – scripts, styles, and icons consumed by the app

## Building & Reports

Run the build report script from the repository root to analyze bundle sizes. The
script now targets the assets inside `public/`.

```sh
node build-report.js
```

## Deployment

Deploy the contents of the `public/` directory to your static hosting provider.
All relative asset paths within `index.html` and `sw.js` assume that `public/`
is the web root.
