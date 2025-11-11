# Asset Management Guide

This project keeps web-facing files inside the [`public/`](../../public) folder. Use this guide when updating icons or other static assets so the build remains consistent.

## Application Icons

Place the exported PNG icons for the timetable in [`public/assets/icons/`](../../public/assets/icons/).

| File name      | Size      | Usage                                           |
| -------------- | --------- | ----------------------------------------------- |
| `icon-32.png`  | 32×32 px  | Favicon shown in the browser tab                |
| `icon-180.png` | 180×180 px| Apple Touch icon for iOS home screen shortcuts  |
| `icon-192.png` | 192×192 px| Android/Chrome install icon                     |
| `icon-512.png` | 512×512 px| High-resolution install icon and notifications  |

**Tips**

- Export icons with a transparent background when possible to avoid halo artifacts.
- Keep strong contrast so the icon remains legible in both light and dark modes.
- If you only have a single source image, use an icon generator (Favicon.io, ImageMagick, etc.) to create the remaining sizes.

## Referencing Icons

- [`public/index.html`](../../public/index.html) links to the favicon and Apple Touch icon using `./assets/icons/icon-512.png`.
- [`public/manifest.webmanifest`](../../public/manifest.webmanifest) references the same filenames for the Progressive Web App.
- [`public/sw.js`](../../public/sw.js) serves the icons for offline caching and notifications.

After updating any icon assets, refresh your local server to ensure the service worker caches the new files.
