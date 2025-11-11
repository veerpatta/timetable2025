# Service Worker Testing Guide
## Veer Patta Public School Timetable Command Center

---

## 📋 Overview

This document provides comprehensive testing procedures for the service worker implementation in the Veer Patta Public School Timetable application.

**Service Worker Version**: v2
**Cache Names**:
- Static: `vpps-static-v2`
- Dynamic: `vpps-timetable-v2`

---

## 🔧 Service Worker Changes (v1 → v2)

### What Changed

#### Cache Version Bump
```javascript
// Old (v1)
const CACHE_NAME = 'vpps-timetable-v1';
const STATIC_CACHE_NAME = 'vpps-static-v1';

// New (v2)
const CACHE_NAME = 'vpps-timetable-v2';
const STATIC_CACHE_NAME = 'vpps-static-v2';
```

#### New Assets Added to Cache
The following assets were added to `STATIC_ASSETS` array:

**JavaScript Modules:**
- `./public/assets/scripts/perf.js` - Performance optimizations (18.28 KB)
- `./public/assets/scripts/a11y.js` - Accessibility features (14.33 KB)
- `./public/assets/scripts/colors.js` - Subject color coding (9.35 KB)
- `./public/assets/scripts/ui.js` - Modern UI components (42.46 KB)

**CSS Stylesheets:**
- `./public/assets/styles/theme.css` - Dark mode theme (8.89 KB)
- `./public/assets/styles/a11y.css` - Accessibility styles (11.96 KB)
- `./public/assets/styles/colors.css` - Color coding styles (7.22 KB)
- `./public/assets/styles/ui.css` - UI component styles (19.70 KB)

**Total New Assets**: 132.19 KB raw / 30.34 KB gzipped

#### Assets Already Cached (v1)
- `./` - Root path
- `./index.html` - Main application
- `./manifest.webmanifest` - PWA manifest
- `./public/assets/icons/icon-512.png` - School logo
- External CDN resources:
  - html2canvas (1.4.1)
  - jsPDF (2.5.1)
  - Lucide icons
  - Google Fonts (Inter)

### Impact
- **Total Cached Assets**: 12 local files + 4 CDN resources = 16 total
- **Cache Size**: ~309 KB raw / ~69 KB gzipped (local files only)
- **Old Caches**: Automatically deleted on service worker activation
- **Offline Capability**: Full offline support for all application features

---

## 🧪 Testing Procedures

### 1. Initial Service Worker Registration

**Objective**: Verify service worker registers correctly on first visit

**Steps**:
1. Open Chrome/Edge browser
2. Open DevTools (F12)
3. Go to Application tab
4. Navigate to http://localhost:8000 (or your local server)
5. Check "Service Workers" section in Application tab

**Expected Results**:
- ✅ Service worker shows as "activated and running"
- ✅ Status shows green circle
- ✅ Source shows `sw.js`
- ✅ Console logs:
  ```
  Service Worker: Script loaded successfully
  Service Worker: Installing...
  Service Worker: Caching static assets
  Service Worker: Static assets cached successfully
  Service Worker: Activating...
  Service Worker: Old caches cleaned up
  ```

**Common Issues**:
- ❌ Service worker fails to register: Check HTTPS or localhost
- ❌ "importScripts" error: Check file paths are correct
- ❌ Fetch errors: Check network connection for CDN resources

---

### 2. Static Cache Creation

**Objective**: Verify all static assets are cached correctly

**Steps**:
1. Open DevTools → Application tab
2. Expand "Cache Storage" section
3. Click on `vpps-static-v2`
4. Review cached files

**Expected Results**:
- ✅ Cache `vpps-static-v2` exists
- ✅ All 12 local assets are cached:
  - `/` or `/index.html`
  - `/manifest.webmanifest`
  - `/assets/icons/icon-512.png`
  - `/assets/scripts/perf.js`
  - `/assets/scripts/a11y.js`
  - `/assets/scripts/colors.js`
  - `/assets/scripts/ui.js`
  - `/assets/styles/theme.css`
  - `/assets/styles/a11y.css`
  - `/assets/styles/colors.css`
  - `/assets/styles/ui.css`
- ✅ All 4 CDN resources are cached:
  - html2canvas from cdnjs.cloudflare.com
  - jsPDF from cdnjs.cloudflare.com
  - Lucide from cdn.jsdelivr.net
  - Google Fonts from fonts.googleapis.com

