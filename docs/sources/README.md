# Source PDFs

This folder stores timetable PDFs that were used as reference material for the current school session.

These files are:

- useful when reconciling timetable content
- not loaded by the running web app
- not part of the service worker precache list

If timetable content changes in the app, the source of truth is still the inline `rawData` block in `index.html`. These PDFs are supporting inputs, not runtime data files.
