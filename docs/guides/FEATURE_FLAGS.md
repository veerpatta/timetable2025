# Feature Flags

This guide documents the current feature-flag behavior in the live repo. The implementation is split between an inline flag object in `index.html` and module-specific `localStorage` keys.

## Primary App Flags

The top-level app flags live in `index.html` inside:

```javascript
const FEATURE_FLAGS = {
  feat_dark_mode: true,
  feat_color_coding: true,
  feat_modern_ui: true,
  feat_perf_opt: true,
};
```

These are the main runtime switches used by the app shell.

## Module-Specific Behavior

### `feat_dark_mode`

- Read directly from `window.FEATURE_FLAGS` in `index.html`
- Controls the theme toggle and system theme initialization
- Related state is stored in `localStorage.theme`

### `feat_color_coding`

- Declared in `window.FEATURE_FLAGS`
- Also read by `scripts/colors.js` from `localStorage.feat_color_coding`
- If no stored value exists, the color-coding module falls back to `window.FEATURE_FLAGS`
- If neither is set, the module defaults to enabled

Module API:

- `window.SubjectColorCoding.enable()`
- `window.SubjectColorCoding.disable()`

### `feat_modern_ui`

- Declared in `window.FEATURE_FLAGS`
- Also read by `scripts/ui.js`
- `window.ModernUI.enable()` and `window.ModernUI.disable()` persist to `localStorage.feat_modern_ui` and also update `window.FEATURE_FLAGS` when available

### `feat_perf_opt`

- Declared in `window.FEATURE_FLAGS`
- Used in `index.html` to decide whether app code should use the performance helpers
- `scripts/perf.js` separately stores a JSON object under `localStorage.feat_perf_opt` for sub-feature toggles such as virtual scrolling and caching

Important: disabling the inline `feat_perf_opt` flag in `index.html` stops the app from using the optimization helpers, even though the performance module still loads.

### `feat_accessibility`

This flag is not part of the inline `FEATURE_FLAGS` object.

- It is owned by `scripts/a11y.js`
- It is read from `localStorage.feat_accessibility`
- If unset, accessibility defaults to enabled

Public API:

- `window.A11y.init()`
- `window.A11y.disable()`

## Debugging Flags

When a feature appears stuck on or off, inspect both layers:

```javascript
console.log(window.FEATURE_FLAGS);
console.log(localStorage.getItem('feat_color_coding'));
console.log(localStorage.getItem('feat_modern_ui'));
console.log(localStorage.getItem('feat_perf_opt'));
console.log(localStorage.getItem('feat_accessibility'));
```

Common reasons for confusion:

- the inline object was changed but a persisted `localStorage` value overrides module behavior
- the performance module's JSON sub-flags were changed, but the inline `feat_perf_opt` gate still prevents usage
- accessibility was expected to follow the inline flags, but it is actually controlled separately

## Recommended Usage

### Temporary testing in DevTools

Use the browser console for quick experiments:

```javascript
window.FEATURE_FLAGS.feat_modern_ui = false;
location.reload();
```

For module-local toggles:

```javascript
localStorage.setItem('feat_accessibility', 'false');
location.reload();
```

### Permanent repo change

1. Edit the inline object in `index.html` if the flag belongs there.
2. If the change affects runtime assets, bump the service worker cache version in `sw.js`.
3. Verify the related UI path in the browser.

## Validation

After touching flags, verify:

- page initialization still succeeds
- the targeted feature toggles on and off as expected
- no stale `localStorage` value is masking the change
- no console errors appear during startup

Useful commands:

```powershell
rg -n "const FEATURE_FLAGS" index.html
rg -n "feat_accessibility|feat_color_coding|feat_modern_ui|feat_perf_opt" scripts
```