**Visual Verification**:
```
Cache Storage
└── vpps-static-v2
    ├── http://localhost:8000/
    ├── http://localhost:8000/index.html
    ├── http://localhost:8000/manifest.webmanifest
    ├── http://localhost:8000/assets/icons/icon-512.png
    ├── http://localhost:8000/assets/scripts/perf.js
    ├── http://localhost:8000/assets/scripts/a11y.js
    ├── http://localhost:8000/assets/scripts/colors.js
    ├── http://localhost:8000/assets/scripts/ui.js
    ├── http://localhost:8000/assets/styles/theme.css
    ├── http://localhost:8000/assets/styles/a11y.css
    ├── http://localhost:8000/assets/styles/colors.css
    ├── http://localhost:8000/assets/styles/ui.css
    ├── https://cdnjs.cloudflare.com/.../html2canvas.min.js
    ├── https://cdnjs.cloudflare.com/.../jspdf.umd.min.js
    ├── https://cdn.jsdelivr.net/.../lucide.min.js
    └── https://fonts.googleapis.com/.../Inter...
```

**Common Issues**:
- ❌ Missing assets: Check file paths in STATIC_ASSETS array
- ❌ 404 errors: Verify files exist in project structure
- ❌ CORS errors: CDN resources must allow cross-origin requests

---

### 3. Dynamic Cache Creation

**Objective**: Verify dynamic cache is created for timetable data

**Steps**:
1. Open DevTools → Application tab
2. Expand "Cache Storage" section
3. Look for `vpps-timetable-v2`

**Expected Results**:
- ✅ Cache `vpps-timetable-v2` exists
- ✅ Initially empty (no API calls in current version)
- ✅ Ready for future timetable data caching

**Note**: Current version stores timetable data inline in HTML. This cache is prepared for future API integration.

---

### 4. Old Cache Cleanup

**Objective**: Verify old caches are deleted on activation

**Steps**:
1. If updating from v1, note existing caches
2. Refresh page to trigger service worker update
3. Check Cache Storage after activation

**Expected Results**:
- ✅ `vpps-timetable-v1` is deleted (if existed)
- ✅ `vpps-static-v1` is deleted (if existed)
- ✅ Only `vpps-timetable-v2` and `vpps-static-v2` remain
- ✅ Console logs: "Service Worker: Deleting old cache: [cache-name]"

**Manual Cleanup (if needed)**:
```javascript
// In browser console
caches.keys().then(keys => {
  keys.forEach(key => {
    if (key.includes('-v1')) {
      caches.delete(key);
      console.log('Deleted:', key);
    }
  });
});
```

---

### 5. Cache-First Strategy (Static Assets)

**Objective**: Verify static assets are served from cache

**Steps**:
1. Load page with network enabled
2. Open DevTools → Network tab
3. Reload page (Ctrl+R)
4. Check source of requests

**Expected Results**:
- ✅ Most requests show "(from ServiceWorker)" in Size column
- ✅ Console logs: "Service Worker: Serving from cache: [url]"
- ✅ Fast load times (<100ms for cached resources)
- ✅ No network requests for cached assets

**Verification**:
```
Network Tab:
Name                     Status  Type        Size                Time
index.html               200     document    (from ServiceWorker) 5ms
assets/styles/theme.css  200     stylesheet  (from ServiceWorker) 3ms
assets/scripts/perf.js   200     script      (from ServiceWorker) 4ms
```

---

### 6. Network-First Strategy (Dynamic Data)

**Objective**: Verify network-first works for API requests

**Note**: Current version doesn't make API calls, but strategy is implemented for future use.

**Steps** (for future testing):
1. Make API request to timetable endpoint
2. Check Network tab for request
3. Check console logs

**Expected Results**:
- ✅ Request goes to network first
- ✅ Console logs: "Service Worker: Trying network first for: [url]"
- ✅ If successful: "Service Worker: Cached fresh data: [url]"
- ✅ If failed: "Service Worker: Network failed, trying cache for: [url]"
- ✅ Response is cached in `vpps-timetable-v2`

---

### 7. Offline Functionality

**Objective**: Verify app works completely offline

**Steps**:
1. Load page with network enabled (ensure cache is populated)
2. Open DevTools → Application tab → Service Workers
3. Check "Offline" checkbox
4. Reload page (Ctrl+R)
5. Navigate through all views:
   - Dashboard
   - Day view
   - Class view
   - Teacher view
   - Free teacher finder
   - Substitution view

**Expected Results**:
- ✅ Page loads successfully offline
- ✅ All styles applied correctly
- ✅ All scripts execute correctly
- ✅ All navigation works
- ✅ All UI components work
- ✅ All features function normally
- ✅ Console logs: "Service Worker: Serving from cache: [url]"
- ✅ No 404 or network errors

**User Experience**:
- ✅ No visible difference between online and offline
- ✅ No "No Internet Connection" errors
- ✅ All interactive elements work
- ✅ All data displays correctly

---

### 8. Service Worker Update Process

**Objective**: Verify service worker updates correctly

