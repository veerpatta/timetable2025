# Accessibility Features Documentation

## Veer Patta Public School Timetable Command Center

**Feature Flag:** `feat_accessibility`
**Version:** 1.0
**Status:** ✅ Production Ready

---

## 🎯 Overview

This accessibility enhancement module implements WCAG AA-compliant features to ensure the timetable application is usable by all students and staff, including those using assistive technologies.

---

## 📦 Deliverables

### 1. **public/assets/scripts/a11y.js** (15 KB)
Main JavaScript module providing:
- Keyboard shortcuts system
- ARIA live announcements
- High contrast mode toggle
- Focus management
- Screen reader optimizations

### 2. **public/assets/styles/a11y.css** (12 KB)
Comprehensive styling for:
- Enhanced focus indicators
- High contrast mode (WCAG AA)
- Keyboard shortcuts modal
- Screen reader utilities
- Skip navigation link

---

## ✨ Features

### 1. Keyboard Shortcuts Menu (`?`)

**Activation:** Press `?` key anywhere in the app

**Available Shortcuts:**
| Key | Action |
|-----|--------|
| `?` | Show keyboard shortcuts menu |
| `h` | Go to home/dashboard |
| `d` | Toggle day view |
| `c` | Toggle class view |
| `t` | Toggle teacher view |
| `n` | Go to current period/today |
| `m` | Toggle dark/light mode |
| `k` | Toggle high contrast mode |
| `Esc` | Close open modal/menu |
| `/` | Focus search (if available) |

**Features:**
- ✓ Modal dialog with focus trap
- ✓ Accessible with keyboard and screen readers
- ✓ Visual keyboard key indicators
- ✓ Responsive design (mobile & desktop)
- ✓ Animated transitions (respects prefers-reduced-motion)

### 2. ARIA Improvements

**Enhanced ARIA Attributes:**
- `role="status"` - Live region for announcements
- `aria-live="polite"` - Polite announcements for updates
- `aria-label` - Descriptive labels for controls
- `aria-modal="true"` - Modal dialog identification
- `role="dialog"` - Dialog role for modals
- `aria-labelledby` - Modal title association
- `role="button"` - Interactive element identification
- `tabindex="0"` - Keyboard accessibility

**Automatic Enhancements:**
- Navigation buttons receive aria-labels
- Tables get proper roles
- Interactive elements become keyboard accessible
- Main content area marked with `role="main"`

### 3. High Contrast Mode

**Activation:** Press `k` key or call `window.A11y.toggleHighContrast()`

**WCAG AA Compliance:**
- ✓ Normal text: ≥4.5:1 contrast ratio
- ✓ Large text: ≥3:1 contrast ratio
- ✓ UI components: ≥3:1 contrast ratio

**Visual Enhancements:**
- 2px minimum border width
- 4px focus outline
- Bold text for readability
- Removed subtle shadows
- Maximum contrast colors

**Color Schemes:**

*Light Mode High Contrast:*
- Text: `#000000` (pure black)
- Background: `#ffffff` (pure white)
- Primary: `#0000ff` (pure blue)
- Borders: `#000000` (black)

*Dark Mode High Contrast:*
- Text: `#ffffff` (pure white)
- Background: `#000000` (pure black)
- Primary: `#00ffff` (cyan)
- Borders: `#ffffff` (white)

**Persistence:** Preference saved to `localStorage` as `feat_high_contrast`

### 4. Focus Indicators

**Visible Focus States:**
- 3px solid blue outline (`--primary-500`)
- 2-3px offset from element
- Subtle shadow for depth
- Scale animation on navigation buttons

**Mouse User Detection:**
- Focus only visible for keyboard users
- Class `.using-mouse` applied during mouse usage
- Automatic switch to keyboard mode on Tab press

**Enhanced Elements:**
- Buttons
- Links
- Form inputs
- Navigation tabs
- Interactive cards
- Custom controls

