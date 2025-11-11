# Test Suite Documentation

This directory contains the test harnesses for the Veer Patta Public School Timetable Command Center.

## Directory Structure

```
tests/
├── README.md (this file)
└── manual/                    # Manual test harnesses
    ├── accessibility/         # Accessibility validation tests
    │   └── test-a11y.html    # Interactive accessibility feature testing
    ├── colors/               # Color system validation
    │   ├── test-colors.html  # Visual color contrast testing
    │   └── verify-contrast.js # Automated contrast ratio checker (Node.js)
    ├── performance/          # Performance optimization tests
    │   └── perf-test.html    # Virtual scrolling, caching, and lazy loading tests
    └── test-mapping.js       # Subject category mapping validation (Node.js)
```

## Manual Tests

Manual tests are browser-based or Node.js scripts that require human interaction or inspection to validate functionality.

### Running Browser-Based Tests

Browser-based tests are interactive HTML pages that you open in a web browser to manually verify features.

#### 1. Accessibility Tests

**Location:** `manual/accessibility/test-a11y.html`

**How to run:**
```bash
# Option 1: Serve locally
npx http-server /home/runner/work/timetable2025/timetable2025
# Then navigate to: http://localhost:8080/tests/manual/accessibility/test-a11y.html

# Option 2: Open directly in browser
open tests/manual/accessibility/test-a11y.html  # macOS
xdg-open tests/manual/accessibility/test-a11y.html  # Linux
start tests/manual/accessibility/test-a11y.html  # Windows
```

**What it tests:**
- Keyboard navigation (Tab, Enter, Space)
- Keyboard shortcuts menu (press `?`)
- High contrast mode (press `k`) - WCAG AA compliance
- Screen reader announcements (ARIA live regions)
- Focus indicators and visual accessibility

**Expected results:**
- All interactive elements are keyboard accessible
- Shortcuts menu opens with `?` key
- High contrast mode toggles with `k` key and meets WCAG AA standards (≥4.5:1 contrast)
- Screen reader announces UI changes

#### 2. Color System Tests

**Location:** `manual/colors/test-colors.html`

**How to run:**
```bash
# Serve locally
npx http-server /home/runner/work/timetable2025/timetable2025
# Then navigate to: http://localhost:8080/tests/manual/colors/test-colors.html

# Or open directly
open tests/manual/colors/test-colors.html
```

**What it tests:**
- Subject color coding visual display
- Contrast ratios for all subject categories
- WCAG AA compliance (≥4.5:1)

**Expected results:**
- All subject categories display with appropriate colors
- All contrast ratios show ✓ PASS (≥4.5:1)
- Subject samples render with correct category colors

#### 3. Performance Tests

**Location:** `manual/performance/perf-test.html`

**How to run:**
```bash
# Serve locally
npx http-server /home/runner/work/timetable2025/timetable2025
# Then navigate to: http://localhost:8080/tests/manual/performance/perf-test.html

# Or open directly
open tests/manual/performance/perf-test.html
```

**What it tests:**
- Virtual scrolling with 500+ rows
- Cache system functionality and TTL expiration
- Debouncing for performance optimization
- Lazy loading of external libraries (html2canvas, jsPDF)

**Expected results:**
- Virtual scrolling renders 500 rows efficiently
- Cache system stores and retrieves data correctly
- Debouncing reduces function calls (10 calls → 1 execution)
- External libraries load on demand

**How to use:**
1. Click "🚀 Test Virtual Scrolling" to test rendering performance
2. Click "💾 Test Cache System" to validate caching
3. Click "⏱️ Test Debouncing" to verify debounce logic
4. Click "📦 Test Lazy Loading" to check on-demand library loading
5. Monitor the logs and stats panels for results

### Running Node.js Tests

Node.js tests are command-line scripts that output results to the console.

#### 1. Color Contrast Verification

**Location:** `manual/colors/verify-contrast.js`

**How to run:**
```bash
node tests/manual/colors/verify-contrast.js
```

**What it tests:**
- Automated contrast ratio calculations for all subject categories
- WCAG AA compliance verification (≥4.5:1)

**Expected output:**
```
============================================================
Subject Color Coding - Contrast Ratio Verification
WCAG AA Standard: ≥4.5:1
============================================================

Languages (Blue)
  Background: #dbeafe
  Text:       #1e3a8a
  Ratio:      7.32:1 ✓ PASS

[... similar output for all categories ...]

============================================================
✓ All colors meet WCAG AA standards!
============================================================
```

#### 2. Subject Mapping Validation

**Location:** `manual/test-mapping.js`

**How to run:**
```bash
node tests/manual/test-mapping.js
```

**What it tests:**
- Subject names are correctly categorized (languages, sciences, math, social, sports)
- Edge cases and special subjects (e.g., "Political Science", "CCS", "Home Work")

**Expected output:**
```
============================================================
Subject Category Mapping Test
============================================================
Results: 25 passed, 0 failed
✓ All mappings correct!
============================================================
```

## Automated Tests (Future)

Currently, all tests are manual. If automated tests are added in the future:

- **Unit tests** would go in `tests/unit/`
- **Integration tests** would go in `tests/integration/`
- **E2E tests** would go in `tests/e2e/`

Suggested test runners for future automation:
- **Unit/Integration:** Jest, Mocha, or Vitest
- **E2E:** Playwright, Cypress, or Puppeteer

## Test Coverage Goals

Manual tests currently cover:
- ✅ Accessibility features (WCAG AA compliance)
- ✅ Color contrast ratios
- ✅ Subject categorization logic
- ✅ Performance optimizations (virtual scrolling, caching, lazy loading)

## Contributing

When adding new manual tests:
1. Place them in the appropriate `manual/` subdirectory
2. Update this README with instructions
3. Ensure paths reference assets correctly (usually `../../../` for root-level directories)
4. Document expected results and how to interpret test output

## Related Documentation

- [`docs/guides/ACCESSIBILITY_SUMMARY.md`](../docs/guides/ACCESSIBILITY_SUMMARY.md) - Accessibility features overview
- [`docs/guides/PERFORMANCE.md`](../docs/guides/PERFORMANCE.md) - Performance optimization details
- [`docs/guides/COLOR_CODING_SUMMARY.md`](../docs/guides/COLOR_CODING_SUMMARY.md) - Color system documentation
- [`docs/reports/FINAL_QA_REPORT.md`](../docs/reports/FINAL_QA_REPORT.md) - Comprehensive QA results
