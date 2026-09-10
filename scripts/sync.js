/*
 * VPPS Mobile Timetable - Neon backend sync.
 *
 * Talks to Neon's SQL-over-HTTP endpoint with plain fetch: no driver, no
 * bundler, no server. Two tables are kept there - the standing shift
 * timings, and the substitution plan for each date.
 *
 * This layer is deliberately best-effort. localStorage remains the source
 * of truth so the app works on a phone with no signal; every call here is
 * wrapped so a network failure degrades to "offline" and never blocks a
 * render. Configuration comes from scripts/config.local.js; with no config
 * the app runs exactly as it did before, on one device.
 *
 * Exposes: window.VPPSSync
 */
(function initSync(root, factory) {
	const api = factory();
	if (typeof module === 'object' && module.exports) module.exports = api;
	if (root) root.VPPSSync = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSync() {
	'use strict';

	const DEFAULT_RETENTION_DAYS = 30;

	// 'unconfigured' until a config file appears, then 'idle' -> 'ok' | 'error'.
	let currentStatus = 'unconfigured';
	let lastError = null;
	let schemaPromise = null;

	function config() {
		return (typeof window !== 'undefined' && window.VPPS_CONFIG) || null;
	}

	function isConfigured() {
		const settings = config();
		return Boolean(settings && settings.neonSqlUrl && settings.neonConnectionString &&
			settings.neonSqlUrl.indexOf('YOUR-ENDPOINT') === -1);
	}

	function retentionDays() {
		const settings = config();
		const value = settings && Number(settings.retentionDays);
		return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_RETENTION_DAYS;
	}

	function status() {
		if (!isConfigured()) return 'unconfigured';
		return currentStatus === 'unconfigured' ? 'idle' : currentStatus;
	}

	function lastErrorMessage() {
		return lastError ? String(lastError.message || lastError) : '';
	}

	/** One statement, one round trip. Neon's /sql endpoint is CORS-open. */
	function sql(query, params) {
		const settings = config();
		if (!isConfigured()) return Promise.reject(new Error('sync-not-configured'));

		// No Content-Type header on purpose. Neon's preflight allows only its
		// own Neon-* headers plus Authorization, so setting Content-Type fails
		// CORS in a browser. Omitting it lets fetch default to the safelisted
		// text/plain, which the endpoint parses as JSON anyway.
		return fetch(settings.neonSqlUrl, {
			method: 'POST',
			headers: { 'Neon-Connection-String': settings.neonConnectionString },
			body: JSON.stringify({ query: query, params: params || [] })
		}).then(response => {
			if (!response.ok) {
				return response.text().then(body => {
					throw new Error('neon ' + response.status + ': ' + body.slice(0, 200));
				});
			}
			return response.json();
		}).then(payload => {
			currentStatus = 'ok';
			lastError = null;
			return payload.rows || [];
		}).catch(error => {
			currentStatus = 'error';
			lastError = error;
			throw error;
		});
	}

	/** Runs the statements in order; each is idempotent. */
	function runSequentially(statements) {
		return statements.reduce(
			(chain, statement) => chain.then(() => sql(statement, [])),
			Promise.resolve()
		);
	}

	const SCHEMA = [
		'create table if not exists teacher_shifts (' +
		'  teacher text primary key,' +
		'  allowed_periods smallint[] not null,' +
		'  note text,' +
		'  updated_at timestamptz not null default now()' +
		')',
		'create table if not exists substitution_plans (' +
		'  plan_date date primary key,' +
		'  day_name text not null,' +
		'  schedule_version text not null,' +
		'  absences jsonb not null default \'[]\'::jsonb,' +
		'  assignments jsonb not null default \'[]\'::jsonb,' +
		'  updated_at timestamptz not null default now()' +
		')',
		// Added after the first release; idempotent so existing databases
		// pick it up without a migration step.
		'alter table substitution_plans add column if not exists pins jsonb not null default \'{}\'::jsonb',
		// Which edition of the built-in shift policy these rows were written
		// against. Rows that predate the column are version 1 by definition.
		'alter table teacher_shifts add column if not exists policy_version smallint not null default 1'
	];

	/** Created once per page load, then remembered. */
	function ensureSchema() {
		if (!isConfigured()) return Promise.reject(new Error('sync-not-configured'));
		if (!schemaPromise) {
			schemaPromise = runSequentially(SCHEMA).catch(error => {
				schemaPromise = null;
				throw error;
			});
		}
		return schemaPromise;
	}

	/** Postgres array literal, e.g. [4,5,6,7] -> '{4,5,6,7}'. */
	function toIntArrayLiteral(values) {
		return '{' + (values || []).map(value => Number(value)).filter(Number.isFinite).join(',') + '}';
	}

	function toTextArrayLiteral(values) {
		return '{' + (values || [])
			.map(value => '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"')
			.join(',') + '}';
	}

	function parseIntArray(value) {
		if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
		return String(value || '')
			.replace(/^{|}$/g, '')
			.split(',')
			.map(part => Number(part.trim()))
			.filter(Number.isFinite);
	}

	function parseJson(value, fallback) {
		if (value == null) return fallback;
		if (typeof value === 'object') return value;
		try { return JSON.parse(value); } catch (error) { return fallback; }
	}

	/* ---------------------------------------------------------------- *
	 * Shift timings
	 * ---------------------------------------------------------------- */

	/**
	 * The stored set, plus the policy edition it was written against, so the
	 * caller can tell a deliberate edit from a copy that predates a shipped
	 * change. An empty table reports version 0 - nothing is stored yet.
	 */
	function loadShifts() {
		return ensureSchema()
			.then(() => sql('select teacher, allowed_periods, note, policy_version from teacher_shifts', []))
			.then(rows => {
				const shifts = {};
				// The oldest row wins: one stale entry makes the whole set stale.
				let policyVersion = 0;
				rows.forEach(row => {
					shifts[row.teacher] = {
						allowedPeriodIndexes: parseIntArray(row.allowed_periods),
						note: row.note || ''
					};
					const version = Number(row.policy_version);
					const stamped = Number.isFinite(version) ? version : 1;
					policyVersion = policyVersion ? Math.min(policyVersion, stamped) : stamped;
				});
				return { shifts: shifts, policyVersion: policyVersion };
			});
	}

	/**
	 * The stored set becomes exactly what is passed in - a teacher dropped
	 * from the map is back to a full day.
	 */
	function saveShifts(shifts, policyVersion) {
		const names = Object.keys(shifts || {});
		const version = Number.isFinite(Number(policyVersion)) ? Number(policyVersion) : 1;
		return ensureSchema()
			.then(() => sql('delete from teacher_shifts where teacher <> all($1::text[])',
				[toTextArrayLiteral(names)]))
			.then(() => names.reduce((chain, teacher) => chain.then(() => sql(
				'insert into teacher_shifts (teacher, allowed_periods, note, policy_version, updated_at) ' +
				'values ($1, $2::smallint[], $3, $4, now()) ' +
				'on conflict (teacher) do update set ' +
				'allowed_periods = excluded.allowed_periods, note = excluded.note, ' +
				'policy_version = excluded.policy_version, updated_at = now()',
				[
					teacher,
					toIntArrayLiteral(shifts[teacher].allowedPeriodIndexes),
					shifts[teacher].note || '',
					version
				]
			)), Promise.resolve()))
			.then(() => true);
	}

	/* ---------------------------------------------------------------- *
	 * Substitution plans
	 * ---------------------------------------------------------------- */

	function loadPlan(planDate) {
		return ensureSchema()
			.then(() => sql(
				'select plan_date, day_name, schedule_version, absences, assignments, pins, updated_at ' +
				'from substitution_plans where plan_date = $1',
				[planDate]
			))
			.then(rows => {
				if (!rows.length) return null;
				const row = rows[0];
				return {
					date: String(row.plan_date).slice(0, 10),
					day: row.day_name,
					scheduleVersion: row.schedule_version,
					absent: parseJson(row.absences, []),
					assignments: parseJson(row.assignments, []),
					pins: parseJson(row.pins, {}),
					updatedAt: row.updated_at
				};
			});
	}

	function savePlan(planDate, plan) {
		return ensureSchema()
			.then(() => sql(
				'insert into substitution_plans ' +
				'(plan_date, day_name, schedule_version, absences, assignments, pins, updated_at) ' +
				'values ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, now()) ' +
				'on conflict (plan_date) do update set ' +
				'day_name = excluded.day_name, schedule_version = excluded.schedule_version, ' +
				'absences = excluded.absences, assignments = excluded.assignments, ' +
				'pins = excluded.pins, updated_at = now()',
				[
					planDate,
					plan.day || '',
					plan.scheduleVersion || '',
					JSON.stringify(plan.absent || []),
					JSON.stringify(plan.assignments || []),
					JSON.stringify(plan.pins || {})
				]
			))
			.then(() => true);
	}

	/**
	 * How many periods each teacher has covered recently, for fairness.
	 *
	 * Reads `coverTeacher`, which is always a real name or null. The older
	 * `cover` field is a display string and in a bilingual app it holds
	 * translated words like "Team" for co-taught periods, so it is only
	 * trusted as a fallback on rows that actually named someone.
	 */
	function loadCoverHistory(days, excludeDate) {
		const window = Number.isFinite(Number(days)) ? Math.max(1, Math.floor(days)) : retentionDays();
		return ensureSchema()
			.then(() => sql(
				'select coalesce(a->>\'coverTeacher\', ' +
				'  case when a->>\'status\' in (\'assigned\', \'review\') then a->>\'cover\' end) as teacher, ' +
				'count(*)::int as covers ' +
				'from substitution_plans p, jsonb_array_elements(p.assignments) a ' +
				'where p.plan_date >= current_date - ($1::int * interval \'1 day\') ' +
				// The plan being edited must not feed its own ranking.
				'and ($2::date is null or p.plan_date <> $2::date) ' +
				'group by 1 having coalesce(a->>\'coverTeacher\', ' +
				'  case when a->>\'status\' in (\'assigned\', \'review\') then a->>\'cover\' end) is not null',
				[String(window), excludeDate || null]
			))
			.then(rows => {
				const history = {};
				rows.forEach(row => { history[row.teacher] = Number(row.covers) || 0; });
				return history;
			});
	}

	function removePlan(planDate) {
		return ensureSchema()
			.then(() => sql('delete from substitution_plans where plan_date = $1', [planDate]))
			.then(() => true);
	}

	/**
	 * Plans expire on their own. Run on every sync, so the table cannot grow
	 * without bound and no scheduler is needed.
	 */
	function purgeOld() {
		return ensureSchema()
			.then(() => sql(
				'delete from substitution_plans where plan_date < current_date - ($1::int * interval \'1 day\')',
				[String(retentionDays())]
			))
			.then(() => true);
	}

	return {
		DEFAULT_RETENTION_DAYS,
		isConfigured,
		status,
		lastErrorMessage,
		retentionDays,
		sql,
		ensureSchema,
		loadShifts,
		saveShifts,
		loadPlan,
		savePlan,
		removePlan,
		loadCoverHistory,
		purgeOld,
		toIntArrayLiteral,
		toTextArrayLiteral,
		parseIntArray
	};
});