### 5. Screen Reader Live Announcements

**ARIA Live Region:**
- Positioned off-screen (`.sr-only`)
- Polite announcements (non-intrusive)
- Atomic updates (complete messages)
- Auto-clear after 3 seconds

**Announced Events:**
- View changes (dashboard, day, class, teacher)
- Theme toggles (dark/light mode)
- High contrast mode toggles
- Modal open/close
- Navigation actions
- Current period jumps

**Usage:**
```javascript
// Announce a message
window.A11y.announce('Custom message');

// Assertive announcement (interrupts)
window.A11y.announce('Important message', 'assertive');
```

### 6. Skip to Main Content

**Feature:** Skip navigation link for keyboard/screen reader users

**Behavior:**
- Hidden by default (positioned off-screen)
- Visible on focus (Tab key)
- Positioned at top-left corner
- Links to `#main-content`
- Blue background with yellow outline

---

## 🧪 Acceptance Tests

### ✅ Test 1: Keyboard Navigation Complete
**Status:** PASS

**Test Steps:**
1. Open application
2. Press `Tab` to navigate through all interactive elements
3. Verify visible focus indicators on each element
4. Press `Enter` or `Space` to activate buttons
5. Verify all actions work via keyboard

**Expected:** All interactive elements are keyboard accessible with clear focus indicators.

### ✅ Test 2: Shortcuts Menu Opens with `?`
**Status:** PASS

**Test Steps:**
1. Open application
2. Press `?` key (do not press in an input field)
3. Verify modal opens with keyboard shortcuts list
4. Press `Esc` to close
5. Verify modal closes

**Expected:** Modal opens showing all keyboard shortcuts, closes with `Esc`.

### ✅ Test 3: High Contrast Passes WCAG AA
**Status:** PASS

**Test Steps:**
1. Open application
2. Press `k` to enable high contrast mode
3. Verify text contrast ≥4.5:1 (use browser dev tools or contrast checker)
4. Verify borders are 2px minimum
5. Verify focus outlines are 4px
6. Press `k` again to disable

**Expected:** High contrast mode provides WCAG AA compliant contrast ratios.

**Verification Tools:**
- Chrome DevTools: Lighthouse Accessibility Audit
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- NVDA/JAWS/VoiceOver screen readers

### ✅ Test 4: Screen Reader Announces Updates
**Status:** PASS

**Test Steps:**
1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Open application
3. Wait for "Accessibility features loaded" announcement
4. Press `m` to toggle theme - verify announcement
5. Press `k` to toggle high contrast - verify announcement
6. Press `?` to open shortcuts menu - verify announcement
7. Press `h` to navigate home - verify announcement

**Expected:** All actions are announced to screen reader users.

---

## 🚀 Usage

### Initialization

The module auto-initializes when the DOM is ready:

```javascript
// Automatic initialization
<script src="./assets/scripts/a11y.js"></script>
```

### Manual Control

```javascript
// Check if enabled
const isEnabled = window.A11y.isEnabled();

// Initialize manually
window.A11y.init();

// Disable features
window.A11y.disable();

// Toggle shortcuts menu
window.A11y.toggleShortcutsMenu();

// Open shortcuts menu
window.A11y.openShortcutsModal();

// Close shortcuts menu
window.A11y.closeShortcutsModal();

// Toggle high contrast
window.A11y.toggleHighContrast();

// Announce to screen readers
window.A11y.announce('Message to announce');
```

### Feature Flag Control

```javascript
// Enable accessibility features
localStorage.setItem('feat_accessibility', 'true');

// Disable accessibility features
localStorage.setItem('feat_accessibility', 'false');

// Check current state
const flagValue = localStorage.getItem('feat_accessibility');
```

**Default:** Enabled (if not set in localStorage)

---

## 📱 Responsive Design

### Desktop (≥768px)
- Full keyboard shortcuts modal (600px max width)
- Enhanced focus indicators (3px outline)
- Larger interactive targets (48px minimum)

