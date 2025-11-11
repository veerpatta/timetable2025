# Asset Management Guide

This guide covers the management of icons, images, and other static assets for the Veer Patta Public School Timetable application.

## App Icons for PWA

The application requires specific icon sizes for proper Progressive Web App (PWA) functionality across different platforms and devices.

### Required Icon Files

Place PNG icons in the `icons/` directory at the project root with these exact filenames:

| File | Size | Purpose |
|------|------|---------|
| `icon-32.png` | 32×32 | Browser favicon (shown in tab) |
| `icon-180.png` | 180×180 | Apple Touch icon (iOS home screen) |
| `icon-192.png` | 192×192 | Android/Chrome install icon (standard resolution) |
| `icon-512.png` | 512×512 | Android/Chrome install icon (high resolution, splash screens) |

### Icon Design Guidelines

**Best Practices:**
- ✅ Use transparent PNG format when possible
- ✅ Ensure good contrast against white background (icons may appear on white in some contexts)
- ✅ Keep design simple and recognizable at small sizes
- ✅ Test icon visibility at all required sizes
- ✅ Maintain consistent design language across all sizes

**Technical Requirements:**
- Format: PNG (preferred) or JPEG
- Color mode: RGB with alpha channel (for transparency)
- File size: Optimize for web (use tools like TinyPNG or ImageOptim)
- Naming: Exact match required (case-sensitive on some systems)

### Icon Generation Methods

If you only have a single high-resolution logo or image, you can generate all required sizes using these methods:

