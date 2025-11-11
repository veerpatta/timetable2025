# Tests

The `tests/manual/` directory contains exploratory harnesses that we open directly during QA.
Each subfolder groups related checks:

- `accessibility/` – Browser-based accessibility walkthroughs (`test-a11y.html`).
- `colors/` – Browser harness for palette reviews (`test-colors.html`) and Node utilities (`verify-contrast.js`).
- `mapping/` – Node-based assertions for subject → category mapping (`test-mapping.js`).
- `performance/` – Browser stress harness for the virtual-scrolling implementation (`perf-test.html`).

## Running the manual harnesses

### Browser-driven checks
Open the HTML fixtures in your browser directly from the repo root or via a static server:

```bash
# Serve the project locally (optional, but avoids CORS issues)
npx http-server .
# Then visit http://localhost:8080/tests/manual/accessibility/test-a11y.html, etc.
```

You can also open the HTML files from disk (`File → Open`) if a server is not available.
The pages load shared assets from `public/assets/`, so make sure that directory travels with the repo when copying the files elsewhere.

### Node-driven checks
Run the utility scripts with Node.js from the repository root:

```bash
node tests/manual/colors/verify-contrast.js
node tests/manual/mapping/test-mapping.js
```

These scripts log PASS/FAIL summaries to the console and do not require additional setup.

## Future automated testing

When we introduce automated tests they should live alongside the manual fixtures:

- Place browser automation suites under `tests/automated/` (e.g., Playwright).
- Store Node-based unit/integration suites under `tests/automated/node/`.

Keeping both manual and automated assets under `tests/` preserves a single entry point for QA documentation and tooling.
