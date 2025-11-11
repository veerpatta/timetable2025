# Veer Patta Timetable Command Center

A modern, offline-first progressive web application (PWA) designed for Veer Patta Public School to manage and display class timetables. Built with accessibility, performance, and user experience at its core, this application provides school administrators, teachers, and students with a reliable, fast, and inclusive timetable management system.

## Project Purpose

This timetable application delivers:
- **Offline-First Architecture**: Service worker powered offline support ensures the timetable is always accessible
- **Accessibility**: WCAG AA compliant with keyboard navigation, screen reader support, and high contrast mode
- **Performance**: Virtual scrolling, intelligent caching, and lazy loading for smooth user experience
- **Color-Coded Subjects**: Visual categorization system with scientifically validated contrast ratios
- **Progressive Enhancement**: Works on all modern browsers with graceful degradation

## High-Level Architecture

The application follows a modular, component-based architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│  (Main application entry point with inline timetable data)  │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
      ┌─────▼─────┐     ┌────▼────┐     ┌─────▼─────┐
      │  Scripts  │     │ Styles  │     │  Service  │
      │  Modules  │     │  (CSS)  │     │  Worker   │
      └───────────┘     └─────────┘     └───────────┘
            │                 │                 │
      ┌─────┼─────┬──────┬───┼────┬───────────┼────────┐
      │     │     │      │   │    │           │        │
   perf.js  │  colors.js │ theme.css    Offline Cache  │
         a11y.js      ui.js   │                     Precaching
                         a11y.css
                         colors.css
                         ui.css
```

**Core Components:**
- **UI Layer** (`scripts/ui.js`, `styles/ui.css`): DOM manipulation, event handling, timetable rendering
- **Performance Layer** (`scripts/perf.js`): Virtual scrolling, caching, debouncing, lazy loading
- **Accessibility Layer** (`scripts/a11y.js`, `styles/a11y.css`): Keyboard navigation, ARIA support, screen reader enhancements
- **Color System** (`scripts/colors.js`, `styles/colors.css`): Subject categorization and color coding
- **Service Worker** (`sw.js`): Offline support, resource caching, performance optimization
- **PWA Manifest** (`manifest.webmanifest`): App installation, theming, and metadata

## Directory Layout

```
timetable2025/
├── index.html              # Main application entry point
├── sw.js                   # Service worker for offline support
├── manifest.webmanifest    # PWA manifest for app installation
├── build-report.js         # Build analysis tool (generates size reports)
│
├── scripts/                # JavaScript modules
│   ├── ui.js              # UI logic and DOM manipulation
│   ├── perf.js            # Performance optimizations
│   ├── a11y.js            # Accessibility features
│   └── colors.js          # Color coding system
│
├── styles/                 # CSS stylesheets
│   ├── theme.css          # Core theme and layout
│   ├── ui.css             # UI component styles
│   ├── a11y.css           # Accessibility styles
│   └── colors.css         # Color system definitions
│
├── icons/                  # PWA icons (see docs/guides/assets.md)
│   └── icon-512.png       # App icon (additional sizes needed)
│
├── docs/                   # Project documentation
│   ├── README.md          # Documentation index
│   ├── guides/            # Product guides and references
│   │   ├── ACCESSIBILITY_SUMMARY.md
│   │   ├── COLOR_CODING_SUMMARY.md
│   │   ├── FEATURE_FLAGS.md
│   │   ├── MODERN_UI_GUIDE.md
│   │   ├── PERFORMANCE.md
│   │   ├── QA_CHECKLIST.md
│   │   ├── README-icons.md       # Icon requirements (legacy)
│   │   ├── assets.md             # Asset management guide
│   │   ├── SERVICE_WORKER_TESTING.md
│   │   └── UPGRADE_NOTES.md
│   └── reports/           # Generated build and QA reports
│       ├── FINAL_QA_REPORT.md
│       ├── FINAL_BUILD_REPORT.txt
│       └── build-report.json
│
└── tests/                  # Test suites
    ├── README.md          # Test documentation
    └── manual/            # Manual test harnesses
        ├── accessibility/ # Accessibility tests
        ├── colors/        # Color contrast tests
        ├── performance/   # Performance tests
        └── test-mapping.js
