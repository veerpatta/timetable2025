/*
 * VPPS Mobile Timetable - application controller.
 *
 * Implements the "VPPS Mobile Timetable" Claude Design canvas: five views
 * (Home, Today, Classes, Teachers, Substitutes) rendered into a single
 * 430px shell, bilingual (EN/HI), light/dark, offline-capable.
 *
 * Depends on: scripts/data.js (VPPSData), scripts/i18n.js (I18n),
 * scripts/substitution.js (SubstitutionEngine).
 */
(function () {
	'use strict';

	const Data = window.VPPSData;
	const I18n = window.I18n;
	const Engine = window.SubstitutionEngine;
	const Sync = window.VPPSSync || null;

	const PERIODS = Data.PERIODS;
	const PERIOD_COUNT = PERIODS.length;
	const ZERO_PERIOD = Data.ZERO_PERIOD;
	const SCHEDULE_VERSION = '2026-27-v4';
	// How far back the fairness ledger looks. Matches the retention window,
	// so it never asks for plans that have already been pruned.
	const HISTORY_DAYS = 30;

	const STORE = {
		theme: 'vppsm_theme',
		me: 'vppsm_me',
		role: 'vppsm_role',
		grid: 'vppsm_grid',
		shifts: 'vppsm_shifts',
		selectedClass: 'vppsm_cls',
		selectedTeacher: 'vppsm_tsel'
	};

	const VIEWS = ['home', 'now', 'class', 'teacher', 'subs'];

	const NAV_ICONS = {
		home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
		now: ['M12 6v6l4 2', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z'],
		class: ['M22 10 12 5 2 10l10 5 10-5z', 'M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5'],
		teacher: [
			'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
			'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
			'M22 21v-2a4 4 0 0 0-3-3.87',
			'M16 3.13a4 4 0 0 1 0 7.75'
		],
		subs: ['m17 2 4 4-4 4', 'M3 11v-1a4 4 0 0 1 4-4h14', 'm7 22-4-4 4-4', 'M21 13v1a4 4 0 0 1-4 4H3']
	};

	const NAV_LABELS = {
		home: 'nav.home', now: 'nav.today', class: 'nav.class',
		teacher: 'nav.teacher', subs: 'nav.subs'
	};

	const SUN_PATHS = [
		'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41',
		'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'
	];
	const MOON_PATHS = ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z'];

	const SHARE_ICON = '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="m16 6-4-4-4 4"></path><path d="M12 2v13"></path>';

	const state = {
		db: null,
		view: 'home',
		dark: false,
		role: null,
		me: '',
		picking: false,
		selDay: 'Monday',
		selClass: '',
		selTeacher: '',
		selPeriod: null,
		subsDay: 'Monday',
		absent: [],
		gridNow: false,
		gridClass: false,
		gridTeacher: false,
		gridSubs: false,
		// Standing working windows, keyed by teacher. Not the same thing as
		// today's absences: a shift is every day.
		shifts: {},
		shiftEditor: null,
		planStore: null,
		syncNote: '',
		// slotId -> teacher name, or null for "deliberately left open". A pin
		// is a decision the coordinator has taken; the allocator works around
		// it rather than over it.
		pins: {},
		editSlot: null,
		// teacher -> periods covered in the retention window, for fairness.
		coverHistory: {}
	};

	let toastTimer = null;
	let tickTimer = null;
	let planCache = null;
	let profileCache = null;
	let overlayCache = null;

	/* ------------------------------------------------------------------ *
	 * Small helpers
	 * ------------------------------------------------------------------ */

	function t(key, params) { return I18n.t(key, params); }
	function dayLabel(day, short) { return I18n.dayLabel(day, short); }
	function classLabel(name, short) { return I18n.classLabel(name, short); }

	/**
	 * Every class a period is taught to, not just the first one.
	 *
	 * The senior school sits three sections together for Hindi and English, and
	 * two for Economics. Naming only the head section would send a covering
	 * teacher looking for a class that is not sitting on its own, and would
	 * leave the other sections reading as if nothing had been arranged. The
	 * head keeps the caller's chosen form; the rest are always short, because
	 * the full names three times over do not fit anywhere they are shown.
	 */
	function slotClassLabel(slot, short) {
		if (!slot) return '';
		const also = slot.alsoClassNames || [];
		const head = classLabel(slot.className, short);
		return also.length
			? head + ' + ' + also.map(name => classLabel(name, true)).join(' + ')
			: head;
	}

	function esc(value) {
		return String(value == null ? '' : value)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}

	function save(key, value) {
		try {
			if (value === null) localStorage.removeItem(key);
			else localStorage.setItem(key, value);
		} catch (error) { /* private mode - preferences simply do not persist */ }
	}

	function read(key) {
		try { return localStorage.getItem(key); } catch (error) { return null; }
	}

	function icon(paths, size) {
		const d = Array.isArray(paths) ? paths : [paths];
		return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
			'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
			d.map(p => '<path d="' + p + '"></path>').join('') + '</svg>';
	}

	function nowMinutes() {
		const now = new Date();
		return now.getHours() * 60 + now.getMinutes();
	}

	function formatClock() {
		return new Date().toLocaleTimeString(I18n.locale(), { hour: 'numeric', minute: '2-digit' });
	}

	function shortTime(minutes) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return (hours % 12 || 12) + ':' + String(mins).padStart(2, '0');
	}

	function periodName(index) {
		return t('ui.periodShort') + (index + 1);
	}

	/** The real weekday, or null when today is not a school day (Sunday). */
	function today() {
		const name = new Date().toLocaleDateString('en-US', { weekday: 'long' });
		return state.db.days.includes(name) ? name : null;
	}

	function liveInfo() {
		const now = nowMinutes();
		return {
			now,
			index: PERIODS.findIndex(p => now >= p.s && now < p.e),
			inBreak: now >= Data.BREAK.s && now < Data.BREAK.e,
			inZero: !!ZERO_PERIOD && now >= ZERO_PERIOD.s && now < ZERO_PERIOD.e,
			before: now < PERIODS[0].s,
			after: now >= Data.CLOSE_MIN,
			reporting: now >= Data.REPORTING_MIN && now < PERIODS[0].s,
			nextIndex: PERIODS.findIndex(p => now < p.s)
		};
	}

	/** Break wording follows the active schedule: a short break, or lunch. */
	function breakKey(suffix) {
		const base = Data.BREAK.kind === 'lunch' ? 'status.lunch' : 'status.break';
		return suffix ? base + suffix : base;
	}

	/** What follows the break, phrased for the hero and status strip. */
	function afterBreakText() {
		const next = PERIODS.findIndex(p => p.s >= Data.BREAK.e);
		if (next < 0) return '';
		return t('hero.nextAfterBreak', {
			period: periodName(next),
			time: PERIODS[next].label.split(' - ')[0]
		});
	}

	/** Index of the period running right now, or -1 outside teaching time. */
	function livePeriod() {
		return today() ? liveInfo().index : -1;
	}

	function dayLoad(teacher, day) {
		return state.db.teacherMap[teacher][day].filter(Boolean).length;
	}

	/** Is this teacher in the building for this period? */
	function onShift(teacher, periodIndex) {
		return Engine.isOnShift(state.shifts, teacher, periodIndex, PERIOD_COUNT);
	}

	function shiftOf(teacher) {
		return state.shifts[teacher] || null;
	}

	/**
	 * Who is genuinely available: no class, on shift, and not marked absent.
	 * A teacher whose shift has not started is not "free" - they are not here.
	 */
	function freeAt(day, periodIndex, exclude) {
		const skip = exclude || [];
		return state.db.teacherNames.filter(name =>
			skip.indexOf(name) === -1 &&
			onShift(name, periodIndex) &&
			!state.db.teacherMap[name][day][periodIndex]);
	}

	/** The index of the last period before the break, or -1. */
	function breakAfterIndex() {
		const next = PERIODS.findIndex(period => period.s >= Data.BREAK.e);
		return next > 0 ? next - 1 : -1;
	}

	/**
	 * The real date of the chosen weekday inside the current school week.
	 * Plans are stored per date, not per weekday, so they can expire.
	 */
	function dateForDay(day) {
		const days = state.db.days;
		const target = days.indexOf(day);
		const now = new Date();
		// JS weeks start on Sunday; the school week starts on Monday.
		const todayIndex = days.indexOf(now.toLocaleDateString('en-US', { weekday: 'long' }));
		const anchor = todayIndex === -1 ? 0 : todayIndex;
		const shifted = new Date(now);
		shifted.setDate(shifted.getDate() + (target - anchor));
		return shifted;
	}

	function isoDate(date) {
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const dayOfMonth = String(date.getDate()).padStart(2, '0');
		return date.getFullYear() + '-' + month + '-' + dayOfMonth;
	}

	function longDate(date) {
		return date.toLocaleDateString(I18n.locale(), {
			weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
		});
	}

	/* ------------------------------------------------------------------ *
	 * Shared fragments
	 * ------------------------------------------------------------------ */

	function chipRow(items, wrap) {
		return '<div class="chip-row' + (wrap ? ' chip-row--wrap' : '') + '">' +
			items.map(item =>
				'<button type="button" class="chip' + (item.big ? ' chip--big' : '') + '" ' +
				'aria-pressed="' + (item.active ? 'true' : 'false') + '" ' +
				'data-action="' + item.action + '" data-value="' + esc(item.value) + '">' +
				esc(item.label) + '</button>').join('') +
			'</div>';
	}

	function segmented(options) {
		return '<div class="segmented" role="group">' +
			options.map(option =>
				'<button type="button" class="segmented__button' + (option.active ? ' is-active' : '') + '" ' +
				'aria-pressed="' + (option.active ? 'true' : 'false') + '" ' +
				'data-action="' + option.action + '" data-value="' + esc(option.value) + '">' +
				esc(option.label) + '</button>').join('') +
			'</div>';
	}

	/**
	 * The list/table switch. An admin works from the tables, so for them the
	 * table option leads and is the default; a teacher keeps the phone list.
	 */
	function modeSegmented(action, listLabel, listValue, tableLabel, tableValue, isTable) {
		const listOption = { label: listLabel, value: listValue, action: action, active: !isTable };
		const tableOption = { label: tableLabel, value: tableValue, action: action, active: isTable };
		return segmented(state.role === 'admin' ? [tableOption, listOption] : [listOption, tableOption]);
	}

	function nowBadge(label) {
		return '<span class="badge-now"><span class="badge-now__dot"></span>' + esc(label) + '</span>';
	}

	function shareButton(action, label, primary) {
		return '<button type="button" class="button-share' + (primary ? ' button-share--primary' : '') + '" ' +
			'data-action="' + action + '">' +
			'<svg width="' + (primary ? 16 : 15) + '" height="' + (primary ? 16 : 15) + '" viewBox="0 0 24 24" ' +
			'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
			'aria-hidden="true">' + SHARE_ICON + '</svg>' + esc(label) + '</button>';
	}

	/**
	 * One period row. `cell` may be a timetable cell, a teacher slot shaped as
	 * { subject }, or null/free. `subLead` adds the class or teacher line.
	 */
	function periodCard(cell, periodIndex, isNow, subLead, offShift, swap, isDuty) {
		const period = PERIODS[periodIndex];
		const free = !cell || cell.free;
		const category = free ? 'default' : Data.categoryOf(cell.subject);
		const title = free ? t(offShift ? 'ui.offShift' : 'ui.free') : cell.subject;
		const sub = period.label + (!free && subLead ? ' · ' + subLead : '');
		const classes = ['period-card'];
		if (isNow) classes.push('period-card--now');
		if (free) classes.push('period-card--free');
		if (free && offShift) classes.push('period-card--offshift');
		if (swap) classes.push('period-card--substituted');
		if (isDuty) classes.push('period-card--duty');

		return '<div class="' + classes.join(' ') + '">' +
			'<div class="period-card__bubble cat-' + category + '">' + esc(periodName(periodIndex)) + '</div>' +
			'<div class="period-card__body">' +
			'<div class="period-card__title">' + esc(title) + '</div>' +
			'<div class="period-card__sub">' + esc(sub) + '</div>' +
			(swap && swap.was
				? '<div class="period-card__swap">' + replacedBy(swap.was, swap.now) + '</div>'
				: '') +
			(swap && swap.joined
				? '<div class="period-card__joined">🔗 ' + esc(joinedLabel(swap.joined)) + '</div>'
				: '') +
			'</div>' +
			(isNow ? nowBadge(t('ui.now')) : '') +
			'</div>';
	}

	/**
	 * One timetable cell. `options` carries the extras a plain cell cannot
	 * know: whether this column is the last before the break, whether the
	 * period is live, and a replacement for the second line (the teacher grid
	 * shows the class there instead of the teacher).
	 */
	function gridCell(cell, isLive, overrideSub, options) {
		const settings = options || {};
		const classes = ['grid__cell'];
		if (isLive) classes.push('grid__cell--live');
		if (settings.beforeBreak) classes.push('grid__cell--beforebreak');

		if (!cell || cell.free) {
			classes.push('grid__cell--free');
			return '<td class="' + classes.join(' ') + '">' +
				'<div class="grid__subject grid__subject--free">' +
				esc(t(settings.offShift ? 'ui.offShift' : 'ui.freeShort')) + '</div>' +
				'</td>';
		}

		const category = Data.categoryOf(cell.subject);
		const teachers = cell.teachers || [];
		// Co-taught blocks list five names. Show them all - the wide layout has
		// the room, and "+4" with no way to see the rest helps nobody.
		const full = overrideSub != null ? overrideSub : teachers.join(' / ');
		const short = overrideSub != null
			? overrideSub
			: (teachers.length > 1 ? teachers[0] + ' +' + (teachers.length - 1) : (teachers[0] || ''));

		classes.push('cell-' + category);
		if (settings.sub) classes.push('grid__cell--substituted');
		if (settings.cover) classes.push('grid__cell--duty');

		let teacherLine = full
			? '<span class="grid__teacher-short">' + esc(short) + '</span>' +
				'<span class="grid__teacher-full">' + esc(full) + '</span>'
			: '';
		let title = full;

		if (settings.sub && settings.sub.joined && !settings.sub.was) {
			// The host of a merge: its own teacher, plus who arrived.
			classes.push('grid__cell--host');
			teacherLine = (full ? esc(short) : '') +
				'<span class="grid__joined">' + esc(joinedLabel(settings.sub.joined)) + '</span>';
			title = full + ' · ' + joinedLabel(settings.sub.joined);
		} else if (settings.sub) {
			teacherLine = replacedBy(settings.sub.was, settings.sub.now) +
				(settings.sub.joined
					? '<span class="grid__joined">' + esc(joinedLabel(settings.sub.joined)) + '</span>'
					: '');
			title = settings.sub.was + ' → ' + settings.sub.now;
		} else if (settings.cover) {
			// A free period that has become cover duty.
			teacherLine = '<span class="grid__duty">' + esc(full) + '</span>';
			title = t('ui.coveringFor', { teacher: settings.cover.coveringFor });
		}

		return '<td class="' + classes.join(' ') + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>' +
			(isLive ? '<span class="grid__live-dot" aria-hidden="true"></span>' : '') +
			'<div class="grid__subject text-' + category + '">' +
			esc(Data.shortSubject(cell.subject)) + '</div>' +
			(teacherLine ? '<div class="grid__teacher">' + teacherLine + '</div>' : '') +
			'</td>';
	}

	/** Column header for a period: number, clock time, break marker. */
	function gridPeriodHead(index, isLive) {
		const slot = PERIODS[index];
		const isBeforeBreak = index === breakAfterIndex();
		const classes = ['grid__head'];
		if (isLive) classes.push('grid__head--live');
		if (isBeforeBreak) classes.push('grid__head--beforebreak');
		return '<th scope="col" class="' + classes.join(' ') + '">' +
			esc(periodName(index)) +
			'<div class="grid__head-time">' + esc(shortTime(slot.s)) + '</div>' +
			(isBeforeBreak
				? '<span class="grid__head-break">' + esc(t('ui.break') + ' ' + Data.BREAK.label) + '</span>'
				: '') +
			'</th>';
	}

	/** Row header for a period, used by the two week grids. */
	function gridPeriodRowLabel(index) {
		const slot = PERIODS[index];
		return '<th scope="row" class="grid__rowlabel">' +
			esc(periodName(index)) +
			'<div class="grid__rowlabel-time">' + esc(shortTime(slot.s)) + '</div></th>';
	}

	/** The scroll container every grid shares, with its accessibility wiring. */
	function gridWrap(caption, head, body) {
		return '<div class="grid-wrap" tabindex="0" role="region" aria-label="' + esc(t('a11y.grid')) + '">' +
			'<table class="grid">' +
			'<caption class="visually-hidden">' + esc(caption) + '</caption>' +
			'<thead><tr>' + head + '</tr></thead>' +
			'<tbody>' + body + '</tbody>' +
			'</table></div>';
	}

	function dayChips(selected, action) {
		return chipRow(state.db.days.map(day => ({
			label: dayLabel(day, true), value: day, action: action, active: selected === day
		})));
	}

	function isPinned(slotId) {
		return Object.prototype.hasOwnProperty.call(state.pins, slotId);
	}

	/** The class a pin says to merge into, or '' for the other pin kinds. */
	function pinnedCombine(slotId) {
		const pin = state.pins[slotId];
		return pin && typeof pin === 'object' && pin.combineWith ? pin.combineWith : '';
	}

	/**
	 * Every class still being taught in this period, so a stranded class has
	 * somewhere to go. `cover` is the plan built so far, so a class whose own
	 * teacher is away counts as hosted only once somebody is covering it - and
	 * a class that is itself self study can never host.
	 */
	function hostsInPeriod(day, periodIndex, cover, absent) {
		const db = state.db;
		return db.classNames.map(className => {
			const cell = db.timetable[day][className][periodIndex];
			if (!cell || cell.free || !cell.teachers.length) return null;

			const away = cell.teachers.filter(name => absent.indexOf(name) !== -1);
			const present = cell.teachers.filter(name => absent.indexOf(name) === -1);
			if (present.length) return { className: className, teacher: present[0], substituted: false };

			// Everyone who teaches it is away: only a covered period can host.
			const slotId = away.length ? away[0] + '|' + periodIndex : '';
			const result = slotId ? cover[slotId] : null;
			if (!result) return null;
			if (result.status !== 'assigned' && result.status !== 'review') return null;
			return { className: className, teacher: result.name, substituted: true };
		}).filter(Boolean);
	}

	/*
	 * A substitution is not private to the planner: it changes who stands in
	 * front of a class, so it has to show wherever that period is displayed.
	 * These two indexes are what let the class, teacher and board views draw
	 * the replaced name struck through with its cover.
	 *
	 * Both are keyed for the planned day only. A plan is made for one date;
	 * showing it against every Monday of the year would be a lie.
	 */
	function substitutionOverlay() {
		const key = planCacheKey();
		if (overlayCache && overlayCache.key === key) return overlayCache.value;

		const byClass = {};   // className|periodIndex -> { was, now, status }
		const byTeacher = {}; // teacher|periodIndex   -> { className, subject, coveringFor }

		if (state.absent.length) {
			const plan = planFor();

			// A merge changes two classes: the one that moves, and the one
			// that receives thirty extra children. The host teacher finding
			// out when they arrive at the door is not acceptable.
			Object.keys(plan.joinedByClass || {}).forEach(key => {
				byClass[key] = { joined: plan.joinedByClass[key] };
			});

			plan.groups.forEach(group => group.rows.forEach(row => {
				// A combined period is one room, so one arrangement - but it
				// belongs on all of its sections' timetables. A pupil in
				// 11 Arts is sitting in front of the cover teacher just as
				// much as one in 11 Science.
				[row.className].concat(row.alsoClassNames || []).forEach(className => {
					byClass[className + '|' + row.periodIndex] = Object.assign(
						byClass[className + '|' + row.periodIndex] || {},
						{
							was: group.title,
							now: row.cover,
							status: row.status,
							pinned: row.pinned
						}
					);
				});
				if (row.coverTeacher) {
					byTeacher[row.coverTeacher + '|' + row.periodIndex] = {
						className: row.className,
						alsoClassNames: row.alsoClassNames || [],
						subject: row.subject,
						coveringFor: group.title,
						status: row.status
					};
				}
			}));
		}

		overlayCache = { key: key, value: { day: state.subsDay, byClass: byClass, byTeacher: byTeacher } };
		return overlayCache.value;
	}

	/** The substitution for one class period, or null when the day is not planned. */
	function subForClass(day, className, periodIndex) {
		const overlay = substitutionOverlay();
		if (day !== overlay.day) return null;
		return overlay.byClass[className + '|' + periodIndex] || null;
	}

	/** The extra duty a teacher has picked up in this period, if any. */
	function subForTeacher(day, teacher, periodIndex) {
		const overlay = substitutionOverlay();
		if (day !== overlay.day) return null;
		return overlay.byTeacher[teacher + '|' + periodIndex] || null;
	}

	/** "+ Class 7" - who has joined this period. */
	function joinedLabel(joined) {
		return '+ ' + (joined || []).map(name => classLabel(name, true)).join(', ');
	}

	/** "Bindu → Kusum", with the replaced name struck through. */
	function replacedBy(was, now) {
		return '<span class="sub-swap">' +
			'<s class="sub-swap__was">' + esc(was) + '</s>' +
			'<span class="sub-swap__now">' + esc(now) + '</span>' +
			'</span>';
	}

	/**
	 * Why this teacher, in one phrase. The tier answers it better than a bare
	 * "Assigned" ever did, and the familiarity count makes it concrete.
	 */
	function reasonFor(item) {
		const key = item.reasonKey || ('sub.' + (item.matchTier || 'general'));
		const base = t(key);
		return item.classPeriods
			? base + ' · ' + t('edit.classPeriods', { n: item.classPeriods })
			: base;
	}

	/**
	 * One period on a teacher's own day, with the substitution plan applied.
	 *
	 * Two things can happen to a teacher's period: a class they teach gets
	 * handed to somebody else, or a free period turns into cover duty. Both
	 * have to be visible here - a teacher who opens the app and sees an empty
	 * P3 will not turn up to cover it.
	 */
	function teacherPeriodCard(teacher, slot, index, day, isNow) {
		const duty = slot ? null : subForTeacher(day, teacher, index);
		if (duty) {
			return periodCard(
				{ subject: duty.subject, teachers: [] },
				index,
				isNow,
				slotClassLabel(duty) + ' · ' + t('ui.coveringFor', { teacher: duty.coveringFor }),
				false,
				null,
				true
			);
		}

		// A host of a merge already has a class this period, so the duty path
		// above never fires for them. Their own period record is what carries
		// the joined class, and they need to see it.
		const record = slot ? subForClass(day, slot.className, index) : null;
		const mine = record && (record.was === teacher || (record.joined && !record.was));
		return periodCard(
			slot ? { subject: slot.subject, teachers: [] } : null,
			index,
			isNow,
			slot ? slotClassLabel(slot) : '',
			!onShift(teacher, index),
			mine ? record : null
		);
	}

	/** Spells out a restricted shift, so nobody wonders why P1 is greyed out. */
	function shiftNote(teacher) {
		const shift = shiftOf(teacher);
		if (!shift || Engine.isFullDayShift(shift, PERIOD_COUNT)) return '';
		const periods = Engine.shiftPeriods(shift, PERIOD_COUNT).map(periodName).join(', ');
		return '<div class="shift-note">' +
			'<span class="shift-note__label">' + esc(t('shift.title')) + '</span>' +
			esc(t('shift.window', { periods: periods }) + (shift.note ? ' · ' + shift.note : '')) +
			'</div>';
	}

	/* ------------------------------------------------------------------ *
	 * Header
	 * ------------------------------------------------------------------ */

	function renderHeader() {
		const day = today();
		const live = liveInfo();
		const period = day ? live.index : -1;

		let text;
		let dotClass = '';
		if (!day) text = t('status.closed');
		else if (live.before) text = t('status.before');
		else if (live.after) text = t('status.complete');
		else if (live.inBreak) {
			text = t(breakKey(), { time: Data.BREAK.label });
			dotClass = ' status-strip__dot--warn status-strip__dot--pulse';
		}
		else if (live.inZero) {
			text = t('status.zero', { time: ZERO_PERIOD.label });
			dotClass = ' status-strip__dot--warn status-strip__dot--pulse';
		}
		else if (period >= 0) {
			text = t('ui.live') + ' · ' + dayLabel(day) + ' · ' + periodName(period) + ' (' + PERIODS[period].label + ')';
			dotClass = ' status-strip__dot--ok status-strip__dot--pulse';
		} else text = dayLabel(day);

		document.getElementById('app-title').textContent = t('app.name');
		document.getElementById('app-school').textContent = t('app.school');

		const langButton = document.getElementById('lang-toggle');
		langButton.textContent = I18n.getLanguage() === 'hi' ? 'EN' : 'हिंदी';
		langButton.setAttribute('aria-label', t('a11y.language'));

		const themeButton = document.getElementById('theme-toggle');
		themeButton.innerHTML = icon(state.dark ? SUN_PATHS : MOON_PATHS, 17);
		themeButton.setAttribute('aria-label', t('a11y.theme'));

		document.getElementById('status-dot').className = 'status-strip__dot' + dotClass;
		document.getElementById('status-text').textContent = text;
		document.getElementById('status-clock').textContent = formatClock();
	}

	/* ------------------------------------------------------------------ *
	 * Home
	 * ------------------------------------------------------------------ */

	function renderHome() {
		const db = state.db;
		const day = today();
		const live = liveInfo();
		const period = day ? live.index : -1;
		let html = '';

		// Hero
		let title;
		let sub = '';
		let percent = 0;
		if (!day) {
			title = t('status.closedTitle');
			sub = t('hero.nextMonday', { day: dayLabel('Monday') });
		} else if (live.before) {
			title = t('status.beforeTitle');
			sub = t('status.before');
		} else if (live.after) {
			title = t('status.completeTitle');
			sub = t('status.complete');
		} else if (live.inBreak) {
			title = t(breakKey('Title'));
			sub = afterBreakText();
		} else if (live.inZero) {
			title = t('status.zeroTitle');
			sub = t('hero.zeroSub', { time: ZERO_PERIOD.label });
			percent = Math.round(((live.now - ZERO_PERIOD.s) / (ZERO_PERIOD.e - ZERO_PERIOD.s)) * 100);
		} else if (period >= 0) {
			const current = PERIODS[period];
			title = t('hero.periodLive', { n: period + 1 });
			sub = current.label + (live.nextIndex >= 0 ? ' · ' + t('hero.next') + ': ' + periodName(live.nextIndex) : '');
			percent = Math.round(((live.now - current.s) / (current.e - current.s)) * 100);
		} else {
			title = dayLabel(day);
		}

		const heroDate = new Date().toLocaleDateString(I18n.locale(), { weekday: 'long', day: 'numeric', month: 'long' });
		html += '<section class="hero">' +
			'<div class="hero__date">' + esc(heroDate) + '</div>' +
			'<h2 class="hero__title">' + esc(title) + '</h2>' +
			(sub ? '<div class="hero__sub">' + esc(sub) + '</div>' : '') +
			(percent > 0
				? '<div class="hero__track"><div class="hero__bar" style="width:' + Math.min(100, percent) + '%"></div></div>'
				: '') +
			'</section>';

		// Temporary bells: say so, so nobody assumes the app is stale.
		if (Data.SCHEDULE.id === 'practice') {
			html += '<section class="schedule-note">' +
				'<div class="schedule-note__title">' + esc(t('schedule.practiceNote')) + '</div>' +
				'<div class="schedule-note__sub">' + esc(t('schedule.practiceSub')) + '</div>' +
				'</section>';
		}

		// First-run role setup
		if (!state.role) {
			html += '<section class="setup">' +
				'<div class="setup__title">' + esc(t('setup.title')) + '</div>' +
				'<div class="setup__sub">' + esc(t('setup.sub')) + '</div>';
			if (state.picking) {
				html += chipRow(db.teacherNames.map(name => ({
					label: name, value: name, action: 'pick-me', active: false, big: true
				})), true);
				html += '<button type="button" class="button-quiet" data-action="cancel-picking">' +
					esc(t('setup.back')) + '</button>';
			} else {
				html += '<button type="button" class="button-primary" data-action="start-picking">' +
					esc(t('setup.teacher')) + '</button>' +
					'<button type="button" class="button-secondary" data-action="choose-admin">' +
					esc(t('setup.admin')) + '</button>';
			}
			html += '</section>';
		}

		// Personal day for a teacher profile
		if (state.role === 'teacher' && state.me) {
			const myDay = day || 'Monday';
			const schedule = db.teacherMap[state.me][myDay];
			const load = schedule.filter(Boolean).length;
			html += '<section class="view">' +
				'<div class="section-head section-head--baseline">' +
				'<h2 class="section-title section-title--sm">' + esc(t('hero.yourDay') + ' · ' + state.me) + '</h2>' +
				'<span class="section-meta">' + esc(load + '/' + PERIOD_COUNT + ' ' + t('ui.periods')) + '</span>' +
				'<button type="button" class="link-button" data-action="change-profile">' + esc(t('setup.change')) + '</button>' +
				'</div>' +
				'<div class="period-list">' +
				schedule.map((slot, index) => teacherPeriodCard(
					state.me, slot, index, myDay, day === myDay && index === period
				)).join('') +
				'</div>' +
				shareButton('share-my-day', t('home.shareDay')) +
				'</section>';
		}

		// Who is free during the running period
		if (period >= 0) {
			const names = freeAt(day, period);
			html += '<section class="free-note">' +
				'<div class="free-note__title">' + esc(t('home.freeRightNow') + ' · ' + periodName(period)) + '</div>' +
				'<div class="free-note__names">' + esc(names.length ? names.join(', ') : t('ui.noFree')) + '</div>' +
				'</section>';
		}

		return html;
	}

	/* ------------------------------------------------------------------ *
	 * Today board
	 * ------------------------------------------------------------------ */

	function boardPeriod() {
		const day = today();
		const live = liveInfo();
		const period = day ? live.index : -1;
		if (state.selPeriod != null) return state.selPeriod;
		if (state.selDay !== day) return 0;
		if (period >= 0) return period;
		return live.nextIndex >= 0 ? live.nextIndex : 0;
	}

	function renderBoard() {
		const db = state.db;
		const day = today();
		const period = livePeriod();
		const boardDay = state.selDay;
		const selected = boardPeriod();

		let html = '<section class="view">' +
			'<div class="section-head">' +
			'<h2 class="section-title">' + esc(t('board.title')) + '</h2>' +
			modeSegmented('board-mode', t('ui.list'), 'list', t('ui.table'), 'table', state.gridNow) +
			'</div>' +
			dayChips(boardDay, 'sel-day');

		if (!state.gridNow) {
			html += chipRow(PERIODS.map((period0, index) => ({
				label: periodName(index), value: String(index), action: 'sel-period', active: selected === index
			})));

			const isLive = boardDay === day && selected === period && period >= 0;
			html += '<div class="section-head">' +
				'<div class="slot-label">' +
				esc(dayLabel(boardDay) + ' · ' + periodName(selected) + ' · ' + PERIODS[selected].label) +
				'</div>' +
				(isLive ? nowBadge(t('ui.live')) : '') +
				'</div>';

			html += '<div class="period-list">' + db.classNames.map(className => {
				const cell = db.timetable[boardDay][className][selected];
				const category = cell.free ? 'default' : Data.categoryOf(cell.subject);
				const swap = subForClass(boardDay, className, selected);
				return '<div class="board-row' + (swap ? ' board-row--substituted' : '') + '">' +
					'<div class="board-row__class">' + esc(classLabel(className, true)) + '</div>' +
					'<div class="board-row__rule rule-' + category + '"></div>' +
					'<div class="board-row__body">' +
					'<div class="board-row__subject' + (cell.free ? ' board-row__subject--free' : '') + '">' +
					esc(cell.free ? t('ui.freeShort') : cell.subject) + '</div>' +
					'<div class="board-row__teacher">' +
					(swap ? replacedBy(swap.was, swap.now) : esc(cell.teachers.join(' / '))) + '</div>' +
					'</div></div>';
			}).join('') + '</div>';

			const free = freeAt(boardDay, selected);
			if (free.length) {
				html += '<div class="free-note free-note--soft">' +
					'<div class="free-note__title">' + esc(t('board.freeThisPeriod')) + '</div>' +
					'<div class="free-note__names">' + esc(free.join(', ')) + '</div>' +
					'</div>';
			}
		} else {
			const beforeBreak = breakAfterIndex();
			html += '<div class="slot-label">' + esc(dayLabel(boardDay)) + '</div>' +
				gridWrap(
					dayLabel(boardDay) + ' · ' + t('board.title'),
					'<th scope="col" class="grid__head grid__head--corner">' + esc(t('ui.classCol')) + '</th>' +
					PERIODS.map((slot, index) =>
						gridPeriodHead(index, boardDay === day && index === period)).join(''),
					db.classNames.map(className =>
						'<tr><th scope="row" class="grid__rowlabel">' +
						esc(classLabel(className, true)) + '</th>' +
						db.timetable[boardDay][className].map((cell, index) => gridCell(
							cell,
							boardDay === day && index === period,
							null,
							{ beforeBreak: index === beforeBreak, sub: subForClass(boardDay, className, index) }
						)).join('') +
						'</tr>').join('')
				);
		}

		return html + '</section>';
	}

	/* ------------------------------------------------------------------ *
	 * Class view
	 * ------------------------------------------------------------------ */

	function renderClassView() {
		const db = state.db;
		const day = today();
		const period = livePeriod();

		let html = '<section class="view">' +
			'<div class="section-head">' +
			'<h2 class="section-title">' + esc(t('class.title')) + '</h2>' +
			modeSegmented('class-mode', t('ui.day'), 'day', t('ui.week'), 'week', state.gridClass) +
			'</div>' +
			chipRow(db.classNames.map(name => ({
				label: classLabel(name, true), value: name, action: 'sel-class', active: state.selClass === name
			})));

		if (!state.gridClass) {
			html += dayChips(state.selDay, 'sel-day') +
				'<div class="period-list">' +
				db.timetable[state.selDay][state.selClass].map((cell, index) => {
					const swap = subForClass(state.selDay, state.selClass, index);
					// When a period is substituted the swap line already names
					// who is teaching it; repeating the original above it just
					// reads as a contradiction.
					return periodCard(
						cell, index, state.selDay === day && index === period,
						swap ? '' : cell.teachers.join(' / '),
						false, swap
					);
				}).join('') +
				'</div>' +
				shareButton('share-class', t('home.shareDay'));
		} else {
			const beforeBreak = breakAfterIndex();
			html += '<div class="slot-label">' + esc(classLabel(state.selClass) + ' · ' + t('ui.week')) + '</div>' +
				gridWrap(
					classLabel(state.selClass) + ' · ' + t('ui.week'),
					'<th scope="col" class="grid__head grid__head--corner">' + esc(t('ui.periodShort')) + '</th>' +
					db.days.map(d => '<th scope="col" class="grid__head' +
						(d === day ? ' grid__head--live' : '') + '">' +
						esc(dayLabel(d, true)) + '</th>').join(''),
					PERIODS.map((slot, index) =>
						'<tr' + (index === beforeBreak ? ' class="grid__row--beforebreak"' : '') + '>' +
						gridPeriodRowLabel(index) +
						db.days.map(d => gridCell(
							db.timetable[d][state.selClass][index],
							d === day && index === period,
							null,
							{ sub: subForClass(d, state.selClass, index) }
						)).join('') +
						'</tr>').join('')
				);
		}

		return html + '</section>';
	}

	/* ------------------------------------------------------------------ *
	 * Teacher view
	 * ------------------------------------------------------------------ */

	function renderTeacherView() {
		const db = state.db;
		const day = today();
		const period = livePeriod();
		const schedule = db.teacherMap[state.selTeacher][state.selDay];

		let html = '<section class="view">' +
			'<div class="section-head">' +
			'<h2 class="section-title">' + esc(t('teacher.title')) + '</h2>' +
			modeSegmented('teacher-mode', t('ui.day'), 'day', t('ui.week'), 'week', state.gridTeacher) +
			'</div>' +
			chipRow(db.teacherNames.map(name => ({
				label: name, value: name, action: 'sel-teacher', active: state.selTeacher === name
			})), true);

		if (!state.gridTeacher) {
			html += dayChips(state.selDay, 'sel-day') +
				'<div class="section-head">' +
				'<div class="slot-label">' + esc(state.selTeacher + ' · ' + dayLabel(state.selDay)) + '</div>' +
				'<span class="section-meta">' +
				esc(schedule.filter(Boolean).length + '/' + PERIOD_COUNT + ' ' + t('ui.periods')) + '</span>' +
				'</div>' +
				shiftNote(state.selTeacher) +
				'<div class="period-list">' +
				schedule.map((slot, index) => teacherPeriodCard(
					state.selTeacher, slot, index, state.selDay, state.selDay === day && index === period
				)).join('') +
				'</div>' +
				shareButton('share-teacher', t('home.shareDay'));
		} else {
			const weekTotal = db.days.reduce((sum, d) => sum + dayLoad(state.selTeacher, d), 0);
			html += '<div class="section-head">' +
				'<div class="slot-label">' + esc(state.selTeacher + ' · ' + t('ui.week')) + '</div>' +
				'<span class="section-meta">' +
				esc(weekTotal + '/' + (db.days.length * PERIOD_COUNT) + ' ' + t('ui.periods')) + '</span>' +
				'</div>' +
				shiftNote(state.selTeacher) +
				gridWrap(
					state.selTeacher + ' · ' + t('ui.week'),
					'<th scope="col" class="grid__head grid__head--corner">' + esc(t('ui.periodShort')) + '</th>' +
					db.days.map(d => '<th scope="col" class="grid__head' +
						(d === day ? ' grid__head--live' : '') + '">' +
						esc(dayLabel(d, true)) + '</th>').join(''),
					PERIODS.map((slot, index) =>
						'<tr' + (index === breakAfterIndex() ? ' class="grid__row--beforebreak"' : '') + '>' +
						gridPeriodRowLabel(index) +
							db.days.map(d => {
							const cell = db.teacherMap[state.selTeacher][d][index];
							const duty = cell ? null : subForTeacher(d, state.selTeacher, index);
							const handover = cell ? subForClass(d, cell.className, index) : null;
							if (duty) {
								return gridCell(
									{ subject: duty.subject, teachers: [] },
									d === day && index === period,
									slotClassLabel(duty, true),
									{ cover: duty }
								);
							}
							// `was === teacher` alone hides the host of a merge,
							// whose own name never appears in the record.
							const mine = handover &&
								(handover.was === state.selTeacher || (handover.joined && !handover.was));
							return gridCell(
								cell ? { subject: cell.subject, teachers: [] } : null,
								d === day && index === period,
								cell ? slotClassLabel(cell, true) : null,
								{
									offShift: !onShift(state.selTeacher, index),
									sub: mine ? handover : null
								}
							);
						}).join('') +
						'</tr>').join('')
				);
		}

		return html + '</section>';
	}

	/* ------------------------------------------------------------------ *
	 * Substitution planner
	 * ------------------------------------------------------------------ */

	/**
	 * Build the coverage plan for the selected day using the substitution
	 * engine, grouped per absent teacher as the design specifies.
	 */
	/**
	 * Teacher profiles for the current roster and shift policy. Rebuilt only
	 * when the shifts change - the plan and the swap sheet must rank against
	 * exactly the same profiles or the sheet would explain a different plan.
	 */
	function teacherProfiles() {
		const db = state.db;
		const key = JSON.stringify(state.shifts);
		if (profileCache && profileCache.key === key) return profileCache.value;

		const teacherDetails = {};
		db.teacherNames.forEach(name => {
			const schedule = {};
			db.days.forEach(d => {
				schedule[d] = db.teacherMap[name][d].map(slot =>
					slot ? { subject: slot.subject, className: slot.className } : null);
			});
			teacherDetails[name] = { subjects: new Set(), schedule };
		});
		// Reserve staff have no timetable at all - that is what makes them
		// reserve. They get an empty schedule so the engine can reason about
		// them without inventing periods they do not teach.
		db.reserveStaff.forEach(name => { teacherDetails[name] = { subjects: new Set(), schedule: {} }; });

		// Shift timings become availability policy, which is what keeps a
		// teacher who reports late out of the early periods.
		profileCache = {
			key: key,
			value: Engine.buildTeacherProfiles({
				teacherDetails,
				roster: db.coverPool,
				reserveStaff: db.reserveStaff,
				dutyStaff: db.dutyStaff,
				policyOverrides: Engine.shiftsToPolicyOverrides(state.shifts, PERIOD_COUNT)
			})
		};
		return profileCache.value;
	}

	function buildPlan() {
		const db = state.db;
		const day = state.subsDay;
		const absent = state.absent;
		const profiles = teacherProfiles();

		const vacancies = [];
		const teamCovered = {};
		absent.forEach(name => {
			db.teacherMap[name][day].forEach((slot, index) => {
				if (!slot) return;
				const cell = db.timetable[day][slot.className][index];
				const remaining = cell.teachers.filter(other => other !== name && absent.indexOf(other) === -1);
				const slotId = name + '|' + index;
				// A pin overrides even a co-taught period: if the coordinator
				// named someone, they meant it.
				if (slot.shared && remaining.length && !isPinned(slotId)) {
					teamCovered[slotId] = true;
					return;
				}
				vacancies.push({
					slotId, className: slot.className, periodIndex: index,
					alsoClassNames: slot.alsoClassNames || [],
					subject: slot.subject, originalTeacher: name
				});
			});
		});

		// A coordinator's choice is not a suggestion. Pinned periods go in as
		// decisions already taken, so they consume the teacher's capacity and
		// block their period while everything else re-allocates around them.
		// `generatePlan` has always accepted `existingAssignments`; the app
		// simply passed an empty array and did the work twice.
		const pinnedAssignments = [];
		const heldOpen = {};
		const combinePins = {};
		const openVacancies = [];
		vacancies.forEach(vacancy => {
			if (!isPinned(vacancy.slotId)) {
				openVacancies.push(vacancy);
				return;
			}
			// Three pin forms: a teacher's name, null for "held open", and
			// { combineWith } for "send them next door". A combine is not an
			// assignment, so it is resolved after the allocator has run and
			// we know who is actually teaching the host class.
			const pin = state.pins[vacancy.slotId];
			if (pin && typeof pin === 'object') combinePins[vacancy.slotId] = vacancy;
			else if (!pin) heldOpen[vacancy.slotId] = true;
			else pinnedAssignments.push(Object.assign({}, vacancy, { teacher: pin, source: 'manual' }));
		});

		let plan = { assignments: pinnedAssignments, reviewSuggestions: [], openSlots: [] };
		if (openVacancies.length) {
			plan = Engine.generatePlan({
				day, periodCount: PERIOD_COUNT, teacherProfiles: profiles,
				absentTeachers: absent, vacancies: openVacancies,
				existingAssignments: pinnedAssignments,
				coverHistory: state.coverHistory
			});
		}

		// Three honest states. A "review" suggestion is a teacher the engine
		// deliberately declined to auto-assign - showing it as settled is how
		// an unvetted guess used to reach WhatsApp looking like a decision.
		const cover = {};
		plan.assignments.forEach(item => {
			const manual = item.source === 'manual';
			cover[item.slotId] = {
				name: item.teacher,
				status: 'assigned',
				pinned: manual,
				note: manual ? t('sub.pinned') : reasonFor(item)
			};
		});
		Object.keys(heldOpen).forEach(slotId => {
			cover[slotId] = {
				name: t('sub.openShort'),
				status: 'open',
				pinned: true,
				note: t('sub.heldOpen')
			};
		});
		plan.reviewSuggestions.forEach(item => {
			// Say why it needs checking, not how well the subject matched. A
			// warning of "exact subject match" next to a caution flag tells the
			// reader nothing; "daily substitution limit exceeded" tells them
			// exactly what decision is theirs to make.
			const warnings = item.warnings || [];
			cover[item.slotId] = {
				name: item.teacher,
				status: 'review',
				note: warnings.length
					? warnings.map(warning => t('warning.' + warning)).join(' · ')
					: (item.reasonKey ? t(item.reasonKey) : t('sub.reviewRequired'))
			};
		});
		// Nobody free is still an outcome, not a hole in the chart. The class
		// sits self study, which is what the school does anyway - saying "no
		// one free" left the period looking unresolved right up to the bell.
		plan.openSlots.forEach(item => {
			cover[item.slotId] = {
				name: t('ui.selfStudy'),
				status: 'selfstudy',
				note: t('sub.selfStudyWhy')
			};
		});

		// Now that we know who is teaching what, offer somewhere for the
		// stranded classes to go. Offer only - a merge costs the host class
		// part of its lesson, so a coordinator makes that call.
		plan.openSlots.forEach(item => {
			const host = Engine.chooseMergeHost(
				item.className,
				hostsInPeriod(day, item.periodIndex, cover, absent)
			);
			if (host) cover[item.slotId].suggestCombine = host;
		});

		// Merges the coordinator has already accepted.
		const joinedByClass = {};
		Object.keys(combinePins).forEach(slotId => {
			const vacancy = combinePins[slotId];
			const wanted = pinnedCombine(slotId);
			const host = hostsInPeriod(day, vacancy.periodIndex, cover, absent)
				.find(candidate => candidate.className === wanted);
			if (!host) {
				// The host lost its teacher since the merge was chosen.
				cover[slotId] = { name: t('ui.selfStudy'), status: 'selfstudy', note: t('sub.combineLost') };
				return;
			}
			cover[slotId] = {
				name: t('sub.joins', { class: classLabel(host.className, true), teacher: host.teacher }),
				status: 'combined',
				pinned: true,
				combinedInto: host,
				note: t('sub.combinedWhy', { class: classLabel(host.className), teacher: host.teacher })
			};
			const key = host.className + '|' + vacancy.periodIndex;
			(joinedByClass[key] = joinedByClass[key] || []).push(vacancy.className);
		});

		// Every status must be seeded: the tally below indexes this object by
		// status name, so a missing key silently becomes NaN.
		const totals = {
			total: 0, assigned: 0, review: 0, team: 0,
			open: 0, selfstudy: 0, combined: 0, pinned: 0
		};
		const groups = absent.map(name => {
			const rows = [];
			db.teacherMap[name][day].forEach((slot, index) => {
				if (!slot) return;
				const slotId = name + '|' + index;
				const result = teamCovered[slotId]
					? { name: t('ui.team'), status: 'team', note: t('ui.team') }
					: (cover[slotId] ||
						{ name: t('ui.selfStudy'), status: 'selfstudy', note: t('sub.selfStudyWhy') });
				totals.total += 1;
				totals[result.status] += 1;
				if (result.pinned) totals.pinned += 1;
				rows.push({
					slotId: slotId,
					periodIndex: index,
					period: periodName(index),
					time: PERIODS[index].label,
					className: slot.className,
					alsoClassNames: slot.alsoClassNames || [],
					subject: slot.subject,
					what: slotClassLabel(slot) + ' · ' + slot.subject,
					cover: result.name,
					// Always a real name or null - never a translated word, so
					// the fairness history stays machine-readable.
					coverTeacher: (result.status === 'assigned' || result.status === 'review') ? result.name : null,
					note: result.note,
					status: result.status,
					pinned: Boolean(result.pinned),
					suggestCombine: result.suggestCombine || null,
					combinedInto: result.combinedInto || null
				});
			});
			return { title: name, count: rows.length + ' ' + t('ui.periods'), rows };
		});

		return { groups: groups, totals: totals, joinedByClass: joinedByClass };
	}

	function planCacheKey() {
		return [
			state.subsDay,
			state.absent.join(','),
			JSON.stringify(state.shifts),
			JSON.stringify(state.pins),
			JSON.stringify(state.coverHistory),
			I18n.getLanguage()
		].join('|');
	}

	/** One allocation per render; sharing used to run the whole flow twice. */
	function planFor() {
		const key = planCacheKey();
		if (planCache && planCache.key === key) return planCache.value;
		planCache = { key: key, value: buildPlan() };
		return planCache.value;
	}

	/**
	 * Admin-only editor for standing shift timings. Lit periods are the ones
	 * the teacher is in school for; everything else is off limits to the
	 * planner, every day.
	 */
	function renderShiftEditor() {
		const db = state.db;
		const restricted = db.teacherNames.filter(name => {
			const shift = shiftOf(name);
			return shift && !Engine.isFullDayShift(shift, PERIOD_COUNT);
		});

		let html = '<section class="shift-panel">' +
			'<div class="section-head">' +
			'<h3 class="section-title section-title--sm">' + esc(t('shift.title')) + '</h3>' +
			syncPill() +
			'</div>' +
			'<div class="section-note">' + esc(t('shift.sub')) + '</div>';

		html += restricted.length
			? '<div class="shift-list">' + restricted.map(name => {
				const periods = Engine.shiftPeriods(shiftOf(name), PERIOD_COUNT).map(periodName).join(', ');
				return '<button type="button" class="shift-item' +
					(state.shiftEditor === name ? ' is-active' : '') + '" ' +
					'data-action="shift-pick" data-value="' + esc(name) + '">' +
					'<span class="shift-item__name">' + esc(name) + '</span>' +
					'<span class="shift-item__periods">' + esc(periods) + '</span>' +
					'</button>';
			}).join('') + '</div>'
			: '<div class="section-note section-note--quiet">' + esc(t('shift.none')) + '</div>';

		html += '<div class="field-label">' + esc(t('shift.pick')) + '</div>' +
			chipRow(db.teacherNames.map(name => ({
				label: name, value: name, action: 'shift-pick', active: state.shiftEditor === name
			})), true);

		if (state.shiftEditor) {
			const editing = state.shiftEditor;
			html += '<div class="shift-edit">' +
				'<div class="shift-edit__name">' + esc(editing) + '</div>' +
				'<div class="shift-edit__periods">' +
				PERIODS.map((slot, index) =>
					'<button type="button" class="shift-toggle' +
					(onShift(editing, index) ? ' is-on' : '') + '" ' +
					'aria-pressed="' + (onShift(editing, index) ? 'true' : 'false') + '" ' +
					'data-action="shift-toggle" data-value="' + index + '">' +
					esc(periodName(index)) +
					'<span class="shift-toggle__time">' + esc(shortTime(slot.s)) + '</span>' +
					'</button>').join('') +
				'</div>' +
				'<button type="button" class="button-quiet" data-action="shift-full">' +
				esc(t('shift.allDay')) + '</button>' +
				'</div>';
		}

		html += '<div class="field-label">' + esc(t('ledger.title', { days: HISTORY_DAYS })) + '</div>' +
			renderLedger();

		return html + '</section>';
	}

	/**
	 * Who has been carrying the cover lately. The engine already ranks on
	 * this; showing it makes the spread arguable instead of asserted.
	 */
	function renderLedger() {
		const entries = Object.keys(state.coverHistory)
			.filter(name => state.db.teacherNames.indexOf(name) !== -1)
			.map(name => ({ name: name, covers: state.coverHistory[name] }))
			.sort((a, b) => b.covers - a.covers || a.name.localeCompare(b.name))
			.slice(0, 8);

		if (!entries.length) {
			return '<div class="section-note section-note--quiet">' + esc(t('ledger.none')) + '</div>';
		}

		const most = entries[0].covers || 1;
		return '<div class="ledger">' + entries.map(entry =>
			'<div class="ledger__row">' +
			'<span class="ledger__name">' + esc(entry.name) + '</span>' +
			'<span class="ledger__bar"><span class="ledger__fill" style="width:' +
			Math.max(6, Math.round((entry.covers / most) * 100)) + '%"></span></span>' +
			'<span class="ledger__count">' + esc(String(entry.covers)) + '</span>' +
			'</div>').join('') + '</div>';
	}

	function renderSubs() {
		const db = state.db;
		let html = '<section class="view">' +
			'<div class="section-head">' +
			'<h2 class="section-title">' + esc(t('subs.title')) + '</h2>' +
			modeSegmented('subs-mode', t('ui.list'), 'list', t('ui.table'), 'table', state.gridSubs) +
			'</div>' +
			'<div class="section-note">' + esc(t('subs.sub')) + '</div>';

		if (state.role === 'admin') html += renderShiftEditor();

		html += dayChips(state.subsDay, 'subs-day') +
			'<div class="section-head">' +
			'<span class="field-label">' + esc(t('subs.markAbsent')) + '</span>' +
			(state.absent.length
				? '<span class="section-meta">' + esc(t('sub.selected', { count: state.absent.length })) + '</span>'
				: '') +
			'</div>' +
			chipRow(db.teacherNames.map(name => ({
				label: name, value: name, action: 'toggle-absent', active: state.absent.indexOf(name) !== -1
			})), true);

		if (!state.absent.length) {
			return html + '<div class="empty-state">' + esc(t('subs.empty')) + '</div></section>';
		}

		const plan = planFor();
		const totals = plan.totals;

		html += '<div class="plan-summary">' +
			'<span class="plan-summary__date">' + esc(longDate(dateForDay(state.subsDay))) + '</span>' +
			'<span class="plan-summary__counts">' + esc(t('subs.summary', {
				covered: totals.assigned + totals.team,
				review: totals.review,
				selfStudy: totals.selfstudy
			})) + '</span>' +
			(totals.combined
				? '<span class="plan-summary__pins">🔗 ' +
					esc(t('msg.sumCombined', { n: totals.combined })) + '</span>'
				: '') +
			(totals.pinned
				? '<span class="plan-summary__pins">📌 ' + esc(t('subs.pinned', { count: totals.pinned })) + '</span>'
				: '') +
			'</div>';

		if (state.editSlot) html += renderSlotEditor(plan);

		html += state.gridSubs ? renderPlanGrid(plan) : renderPlanStack(plan);

		html += '<div class="plan-actions">' +
			shareButton('share-whatsapp', t('subs.whatsapp'), true) +
			shareButton('share-plan', t('subs.share')) +
			(totals.pinned
				? '<button type="button" class="button-quiet" data-action="clear-pins">' +
					esc(t('edit.clearPins')) + '</button>'
				: '') +
			'<button type="button" class="button-quiet" data-action="clear-absent">' +
			esc(t('subs.clear')) + '</button>' +
			'</div>';

		return html + '</section>';
	}

	/**
	 * The one-tap way out of a self study. Offered, never taken automatically:
	 * a merge costs the host class part of its lesson, and that is a
	 * coordinator's call rather than an optimiser's.
	 */
	function combineOffer(row) {
		if (!row.suggestCombine) return '';
		return '<button type="button" class="combine-offer" ' +
			'data-action="combine-slot" data-value="' + esc(row.slotId) + '" ' +
			'data-host="' + esc(row.suggestCombine.className) + '">' +
			'🔗 ' + esc(t('sub.combineOffer', {
				class: classLabel(row.suggestCombine.className, true),
				teacher: row.suggestCombine.teacher
			})) + '</button>';
	}

	function coverPill(row) {
		return '<button type="button" class="cover-pill cover-pill--' + row.status +
			(row.pinned ? ' cover-pill--pinned' : '') + '" ' +
			'title="' + esc(row.note) + '" ' +
			'data-action="edit-slot" data-value="' + esc(row.slotId) + '">' +
			(row.pinned ? '<span class="cover-pill__pin" aria-hidden="true">📌</span>' : '') +
			esc(row.cover) + '</button>';
	}

	/**
	 * The swap sheet. Everyone the engine considered, in its own order, with
	 * the reason it ranked them there and the reason it would not use them.
	 * Choosing pins the period; the rest of the plan re-allocates around it.
	 */
	function renderSlotEditor(plan) {
		const slotId = state.editSlot;
		let row = null;
		let group = null;
		plan.groups.forEach(candidateGroup => candidateGroup.rows.forEach(candidateRow => {
			if (candidateRow.slotId === slotId) { row = candidateRow; group = candidateGroup; }
		}));
		if (!row) return '';

		const ranked = candidatesForSlot(group.title, row);
		const raw = isPinned(slotId) ? state.pins[slotId] : undefined;
		// undefined = automatic, null = held open, string = a named teacher.
		// An object pin is a merge, handled by combineOption.
		const pinnedTo = (raw && typeof raw === 'object') ? '' : raw;

		return '<div class="slot-editor">' +
			'<div class="slot-editor__head">' +
			'<div>' +
			'<div class="slot-editor__title">' + esc(row.period + ' · ' + row.what) + '</div>' +
			'<div class="slot-editor__sub">' + esc(group.title + ' · ' + row.time) + '</div>' +
			'</div>' +
			'<button type="button" class="icon-button" data-action="close-editor" ' +
			'aria-label="' + esc(t('edit.close')) + '">✕</button>' +
			'</div>' +
			'<div class="slot-editor__options">' +
			'<button type="button" class="slot-option' + (pinnedTo === undefined ? ' is-active' : '') + '" ' +
			'data-action="unpin-slot" data-value="' + esc(slotId) + '">' +
			'<span class="slot-option__name">' + esc(t('edit.auto')) + '</span>' +
			'<span class="slot-option__why">' + esc(t('edit.autoWhy')) + '</span>' +
			'</button>' +
			'<button type="button" class="slot-option' + (pinnedTo === null ? ' is-active' : '') + '" ' +
			'data-action="leave-open" data-value="' + esc(slotId) + '">' +
			'<span class="slot-option__name">' + esc(t('edit.leaveOpen')) + '</span>' +
			'<span class="slot-option__why">' + esc(t('edit.leaveOpenWhy')) + '</span>' +
			'</button>' +
			combineOption(row, slotId) +
			'</div>' +
			renderCandidateList(ranked.filter(option => !option.reserve), slotId, pinnedTo) +
			renderReserveList(ranked.filter(option => option.reserve), slotId, pinnedTo) +
			'</div>';
	}

	/** "Send them next door", inside the swap sheet. */
	function combineOption(row, slotId) {
		const host = row.combinedInto || row.suggestCombine;
		if (!host) return '';
		const active = pinnedCombine(slotId) === host.className;
		return '<button type="button" class="slot-option slot-option--combine' +
			(active ? ' is-active' : '') + '" ' +
			'data-action="combine-slot" data-value="' + esc(slotId) + '" ' +
			'data-host="' + esc(host.className) + '">' +
			'<span class="slot-option__name">🔗 ' +
			esc(t('edit.combine', { class: classLabel(host.className) })) + '</span>' +
			'<span class="slot-option__why">' +
			esc(t('edit.combineWhy', { teacher: host.teacher })) + '</span>' +
			'</button>';
	}

	/** The ordinary teachers, in engine order. */
	function renderCandidateList(ranked, slotId, pinnedTo) {
		return (ranked.length
				? '<div class="slot-editor__options">' + ranked.map(candidate =>
					'<button type="button" class="slot-option' +
					(candidate.blocked.length ? ' is-blocked' : '') +
					(pinnedTo === candidate.teacher ? ' is-active' : '') + '" ' +
					'data-action="pick-cover" data-value="' + esc(slotId) + '" ' +
					'data-teacher="' + esc(candidate.teacher) + '">' +
					'<span class="slot-option__name">' + esc(candidate.teacher) +
					'<span class="slot-option__tier slot-option__tier--' + esc(candidate.matchTier) + '">' +
					esc(t('sub.' + candidate.matchTier)) + '</span>' +
					'</span>' +
					'<span class="slot-option__why">' + esc(candidateWhy(candidate)) + '</span>' +
					'</button>').join('') + '</div>'
				: '<div class="section-note section-note--quiet">' + esc(t('edit.none')) + '</div>');
	}

	/**
	 * Admin staff, kept below a divider. They are never proposed by the
	 * planner, so the only way one appears in a plan is a coordinator
	 * deciding to ask them - which is how the school works.
	 */
	function renderReserveList(reserve, slotId, pinnedTo) {
		if (!reserve.length) return '';
		return '<div class="slot-reserve">' +
			'<div class="slot-reserve__label">' + esc(t('edit.reserve')) + '</div>' +
			'<div class="slot-editor__options">' + reserve.map(candidate =>
				'<button type="button" class="slot-option slot-option--reserve' +
				(candidate.blocked.length ? ' is-blocked' : '') +
				(pinnedTo === candidate.teacher ? ' is-active' : '') + '" ' +
				'data-action="pick-cover" data-value="' + esc(slotId) + '" ' +
				'data-teacher="' + esc(candidate.teacher) + '">' +
				'<span class="slot-option__name">' + esc(candidate.teacher) + '</span>' +
				'<span class="slot-option__why">' + esc(t('edit.reserveWhy')) + '</span>' +
				'</button>').join('') +
			'</div></div>';
	}

	/** The one-line explanation under a candidate's name. */
	function candidateWhy(candidate) {
		const parts = [];
		if (candidate.blocked.length) {
			parts.push(candidate.blocked.map(reason => t('error.' + reason)).join(' · '));
		}
		if (candidate.classPeriods) parts.push(t('edit.classPeriods', { n: candidate.classPeriods }));
		if (candidate.recentCovers) parts.push(t('edit.recent', { n: candidate.recentCovers }));
		candidate.warnings.forEach(warning => parts.push(t('warning.' + warning)));
		return parts.length ? parts.join(' · ') : t('edit.readyWhy');
	}

	/** Rank every teacher for one period, using the same engine the plan used. */
	function candidatesForSlot(absentTeacher, row) {
		const plan = planFor();
		const taken = [];
		plan.groups.forEach(group => group.rows.forEach(other => {
			if (other.slotId !== row.slotId && other.coverTeacher) {
				taken.push({ slotId: other.slotId, teacher: other.coverTeacher, periodIndex: other.periodIndex });
			}
		}));

		const ranked = Engine.rankCandidates({
			day: state.subsDay,
			periodCount: PERIOD_COUNT,
			teacherProfiles: teacherProfiles(),
			absentTeachers: state.absent,
			assignments: taken,
			coverHistory: state.coverHistory,
			vacancy: {
				slotId: row.slotId,
				className: row.className,
				periodIndex: row.periodIndex,
				subject: row.subject,
				originalTeacher: absentTeacher
			}
		}).filter(candidate => candidate.teacher !== absentTeacher);

		// Keep the first dozen teachers, but never drop the reserve staff off
		// the end - they are the whole point of the manual path. Duty-holders
		// need the same protection for the opposite reason: they rank last by
		// design, so on a day with a big free pool the trim is exactly what
		// would hide them, and "only if no one else is free" is a day the
		// coordinator still has to be able to act on.
		const regular = ranked
			.filter(candidate => !candidate.reserve && !candidate.lastResort)
			.slice(0, 12);
		return regular
			.concat(ranked.filter(candidate => candidate.lastResort))
			.concat(ranked.filter(candidate => candidate.reserve));
	}

	function renderPlanStack(plan) {
		return '<div class="plan-stack">' +
			plan.groups.map(group =>
				'<div class="plan-group">' +
				'<div class="plan-group__head">' +
				'<div class="plan-group__title">' + esc(group.title) + '</div>' +
				'<div class="plan-group__count">' + esc(group.count) + '</div>' +
				'</div>' +
				group.rows.map(row =>
					'<div class="plan-row plan-row--' + row.status +
					(state.editSlot === row.slotId ? ' is-editing' : '') + '">' +
					'<div class="plan-row__period">' + esc(row.period) + '</div>' +
					'<div class="plan-row__body">' +
					'<div class="plan-row__what">' + esc(row.what) + '</div>' +
					'<div class="plan-row__time">' + esc(row.time) + '</div>' +
					combineOffer(row) +
					'</div>' +
					coverPill(row) +
					'</div>').join('') +
				'</div>').join('') +
			'</div>';
	}

	/** Absent teachers down the side, periods across: the office's view. */
	function renderPlanGrid(plan) {
		const byPeriod = {};
		plan.groups.forEach(group => {
			byPeriod[group.title] = {};
			group.rows.forEach(row => { byPeriod[group.title][row.periodIndex] = row; });
		});

		return gridWrap(
			t('subs.title') + ' · ' + dayLabel(state.subsDay),
			'<th scope="col" class="grid__head grid__head--corner">' + esc(t('nav.teacher')) + '</th>' +
			PERIODS.map((slot, index) => gridPeriodHead(index, false)).join(''),
			plan.groups.map(group =>
				'<tr><th scope="row" class="grid__rowlabel">' + esc(group.title) + '</th>' +
				PERIODS.map((slot, index) => {
					const row = byPeriod[group.title][index];
					const beforeBreak = index === breakAfterIndex() ? ' grid__cell--beforebreak' : '';
					if (!row) {
						return '<td class="grid__cell grid__cell--free' + beforeBreak + '">' +
							'<div class="grid__subject grid__subject--free">·</div></td>';
					}
					return '<td class="grid__cell grid__cell--' + row.status + beforeBreak +
						(row.pinned ? ' grid__cell--pinned' : '') +
						(state.editSlot === row.slotId ? ' grid__cell--editing' : '') + '" ' +
						'title="' + esc(row.what + ' · ' + row.note) + '" ' +
						'data-action="edit-slot" data-value="' + esc(row.slotId) + '">' +
						'<div class="grid__subject">' + (row.pinned ? '📌 ' : '') + esc(row.cover) + '</div>' +
						'<div class="grid__teacher">' + esc(slotClassLabel(row, true)) + '</div>' +
						'</td>';
				}).join('') +
				'</tr>').join('')
		);
	}

	/* ------------------------------------------------------------------ *
	 * Sharing
	 * ------------------------------------------------------------------ */

	function showToast(message) {
		const toast = document.getElementById('toast');
		toast.textContent = message;
		toast.hidden = false;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
	}

	function shareRaw(text) {
		const done = () => showToast(t('ui.copied'));
		if (navigator.share) {
			navigator.share({ text }).catch(() => { /* user dismissed the sheet */ });
			return;
		}
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(done, done);
			return;
		}
		done();
	}

	function shareText(title, lines) {
		shareRaw(title + '\n' + lines.join('\n'));
	}

	/** Hands the text to WhatsApp prefilled; the user still presses send. */
	function openWhatsApp(text) {
		window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
	}

	function scheduleLines(schedule, teacher) {
		return schedule.map((slot, index) => {
			const off = teacher && !onShift(teacher, index);
			return periodName(index) + ' ' + PERIODS[index].label + ': ' +
				(slot ? slot.subject + ' · ' + slotClassLabel(slot) : t(off ? 'ui.offShift' : 'ui.freeShort'));
		});
	}

	// One marker per row, and each one means something specific.
	const STATUS_EMOJI = {
		assigned: '✅', review: '⚠️', team: '👥', open: '❌', selfstudy: '📖', combined: '🔗'
	};

	function statusEmoji(row) {
		return row.status === 'open' && row.pinned ? '📌' : STATUS_EMOJI[row.status];
	}

	/** What goes after the arrow for a single covered - or uncovered - period. */
	function coverSentence(row) {
		if (row.status === 'team') return t('msg.team');
		if (row.status === 'selfstudy') return t('msg.selfStudy');
		// A period the coordinator chose to handle is not a period nobody
		// could cover; telling the staff group otherwise invites a scramble.
		if (row.status === 'open') return t(row.pinned ? 'msg.heldOpen' : 'msg.noCover');
		if (row.status === 'review') return '*' + row.cover + '* (' + row.note + ' — ' + t('msg.check') + ')';
		return '*' + row.cover + '*';
	}

	function padCell(value, width) {
		const text = String(value == null ? '' : value);
		return text.length >= width ? text : text + ' '.repeat(width - text.length);
	}

	/** "Mon 17 Aug" - enough to be sure which day, short enough for a heading. */
	function shortDate(date) {
		return date.toLocaleDateString(I18n.locale(), { weekday: 'short', day: 'numeric', month: 'short' });
	}

	/**
	 * The message that reaches the staff group.
	 *
	 * One aligned row per period inside WhatsApp's monospace block, sorted by
	 * period so the day reads top to bottom. Deliberately not the screen: the
	 * planner keeps the reasons, warnings and times because that is where the
	 * decisions get made, whereas twenty people on a phone need to find their
	 * own name and stop reading. Team-covered periods are left out entirely -
	 * they need nobody to do anything - and counted in the summary instead.
	 */
	function buildPlanMessage() {
		const plan = planFor();
		const totals = plan.totals;

		const entries = [];
		plan.groups.forEach(group => group.rows.forEach(row => {
			if (row.status === 'team') return;
			entries.push({
				period: String(row.periodIndex + 1),
				className: slotClassLabel(row, true),
				subject: Data.shortSubject(row.subject),
				cover: messageCover(row),
				periodIndex: row.periodIndex
			});
		}));
		entries.sort((a, b) => a.periodIndex - b.periodIndex || a.className.localeCompare(b.className));

		const head = {
			period: t('msg.colPeriod'),
			className: t('msg.colClass'),
			subject: t('msg.colSubject'),
			cover: t('msg.colCover')
		};
		const width = key => Math.max(head[key].length, ...entries.map(entry => entry[key].length));
		const widths = {
			period: width('period'),
			className: width('className'),
			subject: width('subject')
		};
		const row = item => (
			padCell(item.period, widths.period) + '  ' +
			padCell(item.className, widths.className) + '  ' +
			padCell(item.subject, widths.subject) + '  ' +
			item.cover
		).replace(/\s+$/, '');

		const lines = [];
		lines.push('🏫 *' + t('app.short') + ' · ' + t('msg.title') + '* — ' + shortDate(dateForDay(state.subsDay)));
		lines.push('');

		if (entries.length) {
			lines.push('```');
			lines.push(row(head));
			entries.forEach(entry => lines.push(row(entry)));
			lines.push('```');
			lines.push('');
		}

		const summary = [];
		if (totals.assigned) summary.push('✅ ' + t('msg.sumCovered', { n: totals.assigned }));
		if (totals.review) summary.push('⚠️ ' + t('msg.sumCheck', { n: totals.review }));
		if (totals.combined) summary.push('🔗 ' + t('msg.sumCombined', { n: totals.combined }));
		if (totals.selfstudy) summary.push('📖 ' + t('msg.sumSelfStudy', { n: totals.selfstudy }));
		if (totals.open) summary.push('📌 ' + t('msg.sumHeld', { n: totals.open }));
		if (totals.team) summary.push('👥 ' + t('msg.sumTeam', { n: totals.team }));
		lines.push(summary.join(' · '));

		return lines.join('\n');
	}

	/** The cover column: a name, or the short reason there is not one. */
	function messageCover(row) {
		if (row.status === 'combined') {
			return '→ ' + classLabel(row.combinedInto.className, true) + ' · ' + row.combinedInto.teacher;
		}
		if (row.status === 'selfstudy') return t('msg.shortSelfStudy');
		if (row.status === 'open') return t('msg.shortHeld');
		if (row.status === 'review') return row.cover + ' ?';
		return row.cover;
	}

	function shareCurrent(action) {
		const db = state.db;
		if (action === 'share-my-day') {
			const day = today() || 'Monday';
			shareText(state.me + ' — ' + dayLabel(day) + ' (VPPS)',
				scheduleLines(db.teacherMap[state.me][day], state.me));
		} else if (action === 'share-teacher') {
			shareText(state.selTeacher + ' — ' + dayLabel(state.selDay) + ' (VPPS)',
				scheduleLines(db.teacherMap[state.selTeacher][state.selDay], state.selTeacher));
		} else if (action === 'share-class') {
			shareText(classLabel(state.selClass) + ' — ' + dayLabel(state.selDay) + ' (VPPS)',
				db.timetable[state.selDay][state.selClass].map((cell, index) =>
					periodName(index) + ' ' + PERIODS[index].label + ': ' +
					(cell.free ? t('ui.freeShort') : cell.subject + ' (' + cell.teachers.join(' / ') + ')')));
		} else if (action === 'share-plan') {
			shareRaw(buildPlanMessage());
		} else if (action === 'share-whatsapp') {
			openWhatsApp(buildPlanMessage());
		}
	}

	/* ------------------------------------------------------------------ *
	 * Render + events
	 * ------------------------------------------------------------------ */

	function renderNav() {
		document.getElementById('app-nav').innerHTML = VIEWS.map(view =>
			'<button type="button" class="app-nav__button' + (state.view === view ? ' is-active' : '') + '" ' +
			'data-action="go" data-value="' + view + '"' +
			(state.view === view ? ' aria-current="page"' : '') + '>' +
			icon(NAV_ICONS[view], 21) +
			'<span class="app-nav__label">' + esc(t(NAV_LABELS[view])) + '</span>' +
			'</button>').join('');
	}

	function render() {
		if (!state.db) return;
		renderHeader();
		renderNav();

		// The 30-second tick re-serialises all of <main>, which would otherwise
		// throw away wherever the reader had scrolled a wide table to.
		const main = document.getElementById('app-main');
		const previous = main.querySelector('.grid-wrap');
		const scrollLeft = previous ? previous.scrollLeft : 0;

		let html = '';
		if (state.view === 'home') html = renderHome();
		else if (state.view === 'now') html = renderBoard();
		else if (state.view === 'class') html = renderClassView();
		else if (state.view === 'teacher') html = renderTeacherView();
		else if (state.view === 'subs') html = renderSubs();

		main.innerHTML = html;

		const next = main.querySelector('.grid-wrap');
		if (next && scrollLeft) next.scrollLeft = scrollLeft;
	}

	/* ------------------------------------------------------------------ *
	 * Persistence - this device first, the school database as a mirror
	 * ------------------------------------------------------------------ */

	/** 'live' or 'test' - which database this build is pointed at. */
	function syncEnvironment() {
		return (window.VPPS_CONFIG && window.VPPS_CONFIG.environment) || 'live';
	}

	function syncPill() {
		const configured = Boolean(Sync && Sync.isConfigured());
		const status = configured ? Sync.status() : 'unconfigured';

		// On staging, say so instead of reporting success. Somebody has to be
		// able to tell at a glance that this is not the plan the staff read.
		if (configured && syncEnvironment() === 'test') {
			return '<span class="sync-pill sync-pill--test">' + esc(t('sync.test')) + '</span>';
		}

		const key = status === 'ok' ? 'sync.ok' : (status === 'unconfigured' ? 'sync.off' : 'sync.offline');
		const tone = status === 'ok' ? 'ok' : (status === 'error' ? 'warn' : 'quiet');
		return '<span class="sync-pill sync-pill--' + tone + '">' + esc(t(key)) + '</span>';
	}

	/** A full-day teacher is simply absent from the map. */
	function pruneShifts(shifts) {
		const pruned = {};
		Object.keys(shifts).forEach(name => {
			if (!Engine.isFullDayShift(shifts[name], PERIOD_COUNT)) pruned[name] = shifts[name];
		});
		return pruned;
	}

	/**
	 * This device's copy, unless it predates the shipped shift policy.
	 *
	 * The stored set deliberately wins over the built-in default, so that the
	 * admin shift editor survives a refresh. The version stamp is what lets a
	 * shipped policy change through anyway: a blob written before the current
	 * SHIFT_POLICY_VERSION - including an unstamped one from before this
	 * envelope existed - is stale, and gives way to DEFAULT_SHIFTS once.
	 */
	function readShifts() {
		let stored = null;
		try { stored = JSON.parse(read(STORE.shifts) || 'null'); } catch (error) { stored = null; }
		const fresh = stored && Number(stored.policyVersion) >= Engine.SHIFT_POLICY_VERSION;
		const shifts = fresh ? stored.shifts : Engine.DEFAULT_SHIFTS;
		return pruneShifts(Engine.normalizeShifts(shifts || Engine.DEFAULT_SHIFTS, PERIOD_COUNT));
	}

	function writeShifts() {
		save(STORE.shifts, JSON.stringify({
			policyVersion: Engine.SHIFT_POLICY_VERSION,
			shifts: state.shifts
		}));
		if (!Sync || !Sync.isConfigured()) return;
		Sync.saveShifts(state.shifts, Engine.SHIFT_POLICY_VERSION)
			.catch(error => console.warn('VPPS: shift sync failed', error));
	}

	function saveGrid() {
		save(STORE.grid, JSON.stringify({
			now: state.gridNow,
			class: state.gridClass,
			teacher: state.gridTeacher,
			subs: state.gridSubs
		}));
	}

	/** Admin works from tables; a teacher keeps the phone list. */
	function setGridDefaults(wantsTables) {
		state.gridNow = wantsTables;
		state.gridClass = wantsTables;
		state.gridTeacher = wantsTables;
		state.gridSubs = wantsTables;
	}

	function planKey() {
		return isoDate(dateForDay(state.subsDay));
	}

	function dropPinsFor(absentTeacher) {
		const pins = {};
		Object.keys(state.pins).forEach(slotId => {
			if (slotId.split('|')[0] !== absentTeacher) pins[slotId] = state.pins[slotId];
		});
		state.pins = pins;
	}

	/** Would this manual choice be legal? Warnings are allowed, blocks are not. */
	function validatePick(slotId, teacher) {
		const plan = planFor();
		let target = null;
		let absentTeacher = '';
		plan.groups.forEach(group => group.rows.forEach(row => {
			if (row.slotId === slotId) { target = row; absentTeacher = group.title; }
		}));
		if (!target) return { canOverride: false, errors: ['unavailable'], warnings: [] };

		const taken = [];
		plan.groups.forEach(group => group.rows.forEach(other => {
			if (other.slotId !== slotId && other.coverTeacher) {
				taken.push({ slotId: other.slotId, teacher: other.coverTeacher, periodIndex: other.periodIndex });
			}
		}));

		return Engine.validateAssignment({
			day: state.subsDay,
			periodCount: PERIOD_COUNT,
			teacherProfiles: teacherProfiles(),
			absentTeachers: state.absent,
			assignments: taken,
			coverHistory: state.coverHistory,
			teacher: teacher,
			vacancy: {
				slotId: slotId,
				className: target.className,
				periodIndex: target.periodIndex,
				subject: target.subject,
				originalTeacher: absentTeacher
			}
		});
	}

	function loadStoredPlan() {
		const stored = state.planStore ? state.planStore.getPlan(planKey()) : null;
		state.absent = stored && Array.isArray(stored.absent)
			? stored.absent.filter(name => state.db.teacherNames.indexOf(name) !== -1)
			: [];
		state.pins = stored && stored.pins && typeof stored.pins === 'object' ? stored.pins : {};
	}

	/**
	 * Periods each teacher has covered inside the retention window, read from
	 * the saved plans on this device. Today's own plan is excluded: letting it
	 * count would make the ranking depend on its own output.
	 */
	function localCoverHistory(days) {
		const history = {};
		if (!state.planStore) return history;
		const plans = state.planStore.load().plans || {};
		const today = planKey();
		const cutoff = new Date();
		cutoff.setHours(0, 0, 0, 0);
		cutoff.setDate(cutoff.getDate() - days);

		Object.keys(plans).forEach(date => {
			if (date === today) return;
			const when = new Date(date + 'T00:00:00');
			if (Number.isNaN(when.getTime()) || when < cutoff) return;
			(plans[date].assignments || []).forEach(item => {
				const teacher = item.coverTeacher ||
					((item.status === 'assigned' || item.status === 'review') ? item.cover : null);
				if (!teacher) return;
				history[teacher] = (history[teacher] || 0) + 1;
			});
		});
		return history;
	}

	function persistPlan() {
		if (!state.planStore) return;
		const date = planKey();

		if (!state.absent.length) {
			state.planStore.removePlan(date);
			if (Sync && Sync.isConfigured()) {
				Sync.removePlan(date).catch(error => console.warn('VPPS: plan sync failed', error));
			}
			return;
		}

		const plan = planFor();
		const assignments = [];
		plan.groups.forEach(group => group.rows.forEach(row => assignments.push({
			slotId: row.slotId,
			absentTeacher: group.title,
			periodIndex: row.periodIndex,
			className: row.className,
			subject: row.subject,
			// `cover` is what a human reads and is translated; `coverTeacher`
			// is the machine-readable name the fairness history counts.
			cover: row.cover,
			coverTeacher: row.coverTeacher,
			status: row.status,
			source: row.pinned ? 'manual' : 'auto'
		})));

		const payload = {
			day: state.subsDay,
			scheduleVersion: SCHEDULE_VERSION,
			absent: state.absent.slice(),
			assignments: assignments,
			pins: Object.assign({}, state.pins)
		};
		state.planStore.savePlan(date, payload);
		if (Sync && Sync.isConfigured()) {
			Sync.savePlan(date, payload).catch(error => console.warn('VPPS: plan sync failed', error));
		}
	}

	/**
	 * Best-effort catch-up with the database: prune expired plans, adopt the
	 * shared shift timings, and pick up a plan someone else already made.
	 */
	function startSync() {
		if (!Sync || !Sync.isConfigured()) return;
		const redraw = () => { try { render(); } catch (error) { console.warn('VPPS: redraw failed', error); } };

		Sync.purgeOld().catch(() => { /* retention is housekeeping, never fatal */ });

		Sync.loadShifts().then(stored => {
			const shifts = (stored && stored.shifts) || {};
			const version = (stored && Number(stored.policyVersion)) || 0;
			// An empty table on first run, or a set written before the current
			// shift policy shipped: seed the database from the built-in default
			// rather than adopting an answer this release has superseded.
			if (!Object.keys(shifts).length || version < Engine.SHIFT_POLICY_VERSION) {
				state.shifts = pruneShifts(Engine.normalizeShifts(Engine.DEFAULT_SHIFTS, PERIOD_COUNT));
				writeShifts();
				planCache = null;
				redraw();
				return null;
			}
			state.shifts = pruneShifts(Engine.normalizeShifts(shifts, PERIOD_COUNT));
			save(STORE.shifts, JSON.stringify({
				policyVersion: version,
				shifts: state.shifts
			}));
			planCache = null;
			redraw();
			return null;
		}).catch(error => console.warn('VPPS: shift load failed', error));

		Sync.loadPlan(planKey()).then(plan => {
			if (!plan || !plan.absent || !plan.absent.length) return;
			if (state.absent.length) return; // never clobber what this device is editing
			state.absent = plan.absent.filter(name => state.db.teacherNames.indexOf(name) !== -1);
			if (plan.pins && typeof plan.pins === 'object') state.pins = plan.pins;
			planCache = null;
			redraw();
		}).catch(error => console.warn('VPPS: plan load failed', error));

		// The shared history beats this device's own: it sees cover arranged
		// from the office as well as from a phone.
		Sync.loadCoverHistory(HISTORY_DAYS, planKey()).then(history => {
			state.coverHistory = history || {};
			planCache = null;
			redraw();
		}).catch(error => console.warn('VPPS: cover history failed', error));
	}

	function setTheme(dark) {
		state.dark = dark;
		document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute('content', dark ? '#08111f' : '#f5f7fb');
	}

	const ACTIONS = {
		go(value) { state.view = VIEWS.indexOf(value) === -1 ? 'home' : value; },
		'sel-day'(value) { state.selDay = value; state.selPeriod = null; },
		'sel-period'(value) { state.selPeriod = Number(value); },
		'sel-class'(value) { state.selClass = value; save(STORE.selectedClass, value); },
		'sel-teacher'(value) { state.selTeacher = value; save(STORE.selectedTeacher, value); },
		'board-mode'(value) { state.gridNow = value === 'table'; saveGrid(); },
		'class-mode'(value) { state.gridClass = value === 'week'; saveGrid(); },
		'teacher-mode'(value) { state.gridTeacher = value === 'week'; saveGrid(); },
		'subs-mode'(value) { state.gridSubs = value === 'table'; saveGrid(); },
		'subs-day'(value) { state.subsDay = value; state.editSlot = null; loadStoredPlan(); },
		'toggle-absent'(value) {
			const at = state.absent.indexOf(value);
			if (at === -1) state.absent = state.absent.concat([value]);
			else {
				state.absent = state.absent.filter(name => name !== value);
				// Their periods are gone; the pins on them would be orphans.
				dropPinsFor(value);
			}
			state.editSlot = null;
			persistPlan();
		},
		'clear-absent'() { state.absent = []; state.pins = {}; state.editSlot = null; persistPlan(); },
		'edit-slot'(value) { state.editSlot = state.editSlot === value ? null : value; },
		'close-editor'() { state.editSlot = null; },
		'pick-cover'(value, target) {
			const teacher = target && target.dataset ? target.dataset.teacher : '';
			if (!teacher) return;
			const check = validatePick(value, teacher);
			// Blocked means impossible - already teaching, absent, off shift.
			// A warning is only a caution, and the coordinator outranks it.
			if (!check.canOverride) {
				showToast(check.errors.map(reason => t('error.' + reason)).join(' · '));
				return;
			}
			state.pins = Object.assign({}, state.pins, { [value]: teacher });
			state.editSlot = null;
			if (check.warnings.length) showToast(check.warnings.map(w => t('warning.' + w)).join(' · '));
			persistPlan();
		},
		'leave-open'(value) {
			state.pins = Object.assign({}, state.pins, { [value]: null });
			state.editSlot = null;
			persistPlan();
		},
		'combine-slot'(value, target) {
			const host = target && target.dataset ? target.dataset.host : '';
			if (!host) return;
			state.pins = Object.assign({}, state.pins, { [value]: { combineWith: host } });
			state.editSlot = null;
			persistPlan();
		},
		'unpin-slot'(value) {
			const pins = Object.assign({}, state.pins);
			delete pins[value];
			state.pins = pins;
			state.editSlot = null;
			persistPlan();
		},
		'clear-pins'() { state.pins = {}; state.editSlot = null; persistPlan(); },
		'shift-pick'(value) { state.shiftEditor = state.shiftEditor === value ? null : value; },
		'shift-toggle'(value) {
			const teacher = state.shiftEditor;
			if (!teacher) return;
			const index = Number(value);
			const current = Engine.shiftPeriods(shiftOf(teacher), PERIOD_COUNT);
			const next = current.indexOf(index) === -1
				? current.concat([index]).sort((a, b) => a - b)
				: current.filter(item => item !== index);
			// No periods at all is not a shift, it is an absence - keep one.
			if (!next.length) return;
			const shifts = Object.assign({}, state.shifts);
			shifts[teacher] = { allowedPeriodIndexes: next, note: (shiftOf(teacher) || {}).note || '' };
			state.shifts = pruneShifts(shifts);
			writeShifts();
		},
		'shift-full'() {
			if (!state.shiftEditor) return;
			const shifts = Object.assign({}, state.shifts);
			delete shifts[state.shiftEditor];
			state.shifts = shifts;
			writeShifts();
		},
		'start-picking'() { state.picking = true; },
		'cancel-picking'() { state.picking = false; },
		'choose-admin'() {
			state.role = 'admin';
			state.picking = false;
			save(STORE.role, 'admin');
			setGridDefaults(true);
			saveGrid();
		},
		'pick-me'(value) {
			state.role = 'teacher';
			state.me = value;
			state.picking = false;
			save(STORE.me, value);
			save(STORE.role, 'teacher');
			setGridDefaults(false);
			saveGrid();
		},
		'change-profile'() {
			state.role = null;
			state.me = '';
			state.picking = false;
			state.shiftEditor = null;
			save(STORE.me, null);
			save(STORE.role, null);
		}
	};

	function onClick(event) {
		const target = event.target.closest('[data-action]');
		if (!target) return;
		const action = target.dataset.action;
		const value = target.dataset.value;

		if (action.indexOf('share-') === 0) {
			shareCurrent(action);
			return;
		}
		if (!ACTIONS[action]) return;
		// Handlers get the element too: picking a cover needs both the slot
		// and the teacher, and data-value carries only one string.
		ACTIONS[action](value, target);
		render();
	}

	function start() {
		const db = Data.load();
		state.db = db;

		I18n.init();

		const savedTheme = read(STORE.theme);
		setTheme(savedTheme
			? savedTheme === 'dark'
			: window.matchMedia('(prefers-color-scheme: dark)').matches);

		const savedMe = read(STORE.me);
		const savedRole = read(STORE.role);
		if (savedMe && db.teacherNames.indexOf(savedMe) !== -1) {
			state.role = 'teacher';
			state.me = savedMe;
		} else if (savedRole === 'admin') {
			state.role = 'admin';
		}

		// Tables are the admin default, and an explicit choice outranks it.
		setGridDefaults(state.role === 'admin');
		let savedGrid = null;
		try { savedGrid = JSON.parse(read(STORE.grid) || 'null'); } catch (error) { savedGrid = null; }
		if (savedGrid) {
			state.gridNow = Boolean(savedGrid.now);
			state.gridClass = Boolean(savedGrid.class);
			state.gridTeacher = Boolean(savedGrid.teacher);
			state.gridSubs = Boolean(savedGrid.subs);
		}

		state.shifts = readShifts();

		const startDay = today() || 'Monday';
		state.selDay = startDay;
		state.subsDay = startDay;

		state.planStore = Engine.createPlanStore(null, { scheduleVersion: SCHEDULE_VERSION });
		loadStoredPlan();
		// Start from this device's own history so fairness works offline; the
		// shared history replaces it once the database answers.
		state.coverHistory = localCoverHistory(HISTORY_DAYS);

		const savedClass = read(STORE.selectedClass);
		state.selClass = savedClass && db.classNames.indexOf(savedClass) !== -1 ? savedClass : db.classNames[0];

		const savedTeacher = read(STORE.selectedTeacher);
		state.selTeacher = savedTeacher && db.teacherNames.indexOf(savedTeacher) !== -1
			? savedTeacher
			: db.teacherNames[0];

		document.body.addEventListener('click', onClick);

		document.getElementById('lang-toggle').addEventListener('click', () => {
			I18n.setLanguage(I18n.getLanguage() === 'hi' ? 'en' : 'hi');
			render();
		});

		document.getElementById('theme-toggle').addEventListener('click', () => {
			setTheme(!state.dark);
			save(STORE.theme, state.dark ? 'dark' : 'light');
			render();
		});

		render();
		document.getElementById('loader').hidden = true;

		// The database is a mirror, never a gate: the app is already usable.
		startSync();

		// Keeps the live period, clock and progress bar honest without a reload.
		tickTimer = setInterval(render, 30000);
	}

	function boot() {
		try {
			start();
		} catch (error) {
			console.error('VPPS: failed to start', error);
			const loader = document.getElementById('loader');
			if (loader) loader.hidden = true;
			const main = document.getElementById('app-main');
			if (main) {
				main.innerHTML = '<div class="empty-state">' +
					esc(I18n ? I18n.t('error.loadFailed') : 'The timetable could not be loaded.') + '</div>';
			}
		}
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
	else boot();
})();
