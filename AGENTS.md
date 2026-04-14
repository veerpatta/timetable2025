# Agent Quick Reference Guide
**Veer Patta Public School Timetable PWA**

---

## 🎯 Repository Overview

This is a **Progressive Web App (PWA)** for managing and displaying class timetables at Veer Patta Public School. It's a vanilla JavaScript, offline-first, accessibility-focused application with **no frameworks** and **no build process**.

### Key Characteristics
- **Type**: Static PWA (Progressive Web App)
- **Architecture**: Modular vanilla JavaScript (ES6+)
- **Data Storage**: Inline CSV in HTML (no database)
- **Bundle Size**: 69.32 KB gzipped (309 KB raw)
- **Accessibility**: WCAG 2.1 Level AA compliant
- **Offline Support**: Full offline functionality via Service Worker
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

---

## 📁 Critical File Locations

### Core Application Files
```
/home/user/timetable2025/
├── index.html              # 5051 lines - Main app + ALL timetable data (line ~1681)
├── sw.js                   # Service Worker v2 - Offline support & caching
├── manifest.webmanifest    # PWA manifest
└── build-report.js         # Bundle size analyzer (Node.js)
```

### Modular JavaScript (scripts/)
```
scripts/
├── ui.js       # Modern UI components (FAB, bottom sheets, snackbars) - 43.7KB
├── perf.js     # Performance optimizations (virtual scroll, caching) - 18.3KB
├── a11y.js     # Accessibility (keyboard nav, screen reader) - 14.3KB
└── colors.js   # Subject color coding system - 9.4KB
```

### Stylesheets (styles/)
```
styles/
├── theme.css   # Core theme & dark mode tokens - 8.9KB
├── ui.css      # UI component styles - 19.7KB
├── a11y.css    # Accessibility enhancements - 12.0KB
└── colors.css  # Subject color definitions - 7.2KB
```

### Documentation (docs/)
```
docs/
├── README.md                       # Documentation index
├── guides/                         # Feature guides (10 files)
│   ├── ACCESSIBILITY_SUMMARY.md
│   ├── COLOR_CODING_SUMMARY.md
│   ├── FEATURE_FLAGS.md
│   ├── MODERN_UI_GUIDE.md
│   ├── PERFORMANCE.md
│   ├── QA_CHECKLIST.md
│   └── SERVICE_WORKER_TESTING.md
└── reports/                        # Generated reports
    ├── FINAL_QA_REPORT.md
    ├── FINAL_BUILD_REPORT.txt
    └── build-report.json
```

### Tests (tests/)
```
tests/
└── manual/
    ├── accessibility/  # A11y validation (test-a11y.html)
    ├── colors/         # Contrast verification (verify-contrast.js)
    └── performance/    # Performance tests (perf-test.html)
```

---

## 🔑 Critical Concepts

### 1. Feature Flag System
**Location**: `index.html:1531`

All major features are controlled by feature flags:

```javascript
const FEATURE_FLAGS = {
  feat_dark_mode: true,      // Dark mode toggle
  feat_color_coding: true,   // Subject color coding
  feat_modern_ui: true,      // Modern UI components
  feat_perf_opt: true,       // Performance optimizations
};
```

**Important**:
- Changes affect ALL users immediately (no gradual rollout)
- Test thoroughly before disabling features
- Check `docs/guides/FEATURE_FLAGS.md` before modifications

### 2. Timetable Data Structure
**Location**: `index.html:~1681-1850`

All timetable data is **hardcoded** as inline CSV text:

```
Format:
[DayName]
Class,Period 1<br>8:30 AM - 9:10 AM,Period 2<br>9:10 AM - 9:50 AM,...
[ClassName],[Subject (Teacher)],[Subject (Teacher)],...

Example:
Monday
Class,Period 1<br>8:30 AM - 9:10 AM,Period 2<br>9:10 AM - 9:50 AM,...
Class 12 Science,Chemistry (Toshit),Physics (Phy),...
```

**Critical**:
- Must maintain exact format: `Subject (Teacher)`
- Exactly 8 periods per class per day
- Commas and parentheses are parsing delimiters
- Format errors break the entire timetable