```

## Getting Started

Follow these steps to set up the development environment and start working with the application:

### Prerequisites
- **Node.js** (v14 or higher) - Required for build tools and local server
- **Modern web browser** - Chrome, Firefox, Safari, or Edge (latest versions)
- **Git** - For version control

### Quick Start Checklist

- [ ] **Clone the repository**
  ```bash
  git clone https://github.com/veerpatta/timetable2025.git
  cd timetable2025
  ```

- [ ] **Install dependencies** (optional, only needed for tooling)
  ```bash
  npm install
  # This installs http-server for local development
  ```

- [ ] **Serve the application locally**
  ```bash
  # Option 1: Using npx (no install required)
  npx http-server . -p 8080
  
  # Option 2: Using Python (if Node.js not available)
  python3 -m http.server 8080
  
  # Option 3: Open index.html directly in browser (limited functionality)
  open index.html  # macOS
  xdg-open index.html  # Linux
  start index.html  # Windows
  ```
  
  Navigate to `http://localhost:8080` in your browser.

- [ ] **Verify the service worker** is registered (open browser DevTools → Application tab)

- [ ] **Test offline functionality** (in DevTools → Network tab, select "Offline" and reload)

- [ ] **Run manual tests** (see [Testing](#testing) section below)

- [ ] **Generate a build report** (see [Build Reports](#build-reports) section)

### Configuration Files

- **`manifest.webmanifest`** - PWA configuration (app name, icons, theme colors)
- **`sw.js`** - Service worker configuration (cache strategy, offline resources)
- **`icons/`** - App icons (see [`docs/guides/assets.md`](docs/guides/assets.md) for requirements)

## Local Development

### Serving the Application

The application is a static PWA and can be served from the root directory:

```bash
# Recommended: Using http-server (supports proper MIME types)
npx http-server . -p 8080 -c-1

# Alternative: Using Python
python3 -m http.server 8080

# Alternative: Using PHP
php -S localhost:8080
```

**Important Notes:**
- Service workers require HTTPS in production (localhost works over HTTP)
- Use `-c-1` with http-server to disable caching during development
- The application root serves as the "public" folder - all assets are referenced from root

### Making Changes

1. **Edit files** in their respective directories (`scripts/`, `styles/`, etc.)
2. **Refresh browser** to see changes (service worker may cache aggressively)
3. **Clear service worker cache** if needed (DevTools → Application → Clear Storage)
4. **Test across browsers** for compatibility
5. **Run manual tests** to verify functionality (see [Testing](#testing))
6. **Generate build report** before committing (see [Build Reports](#build-reports))

### Development Workflow

```bash
# 1. Make your changes to code files
vim scripts/ui.js

# 2. Test locally
npx http-server . -p 8080

# 3. Run relevant manual tests
open tests/manual/performance/perf-test.html

# 4. Generate build report
node build-report.js

# 5. Commit changes
git add .
git commit -m "feat: add new feature"
git push
```

## Testing

The application uses manual test harnesses for quality assurance. See [`tests/README.md`](tests/README.md) for comprehensive testing documentation.

### Quick Test Overview

```bash
# 1. Serve the application
npx http-server . -p 8080

# 2. Open test harnesses in browser
open http://localhost:8080/tests/manual/accessibility/test-a11y.html
open http://localhost:8080/tests/manual/colors/test-colors.html
open http://localhost:8080/tests/manual/performance/perf-test.html

# 3. Run Node.js tests
node tests/manual/colors/verify-contrast.js
node tests/manual/test-mapping.js
```

### Test Categories

- **Accessibility Tests** (`tests/manual/accessibility/`)
  - Keyboard navigation validation
  - Screen reader compatibility
  - High contrast mode verification
  - WCAG AA compliance checks

- **Color System Tests** (`tests/manual/colors/`)
  - Contrast ratio verification (browser and Node.js)
  - Subject categorization validation
  - Visual color display testing

- **Performance Tests** (`tests/manual/performance/`)
  - Virtual scrolling with 500+ rows
  - Cache system functionality
  - Debouncing efficiency
  - Lazy loading verification

See [`tests/README.md`](tests/README.md) for detailed test instructions and expected results.

## Build Reports

The `build-report.js` tool analyzes application assets and generates size reports:

```bash
# Generate a fresh build report
node build-report.js
```

**What it does:**
- Analyzes file sizes (raw and gzipped) for all assets
- Calculates total bundle size
- Checks against size budgets (500KB target)
- Identifies optimization opportunities
- Saves reports to `docs/reports/`

**Output files:**
- `docs/reports/build-report.json` - Machine-readable report
- Console output with recommendations

**Example output:**
```
═══════════════════════════════════════════════════════════════
BUILD SIZE ANALYSIS - Veer Patta Public School Timetable
═══════════════════════════════════════════════════════════════

Total Bundle Size
─────────────────────────────────────────────────────────────
  Raw:       245.6 KB
  Gzipped:    78.3 KB ✓ (within 500KB budget)
  
...
```

Run the build report before committing significant changes to ensure bundle size stays optimized.

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

### Product Guides ([`docs/guides/`](docs/guides/))
- [`ACCESSIBILITY_SUMMARY.md`](docs/guides/ACCESSIBILITY_SUMMARY.md) - WCAG implementation details
- [`COLOR_CODING_SUMMARY.md`](docs/guides/COLOR_CODING_SUMMARY.md) - Subject color system reference
- [`FEATURE_FLAGS.md`](docs/guides/FEATURE_FLAGS.md) - Feature flag management
- [`MODERN_UI_GUIDE.md`](docs/guides/MODERN_UI_GUIDE.md) - UI patterns and components
- [`PERFORMANCE.md`](docs/guides/PERFORMANCE.md) - Performance optimization guide
- [`QA_CHECKLIST.md`](docs/guides/QA_CHECKLIST.md) - Release validation procedures
- [`assets.md`](docs/guides/assets.md) - Icon and asset management guide
- [`SERVICE_WORKER_TESTING.md`](docs/guides/SERVICE_WORKER_TESTING.md) - Service worker validation
- [`UPGRADE_NOTES.md`](docs/guides/UPGRADE_NOTES.md) - Version migration notes

### Reports ([`docs/reports/`](docs/reports/))
- `FINAL_QA_REPORT.md` - Final QA summary and sign-off
- `FINAL_BUILD_REPORT.txt` - Generated build metrics
- `build-report.json` - Machine-readable build data

## Contributing

We welcome contributions! Please follow these guidelines:

### Contribution Workflow

1. **Fork and clone** the repository
2. **Create a feature branch** (`git checkout -b feature/my-feature`)
3. **Make your changes** following the code style
4. **Test thoroughly** using manual test harnesses
5. **Generate build report** to verify bundle size
6. **Update documentation** if adding features
7. **Commit changes** with descriptive messages
8. **Push to your fork** and create a pull request

### Code Style Guidelines

- **JavaScript**: Use ES6+ features, avoid global scope pollution
- **CSS**: Follow BEM-like naming conventions, use CSS custom properties
- **Comments**: Document complex logic, avoid obvious comments
- **Modularity**: Keep files focused on single responsibility

### Testing Requirements

- Run all relevant manual tests before submitting PR
- Verify accessibility with keyboard navigation
- Test offline functionality
- Check color contrast ratios if modifying colors
- Validate across multiple browsers

### Documentation Updates

- Update README.md for new features or workflow changes
- Add guides to `docs/guides/` for significant features
- Update `docs/README.md` index when adding new documents
- Keep code comments current with implementation

## Support & Contact

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/veerpatta/timetable2025/issues)
- **Discussions**: General questions and discussions
- **Pull Requests**: Contributions and improvements

## License

This project is maintained for Veer Patta Public School. See repository settings for license information.

---

**Quick Links:**
- [Documentation Index](docs/README.md)
- [Test Suite Guide](tests/README.md)
- [Asset Management](docs/guides/assets.md)
- [Accessibility Guide](docs/guides/ACCESSIBILITY_SUMMARY.md)
- [Performance Guide](docs/guides/PERFORMANCE.md)
