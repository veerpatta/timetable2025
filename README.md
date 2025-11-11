# Veer Patta Timetable Command Center

This repository contains the modernized timetable web experience for Veer Patta Public School. The app delivers an offline-first
progressive web app with accessibility, performance, and quality-of-life enhancements tailored for school administrators,
teachers, and students.

## Quick Start

```bash
# Install dependencies (only required for optional tooling)
npm install

# Serve the site locally
npx http-server .

# Generate a fresh build report
node build-report.js
```

Open `index.html` in your browser (or visit the local server URL) to explore the full timetable experience. The
`sw.js` service worker powers offline support, while scripts and styles under `scripts/` and `styles/` organize feature
modules such as accessibility, performance, and color coding.

## Documentation

Project documentation now lives under [`docs/`](docs/README.md):

- Product guides are curated in [`docs/guides/`](docs/guides), including deep dives on accessibility, performance tuning,
  feature flags, UI patterns, and QA processes.
- Release artifacts and generated reports land in [`docs/reports/`](docs/reports). Regenerate build metrics via
  `node build-report.js`; outputs are saved automatically to `docs/reports/`.

For icon export requirements, consult [`docs/guides/README-icons.md`](docs/guides/README-icons.md). Additional upgrade
history and operational procedures are documented within the guides collection.

## Scripts & Tooling

- [`build-report.js`](build-report.js) — analyzes asset sizes and writes reports to `docs/reports/`.
- [`verify-contrast.js`](verify-contrast.js) — checks color contrast ratios against WCAG targets.
- [`test-mapping.js`](test-mapping.js) and the `tests/` directory — provide targeted validation suites.

Feel free to open issues or submit pull requests for enhancements, bug fixes, or documentation updates.
