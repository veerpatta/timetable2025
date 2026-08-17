/*
 * VPPS Mobile Timetable - backend configuration template.
 *
 * Copy this file to scripts/config.local.js and fill in the connection
 * string. config.local.js is gitignored on purpose: this repository is
 * public, and a Postgres URL committed to a public repo is picked up by
 * GitHub secret scanning, which asks Neon to reset the password - the app
 * then breaks with no warning.
 *
 * Without this file the app still works completely. It simply keeps every
 * substitution plan in localStorage on the one device instead of sharing
 * it through the database.
 *
 * See docs/guides/BACKEND_SYNC.md.
 */
window.VPPS_CONFIG = {
	// Neon's SQL-over-HTTP endpoint: the connection host with /sql appended.
	neonSqlUrl: 'https://YOUR-ENDPOINT.REGION.aws.neon.tech/sql',

	// The full Postgres connection string for that endpoint.
	neonConnectionString: 'postgresql://USER:PASSWORD@YOUR-ENDPOINT.REGION.aws.neon.tech/neondb?sslmode=require',

	// Days of substitution history to keep. Older plans are deleted on sync.
	retentionDays: 30
};