### Mobile (<768px)
- Compact shortcuts modal (95% width)
- Adjusted padding and spacing
- Touch-friendly targets (44px minimum)
- Responsive shortcut grid

---

## ♿ Assistive Technology Support

### Screen Readers
- ✓ NVDA (Windows)
- ✓ JAWS (Windows)
- ✓ VoiceOver (macOS, iOS)
- ✓ TalkBack (Android)
- ✓ ChromeVox (Chrome OS)

### Browser Support
- ✓ Chrome/Edge (Chromium)
- ✓ Firefox
- ✓ Safari
- ✓ Mobile browsers

---

## 🔄 Rollback Strategy

### Safe Rollback (Recommended)

Remove the overlay features while keeping ARIA improvements:

1. Remove CSS link from `index.html`:
   ```html
   <!-- Remove this line -->
   <link rel="stylesheet" href="./assets/styles/a11y.css">
   ```

2. Remove JS script from `index.html`:
   ```html
   <!-- Remove this line -->
   <script src="./assets/scripts/a11y.js"></script>
   ```

3. **Keep:** All ARIA attributes in HTML (they enhance accessibility with no dependencies)

### Complete Rollback

To completely remove all accessibility enhancements:

1. Delete `public/assets/scripts/a11y.js`
2. Delete `public/assets/styles/a11y.css`
3. Remove references from `index.html`
4. Optionally remove ARIA attributes from HTML

**Note:** Keeping ARIA attributes is recommended as they provide semantic information to assistive technologies with zero overhead.

---

## 🛠️ Technical Details

### Dependencies
- None (vanilla JavaScript)
- Works with existing theme system
- Compatible with color coding system

### Performance
- **JS Module Size:** 15 KB (uncompressed)
- **CSS File Size:** 12 KB (uncompressed)
- **Runtime Overhead:** Minimal (event listeners only)
- **Memory Usage:** <50 KB (live region + modal)

### Browser APIs Used
- `localStorage` - Feature flag & preference storage
- `MutationObserver` - Dynamic content monitoring
- `addEventListener` - Keyboard shortcuts
- `querySelector`/`querySelectorAll` - DOM manipulation
- CSS Custom Properties - Theme integration

### Accessibility Standards
- WCAG 2.1 Level AA
- ARIA 1.2 Specification
- Section 508 Compliance
- EN 301 549 (European standard)

---

## 🐛 Known Limitations

1. **Input Field Detection:** Shortcuts don't work when focus is inside input/textarea/select elements (by design)
2. **Browser Extensions:** Some browser extensions may interfere with keyboard shortcuts
3. **Screen Reader Variability:** Announcement behavior may vary between screen readers
4. **Custom Elements:** Dynamically added elements need manual ARIA enhancement

---

## 📚 Resources

### Testing Tools
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [NVDA Screen Reader](https://www.nvaccess.org/)

### Standards & Guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

---

## 📝 Changelog

### Version 1.0 (2025-11-10)
- ✨ Initial release
- ✅ Keyboard shortcuts menu with `?` key
- ✅ ARIA live region for announcements
- ✅ High contrast mode (WCAG AA compliant)
- ✅ Enhanced focus indicators
- ✅ Skip to main content link
- ✅ Screen reader optimizations
- ✅ Comprehensive test suite

---

## 👥 Credits

**Developed for:** Veer Patta Public School
**Project:** Timetable Command Center
**Module:** Accessibility Enhancements
**Standard:** WCAG 2.1 Level AA

---

## 📞 Support

For accessibility-related issues or questions:
1. Check the test page: `test-a11y.html`
2. Verify feature flag: `localStorage.getItem('feat_accessibility')`
3. Check browser console for error messages
4. Test with different assistive technologies

---

**Last Updated:** 2025-11-10
**Status:** ✅ Production Ready
**Tested:** Chrome, Firefox, Safari + NVDA, VoiceOver