### 3. Service Worker Cache Versioning
**Location**: `sw.js:4-5`

```javascript
const CACHE_NAME = 'vpps-timetable-v2';
const STATIC_CACHE_NAME = 'vpps-static-v2';
```

**CRITICAL RULE**:
- **MUST increment version** when updating ANY cached asset
- Users won't see changes until cache version changes
- Current version: `v2` → change to `v3` after updates
- Old caches are auto-deleted on activation

**When to increment**:
- Changed `index.html` → Increment
- Changed any `scripts/*.js` → Increment
- Changed any `styles/*.css` → Increment
- Added new assets → Increment

### 4. Subject Color Coding
**Location**: `scripts/colors.js:27-59`

5 subject categories with WCAG AA compliant colors:

```javascript
SUBJECT_CATEGORIES = {
  languages: ['english', 'hindi', 'sanskrit', ...],  // Blue
  sciences: ['physics', 'chemistry', 'biology', ...], // Green
  math: ['maths', 'mathematics', ...],                // Purple
  social: ['sst', 'history', 'geography', ...],       // Orange
  sports: ['sports', 'physical', 'pt', ...],          // Red
}
```

**Contrast ratios**: 6.78:1 to 8.49:1 (exceeds 4.5:1 minimum)

---

## ⚙️ Common Tasks

### Task 1: Update Timetable (Most Common)

**Scenario**: Change Class 12 Commerce Wednesday Period 4 subject

```bash
# 1. Locate data in index.html
# Search for "Wednesday" (around line ~1719)
# Find "Class 12 Commerce" row
# Locate Period 4 (4th subject after class name)

# 2. Edit the CSV entry
# BEFORE: Hindi (Jainendra),Business (Pradhyuman),...
# AFTER:  Business (Pradhyuman),Hindi (Jainendra),...

# 3. Update service worker version
# Edit sw.js line 4: 'vpps-timetable-v2' → 'vpps-timetable-v3'

# 4. Test locally
npx http-server . -p 8080
# Navigate to Wednesday → Class 12 Commerce → Verify change

# 5. Commit and push
git add index.html sw.js
git commit -m "fix: swap Wed P4 subjects for Class 12 Commerce"
git push -u origin claude/[branch-name]
```

**Watch Out For**:
- Typos in teacher names (affects teacher view)
- Missing commas (breaks parser)
- Wrong format: `Subject Teacher` ❌ should be `Subject (Teacher)` ✅
- Period count mismatch (must be exactly 8 periods)

### Task 2: Add New Subject Color

**Scenario**: Add a new subject to color coding system

```bash
# 1. Determine category (languages/sciences/math/social/sports)

# 2. Edit scripts/colors.js
# Add subject name to appropriate category array (lowercase)
sciences: [
  'physics', 'chemistry', 'biology',
  'new-subject-name'  # Add here
],

# 3. Verify WCAG AA compliance
node tests/manual/colors/verify-contrast.js
# Must show ≥4.5:1 contrast ratio

# 4. Test visual rendering
npx http-server . -p 8080
open http://localhost:8080/tests/manual/colors/test-colors.html

# 5. Update service worker version
# Edit sw.js: v2 → v3

# 6. Commit
git add scripts/colors.js sw.js
git commit -m "feat: add [subject] to [category] color coding"
```

### Task 3: Change Feature Flag

**Scenario**: Temporarily disable a feature

```bash
# Quick test (browser console - temporary):
FEATURE_FLAGS.feat_modern_ui = false;
location.reload();

# Permanent change:
# 1. Edit index.html line ~1534
feat_modern_ui: false,  # Was: true

# 2. Update service worker version (sw.js)

# 3. Test impact
npx http-server . -p 8080
# Verify UI changes as expected

# 4. Commit
git add index.html sw.js
git commit -m "config: disable modern UI components"

# Rollback: Set flag back to true
```

### Task 4: Add New Teacher

**Scenario**: Add teacher "Sharma" teaching Class 10 Math

