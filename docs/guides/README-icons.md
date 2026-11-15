# App Icons for Time Table

Every VPPS app has its own icon: the real school emblem in a white circle, plus
one colour and one sign per app. The timetable's are purple with a clock, so it
is not mistaken for VPPS One (which keeps the plain logo) on a phone or in a tab.

| File | Size | Used for |
| --- | --- | --- |
| `favicon.ico` (project root) | 16, 32, 48 | browser tab |
| `icons/favicon.svg` | vector | browser tab (sharp at any size) |
| `icons/apple-touch-icon.png` | 180x180 | iPhone home screen |
| `icons/app-icon-192.png` | 192x192 | Android install icon |
| `icons/app-icon-512.png` | 512x512 | Android install icon, splash |
| `icons/app-maskable-512.png` | 512x512 | Android adaptive (masked) icon |
| `icons/icon-512.png` | 344x284 | the plain emblem in the app header — not an app icon |

Notes:
- The set was drawn on 15 Nov 2026 from the school logo; regenerate all sizes
  together rather than editing one.
- Changing any of these is a runtime change: bump both cache names in `sw.js`.
