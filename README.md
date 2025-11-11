# Time Table Command Center

Time Table Command Center is a Progressive Web App (PWA) for Veer Patta Public School. It helps administrators and teachers manage daily schedules, automate substitution planning, and share updates quickly across devices. The project is optimized for offline access, mobile responsiveness, and rapid QA so deployments remain dependable during the school year.

## High-Level Architecture

- **Static front-end** served from the [`public/`](public) directory. The UI is written in vanilla HTML/CSS/JS with modular scripts for theming, accessibility, color coding, and performance helpers.
- **Client-side data model** powered by JSON-driven timetable structures. The substitution workflow calculates schedule changes entirely in the browser for reliability when offline.
- **Service worker** (`public/sw.js`) provides caching, offline support, and push-style notifications.
- **QA harnesses** (`test-*.html`, `tests/`) validate accessibility, color contrast, and rendering performance without requiring a backend.
- **Build tooling** in [`tools/`](tools) generates reports that track bundle sizes and compression ratios for every release.

## Directory Layout

| Path | Purpose |
| ---- | ------- |
| [`public/`](public) | Source of truth for all static assets that ship to browsers (HTML, CSS, JS, service worker, manifest). |
| [`public/assets/`](public/assets) | Images, icons, and downloadable files bundled with the app. Icons specifically live in [`public/assets/icons/`](public/assets/icons). |
| [`docs/`](docs) | Long-form guides and reference material. Icon and asset instructions are consolidated under [`docs/guides/assets.md`](docs/guides/assets.md). |
| [`tests/`](tests) | Manual QA harnesses (e.g., `perf-test.html`) that exercise isolated pieces of the UI. Additional ad-hoc harnesses such as `test-a11y.html` and `test-colors.html` stay at the repository root for quick double-click execution. |
| [`tools/`](tools) | Developer tooling. Currently houses `build-report.js` for bundle analysis. |
| Root files | Project documentation, generated reports (`build-report.json`, `FINAL_BUILD_REPORT.txt`, etc.), and helper scripts like `verify-contrast.js` or `test-mapping.js`. |

## Getting Started Checklist

1. **Install Node.js 18+** (for running tooling such as `tools/build-report.js`).
2. **Install a static server** if you do not already have one. Options:
   - `npm install --global serve`
   - or use the built-in Python module (`python3 -m http.server 8000`)
3. **Clone the repository** and switch to the working branch for your task.
4. **Serve the app** from the `public/` directory (see instructions below) and confirm the UI loads without console errors.
5. **Run manual QA harnesses**:
   - Open `test-a11y.html` to review accessibility helpers.
   - Open `test-colors.html` to inspect color palettes.
   - Open `tests/perf-test.html` to evaluate virtualization and caching helpers.
6. **Generate build reports** with `node tools/build-report.js` to capture size regressions.
7. **Review configuration files**:
   - Feature flags live in `public/scripts/ui.js` and `public/scripts/a11y.js`.
   - Theme and color tokens reside in `public/styles/theme.css` and `public/styles/colors.css`.
   - Service worker behavior is defined in `public/sw.js`.

## Local Development

### Serve the `public/` Folder

```bash
# From the repository root
npx serve public
# or
python3 -m http.server 8000 --directory public
```

Open `http://localhost:3000` (or the port reported by your server). The service worker expects to run relative to the `/public` root, so always serve that directory rather than the repository root.

### Manual QA Harnesses

Manual harnesses do not require a build step—open them directly in a browser.

- `test-a11y.html` loads the accessibility tooling from `public/scripts/a11y.js` and applies styles from `public/styles/a11y.css` and `public/styles/theme.css`.
- `test-colors.html` previews the palette defined in `public/styles/colors.css`.
- `tests/perf-test.html` stress-tests virtualization logic by importing `public/scripts/perf.js`.

Keep an eye on the browser console; each harness logs additional diagnostics.

### Build & QA Reports

Run the bundle analysis to generate an updated `build-report.json` and console summary:

```bash
node tools/build-report.js
```

This command scans the assets in `public/`, calculates raw and gzipped sizes, and produces `build-report.json` at the repository root.

## Contribution Workflow

1. **Open an issue or pick an item from the backlog.** Record the intent and acceptance criteria.
2. **Create a feature branch** using the `feature/<short-description>` or `fix/<ticket-id>` convention.
3. **Make focused commits** with descriptive messages. Keep documentation in sync with any user-facing changes.
4. **Run local checks**: serve the site, exercise the manual QA harnesses, and regenerate the build report.
5. **Submit a pull request** describing the change, testing performed, and any follow-up work.
6. **Request review** from another maintainer. Address feedback promptly and keep discussions tied to the relevant commits.
7. **Merge via squash or rebase** once approvals are in place and CI (if any) is green.

For more detailed asset guidance see [`docs/guides/assets.md`](docs/guides/assets.md).