```bash
# 1. Update timetable data in index.html
# Find Class 10 rows, add periods with "Maths (Sharma)"

# Example:
Class 10,Maths (Sharma),Science (Kumar),...

# 2. No code changes needed!
# Teacher view auto-populates from timetable data

# 3. Update service worker version

# 4. Test teacher view
# Navigate to Teacher View → Select "Sharma"
# Verify schedule appears correctly

# 5. Commit
git add index.html sw.js
git commit -m "feat: add teacher Sharma for Class 10 Math"
```

### Task 5: Run Build Report

**Before committing significant changes**:

```bash
node build-report.js

# Output shows:
# - File sizes (raw and gzipped)
# - Total bundle size
# - Budget compliance (target: 500KB)
# - Optimization recommendations

# Check status:
# ✅ PASS if under 500KB
# ❌ FAIL if over 500KB (requires optimization)

# Report saved to: docs/reports/build-report.json
```

### Task 6: Test Accessibility

```bash
# 1. Automated contrast check
node tests/manual/colors/verify-contrast.js
# Expect: All categories ✓ PASS (≥4.5:1)

# 2. Subject mapping tests
node tests/manual/test-mapping.js

# 3. Browser-based tests
npx http-server . -p 8080
open http://localhost:8080/tests/manual/accessibility/test-a11y.html

# 4. Manual keyboard navigation
# - Press ? for shortcuts menu
# - Tab through all elements
# - Press k for high contrast
# - Press m for dark mode
# - Press Esc to close modals

# 5. Run Lighthouse audit
# DevTools → Lighthouse → Run audit
# Target: ≥90 for all categories
```

---

## 🚨 Critical Areas (High Risk)

### 1. Timetable Data Parsing
**Location**: `index.html:~1681-1850`

**Risk**: Format errors break entire application

**Validation checklist**:
- [ ] Each row has exactly 8 periods (+ class name = 9 columns)
- [ ] Format is `Subject (Teacher)` with parentheses
- [ ] No missing commas between periods
- [ ] Day headers match: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
- [ ] Class names match existing format (e.g., "Class 12 Science")

### 2. Service Worker Cache Version
**Location**: `sw.js:4-5`

**Risk**: Users won't see updates if version not incremented

**Always increment when**:
- Modifying `index.html`
- Changing any JS module in `scripts/`
- Updating any CSS in `styles/`
- Adding/removing cached assets

### 3. Subject Color Mapping Edge Cases
**Location**: `scripts/colors.js:95-150`

**Special cases to preserve**:
- "Political Science" must be checked before partial matches
- "Home Work" and "Self Study" → no color (default)
- Case-insensitive matching via `.toLowerCase()`

### 4. Feature Flag Disabling
**Location**: `index.html:1531`

**Risk**: Disabling flags removes features for ALL users

**Safe testing**: Use browser console for temporary changes, not source code

### 5. Accessibility Regressions
**Test before commit**:
```bash
node tests/manual/colors/verify-contrast.js  # Must pass
# Manual keyboard navigation test
# Screen reader test (if available)
```

### 6. Export Functionality
**Dependencies**: html2canvas, jsPDF (lazy loaded from CDN)

**Risk**: Network required on first use after cache clear

**Elements with `.no-capture` class** are hidden in exports

---

## 📊 Data Models

### Parsed Timetable Object
```javascript
{
  timetable: {
    "Monday": {
      "Class 12 Science": [
        { subject: "Chemistry", teacher: "Toshit", time: "8:30 AM - 9:10 AM" },
        { subject: "Physics", teacher: "Phy", time: "9:10 AM - 9:50 AM" },
        // ... 8 periods total
      ],
      // ... all classes
    },
    // ... Tuesday through Saturday
  },
  teacherDetails: {
    "Toshit": {
      "Monday": [
        { period: 1, class: "Class 12 Science", subject: "Chemistry" },
        // ... all periods for this teacher
      ],
      // ... all days
    },
    // ... all teachers
  }
}
```

### Class Structure
```
Primary: Class 1, 2, 3, 4, 5
Middle: Class 6, 7, 8
Secondary: Class 9, 10
Senior Secondary:
  - Class 11 Science
  - Class 11 Commerce
  - Class 11 Arts
  - Class 12 Science
  - Class 12 Commerce
  - Class 12 Arts
```

