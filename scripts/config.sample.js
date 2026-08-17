/*
 * VPPS Mobile Timetable - backend configuration template.
 *
 * Copy this file to scripts/config.local.js and fill in the connection
 * strings. config.local.js is gitignored on purpose: this repository is
 * public, and a Postgres URL committed to a public repo is picked up by
 * GitHub secret scanning, which asks Neon to reset the password - the app
 * then breaks with no warning.
 *
 * Without this file the app still works completely. It simply keeps every
 * substitution plan in localStorage on the one device instead of sharing
 * it through the database.
 *
 * THE ENVIRONMENT IS CHOSEN BY HOSTNAME. The live site writes to the real
 * database; the staging site and localhost write to a separate one. That
 * is not a nicety - without it, trying something out on your laptop puts
 * a fictional absence into the plan the whole staff sees.
 *
 * See docs/guides/BACKEND_SYNC.md.
 */
window.VPPS_CONFIG = (function buildConfig() {
	'use strict';

	// Neon's SQL-over-HTTP endpoint: the connection host with /sql appended.
	// Both databases live on the same endpoint, so this is shared.
	const SQL_URL = 'https://YOUR-ENDPOINT.REGION.aws.neon.tech/sql';

	const LIVE = 'postgresql://USER:PASSWORD@YOUR-ENDPOINT.REGION.aws.neon.tech/neondb?sslmode=require';
	const TEST = 'postgresql://USER:PASSWORD@YOUR-ENDPOINT.REGION.aws.neon.tech/neondb_test?sslmode=require';

	const host = (typeof location !== 'undefined' && location.hostname) || '';
	const isLive = host.indexOf('-test') === -1 &&
		host !== 'localhost' &&
		host !== '127.0.0.1';

	return {
		neonSqlUrl: SQL_URL,
		neonConnectionString: isLive ? LIVE : TEST,
		// Named so the running app can say which database it is talking to.
		environment: isLive ? 'live' : 'test',
		// Days of substitution history to keep. Older plans are deleted on sync.
		retentionDays: 30
	};
})();