#### Option 1: Online Icon Generators
- [PWA Builder](https://www.pwabuilder.com/imageGenerator) - Dedicated PWA icon generator
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Comprehensive favicon generator
- [Favicon.io](https://favicon.io/) - Simple, free favicon generator

#### Option 2: ImageMagick (Command Line)
```bash
# Install ImageMagick if not already installed
# macOS: brew install imagemagick
# Ubuntu/Debian: sudo apt-get install imagemagick
# Windows: choco install imagemagick

# Generate all sizes from a source image
convert source-logo.png -resize 32x32 icons/icon-32.png
convert source-logo.png -resize 180x180 icons/icon-180.png
convert source-logo.png -resize 192x192 icons/icon-192.png
convert source-logo.png -resize 512x512 icons/icon-512.png
```

#### Option 3: Node.js Script
```bash
# Install sharp (image processing library)
npm install sharp

# Create a script (generate-icons.js)
# See example below
```

Example `generate-icons.js` script:
```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [32, 180, 192, 512];
const sourceImage = 'source-logo.png';

// Ensure icons directory exists
if (!fs.existsSync('icons')) {
  fs.mkdirSync('icons');
}

// Generate all icon sizes
sizes.forEach(size => {
  sharp(sourceImage)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(`icons/icon-${size}.png`)
    .then(() => console.log(`✓ Generated icon-${size}.png`))
    .catch(err => console.error(`✗ Error generating icon-${size}.png:`, err));
});
```

### PWA Manifest Configuration

The icons are referenced in `manifest.webmanifest`. If you add or modify icons, update the manifest accordingly:

```json
{
  "icons": [
    { "src": "./icons/icon-32.png", "sizes": "32x32", "type": "image/png" },
    { "src": "./icons/icon-180.png", "sizes": "180x180", "type": "image/png" },
    { "src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
  ]
}
```

### Service Worker Cache

After adding or updating icons:

1. **Clear the service worker cache** to ensure new icons are loaded:
   - Open DevTools → Application → Storage → Clear site data
   - Or: DevTools → Application → Service Workers → Unregister

2. **Reload the page** (hard reload: Cmd/Ctrl + Shift + R)

3. **Verify icon caching** in DevTools → Application → Cache Storage

The service worker (`sw.js`) will automatically cache new icons on the next load.

### HTML References

Icons are referenced in `index.html` via these tags:

```html
<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="./icons/icon-32.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="./icons/icon-180.png">

<!-- PWA Manifest (references additional sizes) -->
<link rel="manifest" href="./manifest.webmanifest">
```

Ensure these references match your icon filenames.

## Other Assets

### Scripts Directory (`scripts/`)

JavaScript modules organized by functionality:
- `ui.js` - UI logic and DOM manipulation
- `perf.js` - Performance optimizations
- `a11y.js` - Accessibility features
- `colors.js` - Color coding system

**Guidelines:**
- Keep modules focused on single responsibility
- Use ES6+ module patterns
- Avoid global scope pollution
- Document complex logic with comments

### Styles Directory (`styles/`)

CSS stylesheets organized by concern:
- `theme.css` - Core theme and layout
- `ui.css` - UI component styles
- `a11y.css` - Accessibility-specific styles
- `colors.css` - Color system definitions

**Guidelines:**
- Use CSS custom properties (variables) for theming
- Follow BEM-like naming conventions
- Keep selectors specific but not overly nested
- Maintain separation of concerns

### Asset Loading Strategy

The application uses several strategies for optimal asset loading:

1. **Critical CSS**: Inline in `<head>` or high-priority external sheets
2. **JavaScript Modules**: Loaded with `<script>` tags (not bundled)
3. **Service Worker Precaching**: Static assets cached on install
4. **Lazy Loading**: Heavy libraries loaded on-demand (see `scripts/perf.js`)

### Asset Optimization

Before adding new assets, consider:

- **File Size**: Keep total bundle under 500KB (check with `node build-report.js`)
- **Compression**: Ensure server gzip/brotli compression is enabled
- **Minification**: Minify CSS/JS for production (if needed)
- **Image Optimization**: Use tools like TinyPNG, ImageOptim, or Squoosh

### Testing Asset Changes

After modifying assets:

1. **Clear browser cache** (hard reload)
2. **Clear service worker cache** (DevTools → Application)
3. **Run build report**: `node build-report.js`
4. **Test offline mode**: DevTools → Network → Offline
5. **Verify PWA installation**: Test on mobile device or browser install prompt

## Troubleshooting

### Icons Not Appearing

**Problem**: Icons don't show after deployment

**Solutions**:
1. Verify files exist in `icons/` directory with exact names
2. Check `manifest.webmanifest` paths are correct
3. Clear service worker cache and reload
4. Check browser DevTools Console for 404 errors
5. Verify file permissions (readable by web server)

### Service Worker Not Caching Assets

**Problem**: Assets not available offline

**Solutions**:
1. Check `sw.js` includes assets in precache list
2. Verify service worker is registered (DevTools → Application)
3. Trigger service worker update (close all tabs and reopen)
4. Check for service worker errors in Console

### Large Bundle Size

**Problem**: Build report shows bundle exceeds 500KB

**Solutions**:
1. Run `node build-report.js` to identify large files
2. Optimize images with compression tools
3. Consider code splitting for JavaScript modules
4. Remove unused CSS/JS code
5. Enable gzip/brotli compression on server

## Related Documentation

- [`README-icons.md`](README-icons.md) - Legacy icon documentation (superseded by this guide)
- [`PERFORMANCE.md`](PERFORMANCE.md) - Performance optimization strategies
- [`SERVICE_WORKER_TESTING.md`](SERVICE_WORKER_TESTING.md) - Service worker validation
- [PWA Manifest Specification](https://www.w3.org/TR/appmanifest/) - Official PWA manifest documentation
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) - MDN service worker guide

## Quick Reference

```bash
# Generate icons from source
npm install sharp
node generate-icons.js

# Check asset sizes
node build-report.js

# Test locally with proper MIME types
npx http-server . -p 8080

# Clear service worker cache (DevTools)
# Application → Clear storage → Clear site data
```

---

For questions or issues with asset management, please open a GitHub issue or consult the [main README](../../README.md).