### Period Timings (8 periods/day)
```
Period 1: 8:30 AM - 9:10 AM
Period 2: 9:10 AM - 9:50 AM
Period 3: 9:50 AM - 10:30 AM
Period 4: 10:30 AM - 11:10 AM
BREAK:    11:10 AM - 11:30 AM (20 min)
Period 5: 11:30 AM - 12:10 PM
Period 6: 12:10 PM - 12:50 PM
Period 7: 12:50 PM - 01:30 PM
Period 8: 01:30 PM - 02:10 PM
```

---

## 🛠️ Development Workflow

### Local Development

```bash
# 1. Serve locally (disable caching)
npx http-server . -p 8080 -c-1

# 2. Make changes to files

# 3. Test manually in browser
open http://localhost:8080

# 4. Run validation tests
node tests/manual/colors/verify-contrast.js
node tests/manual/test-mapping.js
node build-report.js

# 5. Update service worker version (if needed)

# 6. Commit and push
git add .
git commit -m "type: description"
git push -u origin claude/[feature]-[ID]
```

### Git Workflow Pattern

Based on recent commits:

```bash
# Branch naming convention
claude/[feature-description]-[unique-ID]

# Example recent branches:
# - claude/create-agents-documentation-011CV3k9VUfkUud4zALjxAXe
# - claude/fix-wed-class12-commerce-timetable-011CV3adEHjiyfbEUxURsKEK
# - claude/fix-class12-language-alignment-011CV3Yjzy1KA7ASPEVd6SMF

# Commit message prefixes:
# - fix: Bug fixes
# - feat: New features
# - style: CSS/UI changes
# - config: Configuration changes
# - docs: Documentation updates
# - test: Test updates
```

### Deployment

**This is a static site** - no server-side code:

```bash
# Deploy to any static host:
# - GitHub Pages
# - Netlify
# - Vercel
# - AWS S3 + CloudFront
# - Firebase Hosting

# Requirements:
# ✅ HTTPS (required for Service Worker in production)
# ✅ Proper MIME types (especially .webmanifest)
# ✅ Gzip compression (recommended)

# No build step required - deploy source files directly
```

---

## 🧩 Technical Stack

### Core Technologies
- **Language**: Vanilla JavaScript (ES6+) - No frameworks
- **Styling**: CSS3 with Custom Properties (CSS Variables)
- **Markup**: Semantic HTML5

### External Libraries (CDN, lazy-loaded)
```javascript
// Loaded on-demand for export features:
- html2canvas@1.4.1  (~440KB) - Screenshot generation
- jsPDF@2.5.1        (~460KB) - PDF export

// Cached by Service Worker:
- Lucide Icons      (~50KB)  - Icon library
- Google Fonts      (~20KB)  - Inter font family
```

### Browser APIs Used
- Service Worker API - Offline support
- Cache API - Asset caching
- localStorage - Preferences, feature flags
- sessionStorage - Performance caching with TTL
- IntersectionObserver - Lazy loading
- MutationObserver - Dynamic color coding
- matchMedia - Dark mode detection
- Notification API - Future push notifications
- Share API - Native sharing

### No Build Tools
- ❌ No package.json
- ❌ No npm dependencies
- ❌ No webpack/rollup/vite
- ✅ Direct source deployment

---

## 🎨 Code Patterns & Conventions

### Naming Conventions

**JavaScript**:
- Functions: `camelCase` (renderDashboard, parseTimetableData)
- Classes: `PascalCase` (ModernFAB, VirtualScroller)
- Constants: `UPPER_SNAKE_CASE` (FEATURE_FLAGS, SUBJECT_CATEGORIES)

**CSS**:
- BEM-like: `.modern-fab-container`, `.keyboard-shortcuts-modal`
- Utilities: `.sr-only`, `.no-capture`, `.block`
- State: `.high-contrast`, `.dark`
- Custom properties: `--primary-500`, `--bg-gradient-start`

**Files**:
- Kebab-case: `build-report.js`, `test-colors.html`
- Descriptive: `FINAL_QA_REPORT.md`, `verify-contrast.js`

### JavaScript Style