**Steps**:
1. Note current service worker version in DevTools
2. Edit `sw.js` (e.g., bump cache version to v3)
3. Save file
4. Reload page in browser
5. Check Service Workers section

**Expected Results**:
- ✅ New service worker shows as "waiting to activate"
- ✅ Click "skipWaiting" button (or refresh again)
- ✅ New service worker activates
- ✅ Old caches are deleted
- ✅ New caches are created
- ✅ Console logs show activation sequence

**Update Flow**:
```
1. New SW: Installing... (caching assets)
2. New SW: Waiting to activate... (old SW still active)
3. User closes all tabs OR skipWaiting() called
4. New SW: Activating... (cleanup old caches)
5. New SW: Active and running
```

**Force Update** (for testing):
```javascript
// In sw.js
self.addEventListener('install', event => {
  self.skipWaiting(); // Force immediate activation
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim()); // Take control immediately
});
```

---

### 9. Offline Fallback Page

**Objective**: Verify offline fallback displays when resource not cached

**Steps**:
1. Clear all caches
2. Enable offline mode
3. Try to load a non-cached resource
4. Check response

**Expected Results**:
- ✅ For documents: "You are offline" HTML page shows
- ✅ For other resources: 503 Service Unavailable response
- ✅ App doesn't crash or show broken UI
- ✅ Console logs: "Service Worker: Fetch failed for: [url]"

**Fallback Content**:
```html
<!DOCTYPE html>
<html>
<head><title>Offline</title></head>
<body>
  <h1>You are offline</h1>
  <p>Please check your internet connection.</p>
</body>
</html>
```

---

### 10. Performance Testing

**Objective**: Measure service worker impact on performance

**Steps**:
1. Open DevTools → Lighthouse tab
2. Select "Performance" category
3. Run audit with service worker enabled
4. Note scores
5. Unregister service worker
6. Run audit again
7. Compare scores

**Expected Results**:
- ✅ With SW: Performance score ≥90
- ✅ With SW: Faster load times (cached resources)
- ✅ With SW: Lower bandwidth usage
- ✅ Without SW: Slower load times (network requests)

**Metrics Comparison**:
| Metric | Without SW | With SW | Improvement |
|--------|------------|---------|-------------|
| FCP | ~1.8s | ~0.5s | 72% faster |
| LCP | ~2.5s | ~0.8s | 68% faster |
| TTI | ~3.5s | ~1.2s | 66% faster |
| Load Time | ~4.0s | ~1.0s | 75% faster |

---

### 11. Cache Storage Limits

**Objective**: Verify cache stays within browser limits

**Steps**:
1. Open DevTools → Application → Storage
2. Check "Storage" section
3. Note cache size

**Expected Results**:
- ✅ Total cache size < 50MB (well under typical 500MB+ limits)
- ✅ Current size: ~69KB gzipped for all local assets
- ✅ No quota exceeded errors
- ✅ Cache doesn't grow unbounded

**Check Cache Size**:
```javascript
// In browser console
navigator.storage.estimate().then(estimate => {
  console.log('Usage:', (estimate.usage / 1024 / 1024).toFixed(2), 'MB');
  console.log('Quota:', (estimate.quota / 1024 / 1024).toFixed(2), 'MB');
  console.log('Percent:', (estimate.usage / estimate.quota * 100).toFixed(2), '%');
});
```

**Clear Cache** (if needed):
```javascript
// Clear all caches
caches.keys().then(keys => {
  Promise.all(keys.map(key => caches.delete(key)))
    .then(() => console.log('All caches cleared'));
});
```

---

### 12. Error Handling

**Objective**: Verify graceful error handling

**Test Scenarios**:

**Scenario 1: CDN Resource Unavailable**
- Disable internet during service worker install
- Expected: Install fails, service worker retries on next page load

**Scenario 2: Cache Storage Unavailable**
- Use browser that doesn't support Cache API
- Expected: App still works, just without offline support

**Scenario 3: Corrupt Cache**
- Manually corrupt a cached file
- Expected: Service worker re-fetches from network

**Scenario 4: Service Worker Registration Fails**
- Expected: App works normally without offline support

**General Error Handling**:
- ✅ All errors logged to console
- ✅ No uncaught exceptions
- ✅ Graceful fallback to network
- ✅ User not impacted by errors

---

## 🔍 Debugging Service Worker

### Chrome DevTools

**Service Workers Panel**:
- View registration status
- Force update
- Skip waiting
- Unregister service worker
- Inspect service worker console

**Cache Storage Panel**:
- View all caches
- Inspect cached resources
- Delete individual items
- Clear entire cache

**Network Panel**:
- Filter by "(ServiceWorker)"
- See which requests served from cache
- Monitor offline behavior