```javascript
// ES6+ features used extensively:
- const/let (no var)
- Arrow functions
- Template literals
- Destructuring
- Classes
- Async/await
- Spread operator
- Default parameters

// JSDoc-style comments for functions:
/**
 * Description
 * @param {string} param - Description
 * @returns {boolean}
 */
```

### Progressive Enhancement Pattern

Core functionality works without:
- ✅ JavaScript (basic HTML table)
- ✅ CSS (semantic markup readable)
- ✅ Service Worker (app still loads)
- ✅ External libraries (core features intact)

---

## 🔍 Keyboard Shortcuts

**Location**: `scripts/a11y.js`

```
?   → Toggle shortcuts menu
h   → Go to home/dashboard
d   → Toggle day view
c   → Toggle class view
t   → Toggle teacher view
n   → Navigate to current period
m   → Toggle dark mode
k   → Toggle high contrast
/   → Focus search
Esc → Close modals
```

**Note**: Shortcuts don't work when focus is in `<input>`, `<textarea>`, or `<select>` (intentional)

---

## 📈 Performance Budgets

### Current Bundle Size
- **Raw**: 309.34 KB
- **Gzipped**: 69.32 KB
- **Budget**: 500 KB raw
- **Status**: ✅ 38% under budget (190.66 KB remaining)

### Virtual Scrolling
- **Activates**: Tables with 100+ rows
- **Row height**: 50px default
- **Buffer**: 10 rows above/below viewport

### Caching Strategy
- **Cache-first**: Static assets (HTML, CSS, JS)
- **Network-first**: Dynamic data (future API)
- **TTL**: 10 minutes for sessionStorage cache

---

## ♿ Accessibility Standards

### WCAG 2.1 Level AA Compliance

**Checklist**:
- ✅ Contrast ratios ≥4.5:1 for all text
- ✅ Keyboard navigation for all features
- ✅ Screen reader support with ARIA
- ✅ Focus indicators visible
- ✅ No keyboard traps
- ✅ Semantic HTML structure
- ✅ Alternative text for images
- ✅ ARIA live regions for dynamic updates

**Lighthouse Targets**: ≥90 for all categories

---

## 📚 Documentation Resources

### Essential Docs to Read First
1. `docs/README.md` - Documentation index
2. `docs/guides/FEATURE_FLAGS.md` - Feature flag management
3. `docs/guides/QA_CHECKLIST.md` - Release validation
4. `docs/reports/FINAL_QA_REPORT.md` - QA summary

### Feature-Specific Guides
- **Accessibility**: `docs/guides/ACCESSIBILITY_SUMMARY.md`
- **Color Coding**: `docs/guides/COLOR_CODING_SUMMARY.md`
- **Modern UI**: `docs/guides/MODERN_UI_GUIDE.md`
- **Performance**: `docs/guides/PERFORMANCE.md`
- **Service Worker**: `docs/guides/SERVICE_WORKER_TESTING.md`

---

## 🔧 Troubleshooting

### Service Worker Not Updating
```bash
# 1. Increment version in sw.js
const CACHE_NAME = 'vpps-timetable-v3';  # Was v2

# 2. Hard refresh in browser
# Chrome/Firefox: Ctrl+Shift+R (Cmd+Shift+R on Mac)

# 3. Check DevTools
# Application → Service Workers → Check if new version activated

# 4. Manual unregister (last resort)
# Application → Service Workers → Unregister
```

### Timetable Not Displaying
```bash
# 1. Check browser console for parsing errors
# 2. Validate CSV format in index.html:~1681
# 3. Verify each row has exactly 8 periods
# 4. Check for missing commas or parentheses
# 5. Ensure format is: Subject (Teacher)
```

### Color Coding Not Working
```bash
# 1. Verify feature flag enabled
FEATURE_FLAGS.feat_color_coding === true

# 2. Check subject exists in scripts/colors.js
# Add to appropriate category if missing

# 3. Clear cache and reload
# Increment service worker version
```

### Export (PDF/PNG) Failing
```bash
# 1. Check network connection (libraries loaded from CDN)
# 2. Open console - look for html2canvas/jsPDF errors
# 3. Try different browser
# 4. Check if elements have .no-capture class (intentionally hidden)
```