**Console Commands**:
```javascript
// Check if service worker is registered
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', !!reg);
  if (reg) console.log('SW state:', reg.active?.state);
});

// Unregister service worker
navigator.serviceWorker.getRegistration().then(reg => {
  reg.unregister().then(() => console.log('SW unregistered'));
});

// List all caches
caches.keys().then(keys => console.log('Caches:', keys));

// Check cache contents
caches.open('vpps-static-v2').then(cache => {
  cache.keys().then(keys => {
    console.log('Cached files:', keys.map(k => k.url));
  });
});

// Clear specific cache
caches.delete('vpps-static-v2').then(() => {
  console.log('Cache deleted');
});
```

### Service Worker Lifecycle

```
[New SW detected]
       ↓
   Installing
       ↓
   Installed
       ↓
   Waiting (if old SW exists)
       ↓
   Activating (old SW stopped)
       ↓
   Activated
       ↓
   Running (intercepting fetches)
```

---

## 🚨 Troubleshooting

### Issue: Service Worker Won't Register

**Symptoms**:
- No service worker in DevTools
- Console error: "Failed to register ServiceWorker"

**Solutions**:
1. Verify using HTTPS or localhost
2. Check file path to `sw.js` is correct
3. Check browser supports service workers
4. Clear browser cache and try again
5. Check for JavaScript syntax errors in `sw.js`

---

### Issue: Assets Not Caching

**Symptoms**:
- Cache Storage is empty
- Offline mode doesn't work
- Console error: "Failed to cache assets"

**Solutions**:
1. Check all file paths in `STATIC_ASSETS` are correct
2. Verify files exist in project structure
3. Check CDN resources are accessible
4. Look for CORS errors in console
5. Verify cache storage is not disabled in browser

---

### Issue: Old Cache Won't Delete

**Symptoms**:
- Both v1 and v2 caches exist
- Old assets being served

**Solutions**:
1. Force refresh (Ctrl+Shift+R)
2. Click "Update" in Service Workers panel
3. Manually delete old cache in DevTools
4. Verify cache cleanup code runs in activate event

---

### Issue: Offline Mode Doesn't Work

**Symptoms**:
- Page shows "No Internet Connection" error
- Resources fail to load offline

**Solutions**:
1. Verify service worker is active
2. Check cache contains all necessary assets
3. Load page online first (to populate cache)
4. Check console for fetch errors
5. Verify cache-first strategy is working

---

### Issue: Service Worker Won't Update

**Symptoms**:
- Old version keeps running
- Changes to `sw.js` don't take effect

**Solutions**:
1. Hard refresh (Ctrl+Shift+R)
2. Click "Skip waiting" in DevTools
3. Close all tabs and reopen
4. Unregister and re-register service worker
5. Clear cache and reload

---

## 📊 Testing Checklist

### Pre-Deployment Testing
- [ ] Service worker registers successfully
- [ ] All static assets cache correctly
- [ ] Dynamic cache is created
- [ ] Old caches are cleaned up
- [ ] Cache-first strategy works
- [ ] Network-first strategy works
- [ ] Offline mode works for all views
- [ ] Service worker updates correctly
- [ ] Offline fallback displays appropriately
- [ ] Performance improves with service worker
- [ ] Cache stays within limits
- [ ] Error handling works gracefully
- [ ] No console errors
- [ ] All debugging tools work

### Cross-Browser Testing
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Edge (desktop)
- [ ] Chrome (Android)
- [ ] Safari (iOS)

### Regression Testing
- [ ] Existing features still work
- [ ] No new console errors
- [ ] Performance not degraded
- [ ] Offline support maintained

---

## 📝 Test Results Template

### Test Date: _______________
### Tester: _______________
### Browser: _______________

| Test | Status | Notes |
|------|--------|-------|
| Registration | ☐ Pass ☐ Fail | |
| Static Cache | ☐ Pass ☐ Fail | |
| Dynamic Cache | ☐ Pass ☐ Fail | |
| Cache Cleanup | ☐ Pass ☐ Fail | |
| Cache-First | ☐ Pass ☐ Fail | |
| Network-First | ☐ Pass ☐ Fail | |
| Offline Mode | ☐ Pass ☐ Fail | |
| SW Update | ☐ Pass ☐ Fail | |
| Offline Fallback | ☐ Pass ☐ Fail | |
| Performance | ☐ Pass ☐ Fail | |
| Cache Limits | ☐ Pass ☐ Fail | |
| Error Handling | ☐ Pass ☐ Fail | |

### Overall Result: ☐ Pass ☐ Fail

---

**Last Updated**: 2025-11-10
**Service Worker Version**: v2
**Cache Version**: vpps-static-v2, vpps-timetable-v2