---

## ⚡ Quick Reference Commands

```bash
# Local development server
npx http-server . -p 8080 -c-1

# Run contrast validation
node tests/manual/colors/verify-contrast.js

# Run subject mapping tests
node tests/manual/test-mapping.js

# Generate build report
node build-report.js

# Create feature branch
git checkout -b claude/[feature]-[ID]

# Commit and push
git add .
git commit -m "type: description"
git push -u origin claude/[feature]-[ID]

# Run Python server (alternative)
python3 -m http.server 8080
```

---

## 🎓 Learning Path for New Agents

### Phase 1: Understanding (15 min)
1. Read this file (agents.md)
2. Review `docs/README.md`
3. Browse `index.html` structure (note CSV data location)
4. Check `docs/guides/FEATURE_FLAGS.md`

### Phase 2: Exploration (30 min)
1. Serve locally: `npx http-server . -p 8080`
2. Navigate through all views (Dashboard, Day, Class, Teacher)
3. Test keyboard shortcuts (press `?`)
4. Toggle dark mode (`m`), high contrast (`k`)
5. Open DevTools → Application → Service Workers
6. Test offline mode (Network tab → Offline)

### Phase 3: Code Review (45 min)
1. Read `scripts/colors.js` - Subject categorization logic
2. Read `scripts/a11y.js` - Accessibility implementation
3. Read `scripts/perf.js` - Performance optimizations
4. Read `scripts/ui.js` - UI components
5. Review `sw.js` - Service Worker caching strategy

### Phase 4: Testing (30 min)
1. Run `node build-report.js`
2. Run `node tests/manual/colors/verify-contrast.js`
3. Open `tests/manual/accessibility/test-a11y.html`
4. Test keyboard navigation thoroughly
5. Run Lighthouse audit

### Phase 5: Making Changes (Practice)
1. Make a small timetable change (one period)
2. Update service worker version
3. Test locally
4. Commit with proper message format
5. Review git diff before pushing

---

## 📞 Support & Resources

### Documentation
- **Main docs**: `/home/user/timetable2025/docs/`
- **Feature guides**: `/home/user/timetable2025/docs/guides/`
- **Build reports**: `/home/user/timetable2025/docs/reports/`

### Testing
- **Manual tests**: `/home/user/timetable2025/tests/manual/`
- **Node scripts**: `verify-contrast.js`, `test-mapping.js`, `build-report.js`
- **Browser tests**: `test-a11y.html`, `test-colors.html`, `perf-test.html`

### Recent Development Focus
- Class 12 timetable corrections (language period alignment)
- Icon management improvements
- Documentation enhancements
- Feature stability refinements

---

## 🎯 Agent Best Practices

### DO:
- ✅ Always read this file before making changes
- ✅ Increment service worker version after asset changes
- ✅ Test accessibility after UI changes
- ✅ Run build-report.js before committing
- ✅ Validate CSV format for timetable changes
- ✅ Use feature flags for new features
- ✅ Maintain WCAG AA compliance
- ✅ Test offline functionality
- ✅ Follow commit message conventions
- ✅ Document significant changes in docs/

### DON'T:
- ❌ Change service worker cache without incrementing version
- ❌ Disable feature flags without thorough testing
- ❌ Break CSV format in timetable data
- ❌ Reduce color contrast below 4.5:1
- ❌ Add keyboard shortcuts that conflict with existing
- ❌ Skip accessibility testing
- ❌ Exceed 500KB bundle size budget
- ❌ Remove progressive enhancement
- ❌ Add npm dependencies (this is vanilla JS)
- ❌ Push directly to main (use feature branches)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Repository**: timetable2025
**Current Branch**: claude/create-agents-documentation-011CV3k9VUfkUud4zALjxAXe
**Bundle Size**: 69.32 KB gzipped (38% under budget)
**Accessibility**: WCAG 2.1 Level AA Compliant
**PWA Status**: Fully functional offline-first application

---

*For detailed information on specific topics, refer to the comprehensive documentation in `/home/user/timetable2025/docs/`*
