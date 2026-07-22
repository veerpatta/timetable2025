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

	const PERIODS = Data.PERIODS;
	const PERIOD_COUNT = PERIODS.length;

	const STORE = {
		theme: 'vppsm_theme',
		me: 'vppsm_me',
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
		gridTeacher: false
	};

	let toastTimer = null;
	let tickTimer = null;

	/* ------------------------------------------------------------------ *
	 * Small helpers
	 * ------------------------------------------------------------------ */

	function t(key, params) { return I18n.t(key, params); }
	function dayLabel(day, short) { return I18n.dayLabel(day, short); }
	function classLabel(name, short) { return I18n.classLabel(name, short); }

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
			before: now < PERIODS[0].s,
			after: now >= Data.CLOSE_MIN,
			reporting: now >= Data.REPORTING_MIN && now < PERIODS[0].s,
			nextIndex: PERIODS.findIndex(p => now < p.s)
		};
	}

	/** Index of the period running right now, or -1 outside teaching time. */
	function livePeriod() {
		return today() ? liveInfo().index : -1;
	}

	function dayLoad(teacher, day) {
		return state.db.teacherMap[teacher][day].filter(Boolean).length;
	}

	function freeAt(day, periodIndex, exclude) {
		const skip = exclude || [];
		return state.db.teacherNames.filter(name =>
			skip.indexOf(name) === -1 && !state.db.teacherMap[name][day][periodIndex]);
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
	function periodCard(cell, periodIndex, isNow, subLead) {
		const period = PERIODS[periodIndex];
		const free = !cell || cell.free;
		const category = free ? 'default' : Data.categoryOf(cell.subject);
		const title = free ? t('ui.free') : cell.subject;
		const sub = period.label + (!free && subLead ? ' · ' + subLead : '');
		const classes = ['period-card'];
		if (isNow) classes.push('period-card--now');
		if (free) classes.push('period-card--free');

		return '<div class="' + classes.join(' ') + '">' +
			'<div class="period-card__bubble cat-' + category + '">' + esc(periodName(periodIndex)) + '</div>' +
			'<div class="period-card__body">' +
			'<div class="period-card__title">' + esc(title) + '</div>' +
			'<div class="period-card__sub">' + esc(sub) + '</div>' +
			'</div>' +
			(isNow ? nowBadge(t('ui.now')) : '') +
			'</div>';
	}

	function gridCell(cell, isLive, overrideSub) {
		const classes = 'grid__cell' + (isLive ? ' grid__cell--live' : '');
		if (!cell || cell.free) {
			return '<td class="' + classes + '"><div class="grid__subject text-default">—</div></td>';
		}
		const teachers = cell.teachers || [];
		const line = overrideSub != null
			? overrideSub
			: (teachers.length > 1 ? teachers[0] + ' +' + (teachers.length - 1) : (teachers[0] || ''));
		return '<td class="' + classes + '">' +
			'<div class="grid__subject text-' + Data.categoryOf(cell.subject) + '">' +
			esc(Data.shortSubject(cell.subject)) + '</div>' +
			'<div class="grid__teacher">' + esc(line) + '</div>' +
			'</td>';
	}

	function dayChips(selected, action) {
		return chipRow(state.db.days.map(day => ({
			label: dayLabel(day, true), value: day, action: action, active: selected === day
		})));
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
		else if (live.inBreak) { text = t('status.break'); dotClass = ' status-strip__dot--warn status-strip__dot--pulse'; }
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
			title = t('status.breakTitle');
			sub = t('hero.nextAfterBreak');
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
				schedule.map((slot, index) => periodCard(
					slot ? { subject: slot.subject, teachers: [] } : null,
					index,
					day === myDay && index === period,
					slot ? classLabel(slot.className) : ''
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
			segmented([
				{ label: t('ui.list'), value: 'list', action: 'board-mode', active: !state.gridNow },
				{ label: t('ui.table'), value: 'table', action: 'board-mode', active: state.gridNow }
			]) +
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
				return '<div class="board-row">' +
					'<div class="board-row__class">' + esc(classLabel(className, true)) + '</div>' +
					'<div class="board-row__rule rule-' + category + '"></div>' +
					'<div class="board-row__body">' +
					'<div class="board-row__subject' + (cell.free ? ' board-row__subject--free' : '') + '">' +
					esc(cell.free ? t('ui.freeShort') : cell.subject) + '</div>' +
					'<div class="board-row__teacher">' + esc(cell.teachers.join(' / ')) + '</div>' +
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
			html += '<div class="grid-wrap"><table class="grid"><thead><tr>' +
				'<th class="grid__head grid__head--corner">' + esc(t('ui.classCol')) + '</th>' +
				PERIODS.map((slot, index) => {
					const live = boardDay === day && index === period;
					return '<th class="grid__head' + (live ? ' grid__head--live' : '') + '">' +
						esc(periodName(index)) +
						'<div class="grid__head-time">' + esc(shortTime(slot.s)) + '</div></th>';
				}).join('') +
				'</tr></thead><tbody>' +
				db.classNames.map(className =>
					'<tr><th class="grid__rowlabel">' + esc(classLabel(className, true)) + '</th>' +
					db.timetable[boardDay][className].map((cell, index) =>
						gridCell(cell, boardDay === day && index === period)).join('') +
					'</tr>').join('') +
				'</tbody></table></div>';
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
			segmented([
				{ label: t('ui.day'), value: 'day', action: 'class-mode', active: !state.gridClass },
				{ label: t('ui.week'), value: 'week', action: 'class-mode', active: state.gridClass }
			]) +
			'</div>' +
			chipRow(db.classNames.map(name => ({
				label: classLabel(name, true), value: name, action: 'sel-class', active: state.selClass === name
			})));

		if (!state.gridClass) {
			html += dayChips(state.selDay, 'sel-day') +
				'<div class="period-list">' +
				db.timetable[state.selDay][state.selClass].map((cell, index) => periodCard(
					cell, index, state.selDay === day && index === period, cell.teachers.join(' / ')
				)).join('') +
				'</div>' +
				shareButton('share-class', t('home.shareDay'));
		} else {
			html += '<div class="slot-label">' + esc(classLabel(state.selClass) + ' · ' + t('ui.week')) + '</div>' +
				'<div class="grid-wrap"><table class="grid"><thead><tr>' +
				'<th class="grid__head grid__head--corner">' + esc(t('ui.periodShort')) + '</th>' +
				db.days.map(d => '<th class="grid__head' + (d === day ? ' grid__head--live' : '') + '">' +
					esc(dayLabel(d, true)) + '</th>').join('') +
				'</tr></thead><tbody>' +
				PERIODS.map((slot, index) =>
					'<tr><th class="grid__rowlabel">' + esc(periodName(index)) + '</th>' +
					db.days.map(d => gridCell(db.timetable[d][state.selClass][index], d === day && index === period)).join('') +
					'</tr>').join('') +
				'</tbody></table></div>';
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
			segmented([
				{ label: t('ui.day'), value: 'day', action: 'teacher-mode', active: !state.gridTeacher },
				{ label: t('ui.week'), value: 'week', action: 'teacher-mode', active: state.gridTeacher }
			]) +
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
				'<div class="period-list">' +
				schedule.map((slot, index) => periodCard(
					slot ? { subject: slot.subject, teachers: [] } : null,
					index,
					state.selDay === day && index === period,
					slot ? classLabel(slot.className) : ''
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
				'<div class="grid-wrap"><table class="grid"><thead><tr>' +
				'<th class="grid__head grid__head--corner">' + esc(t('ui.periodShort')) + '</th>' +
				db.days.map(d => '<th class="grid__head' + (d === day ? ' grid__head--live' : '') + '">' +
					esc(dayLabel(d, true)) + '</th>').join('') +
				'</tr></thead><tbody>' +
				PERIODS.map((slot, index) =>
					'<tr><th class="grid__rowlabel">' + esc(periodName(index)) + '</th>' +
					db.days.map(d => {
						const cell = db.teacherMap[state.selTeacher][d][index];
						return gridCell(
							cell ? { subject: cell.subject, teachers: [] } : null,
							d === day && index === period,
							cell ? classLabel(cell.className, true) : null
						);
					}).join('') +
					'</tr>').join('') +
				'</tbody></table></div>';
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
	function buildPlan() {
		const db = state.db;
		const day = state.subsDay;
		const absent = state.absent;
		const teacherDetails = {};

		db.teacherNames.forEach(name => {
			const schedule = {};
			db.days.forEach(d => {
				schedule[d] = db.teacherMap[name][d].map(slot =>
					slot ? { subject: slot.subject, className: slot.className } : null);
			});
			teacherDetails[name] = { subjects: new Set(), schedule };
		});

		const profiles = Engine.buildTeacherProfiles({ teacherDetails, roster: db.teacherNames });

		const vacancies = [];
		const teamCovered = {};
		absent.forEach(name => {
			db.teacherMap[name][day].forEach((slot, index) => {
				if (!slot) return;
				const cell = db.timetable[day][slot.className][index];
				const remaining = cell.teachers.filter(other => other !== name && absent.indexOf(other) === -1);
				const slotId = name + '|' + index;
				if (slot.shared && remaining.length) {
					teamCovered[slotId] = true;
					return;
				}
				vacancies.push({
					slotId, className: slot.className, periodIndex: index,
					subject: slot.subject, originalTeacher: name
				});
			});
		});

		let plan = { assignments: [], reviewSuggestions: [], openSlots: [] };
		if (vacancies.length) {
			plan = Engine.generatePlan({
				day, periodCount: PERIOD_COUNT, teacherProfiles: profiles,
				absentTeachers: absent, vacancies, existingAssignments: []
			});
		}

		// A named cover reads as covered; only a genuinely unstaffable period is
		// flagged. The engine's match tier is kept as the row's title so a
		// coordinator can still see how well qualified the suggestion is.
		const cover = {};
		plan.assignments.forEach(item => {
			cover[item.slotId] = { name: item.teacher, covered: true, note: t('sub.assigned') };
		});
		plan.reviewSuggestions.forEach(item => {
			cover[item.slotId] = {
				name: item.teacher,
				covered: true,
				note: item.reasonKey ? t(item.reasonKey) : t('sub.reviewRequired')
			};
		});
		plan.openSlots.forEach(item => {
			cover[item.slotId] = { name: t('ui.noFree'), covered: false, note: t('sub.noCandidates') };
		});

		return absent.map(name => {
			const rows = [];
			db.teacherMap[name][day].forEach((slot, index) => {
				if (!slot) return;
				const slotId = name + '|' + index;
				const result = teamCovered[slotId]
					? { name: t('ui.team'), covered: true, note: t('ui.team') }
					: (cover[slotId] || { name: t('ui.noFree'), covered: false, note: t('sub.noCandidates') });
				rows.push({
					period: periodName(index),
					time: PERIODS[index].label,
					what: classLabel(slot.className) + ' · ' + slot.subject,
					cover: result.name,
					note: result.note,
					review: !result.covered
				});
			});
			return { title: name, count: rows.length + ' ' + t('ui.periods'), rows };
		});
	}

	function renderSubs() {
		const db = state.db;
		let html = '<section class="view">' +
			'<h2 class="section-title">' + esc(t('subs.title')) + '</h2>' +
			'<div class="section-note">' + esc(t('subs.sub')) + '</div>' +
			dayChips(state.subsDay, 'subs-day') +
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

		const groups = buildPlan();
		html += '<div class="plan-stack">' +
			groups.map(group =>
				'<div class="plan-group">' +
				'<div class="plan-group__head">' +
				'<div class="plan-group__title">' + esc(group.title) + '</div>' +
				'<div class="plan-group__count">' + esc(group.count) + '</div>' +
				'</div>' +
				group.rows.map(row =>
					'<div class="plan-row">' +
					'<div class="plan-row__period">' + esc(row.period) + '</div>' +
					'<div class="plan-row__body">' +
					'<div class="plan-row__what">' + esc(row.what) + '</div>' +
					'<div class="plan-row__time">' + esc(row.time) + '</div>' +
					'</div>' +
					'<div class="cover-pill' + (row.review ? ' cover-pill--review' : '') + '" ' +
					'title="' + esc(row.note) + '">' + esc(row.cover) + '</div>' +
					'</div>').join('') +
				'</div>').join('') +
			shareButton('share-plan', t('subs.share'), true) +
			'<button type="button" class="button-quiet" data-action="clear-absent">' + esc(t('subs.clear')) + '</button>' +
			'</div>';

		return html + '</section>';
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

	function shareText(title, lines) {
		const text = title + '\n' + lines.join('\n');
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

	function scheduleLines(schedule) {
		return schedule.map((slot, index) =>
			periodName(index) + ' ' + PERIODS[index].label + ': ' +
			(slot ? slot.subject + ' · ' + classLabel(slot.className) : t('ui.freeShort')));
	}

	function shareCurrent(action) {
		const db = state.db;
		if (action === 'share-my-day') {
			const day = today() || 'Monday';
			shareText(state.me + ' — ' + dayLabel(day) + ' (VPPS)', scheduleLines(db.teacherMap[state.me][day]));
		} else if (action === 'share-teacher') {
			shareText(state.selTeacher + ' — ' + dayLabel(state.selDay) + ' (VPPS)',
				scheduleLines(db.teacherMap[state.selTeacher][state.selDay]));
		} else if (action === 'share-class') {
			shareText(classLabel(state.selClass) + ' — ' + dayLabel(state.selDay) + ' (VPPS)',
				db.timetable[state.selDay][state.selClass].map((cell, index) =>
					periodName(index) + ' ' + PERIODS[index].label + ': ' +
					(cell.free ? t('ui.freeShort') : cell.subject + ' (' + cell.teachers.join(' / ') + ')')));
		} else if (action === 'share-plan') {
			const lines = [];
			buildPlan().forEach(group => {
				lines.push('— ' + group.title + ' —');
				group.rows.forEach(row => {
					lines.push(row.period + ' (' + row.time + '): ' + row.what + ' → ' + row.cover);
				});
			});
			shareText(t('subs.title') + ' · ' + dayLabel(state.subsDay) + ' (VPPS)', lines);
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

		let html = '';
		if (state.view === 'home') html = renderHome();
		else if (state.view === 'now') html = renderBoard();
		else if (state.view === 'class') html = renderClassView();
		else if (state.view === 'teacher') html = renderTeacherView();
		else if (state.view === 'subs') html = renderSubs();

		document.getElementById('app-main').innerHTML = html;
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
		'board-mode'(value) { state.gridNow = value === 'table'; },
		'class-mode'(value) { state.gridClass = value === 'week'; },
		'teacher-mode'(value) { state.gridTeacher = value === 'week'; },
		'subs-day'(value) { state.subsDay = value; state.absent = []; },
		'toggle-absent'(value) {
			const at = state.absent.indexOf(value);
			if (at === -1) state.absent = state.absent.concat([value]);
			else state.absent = state.absent.filter(name => name !== value);
		},
		'clear-absent'() { state.absent = []; },
		'start-picking'() { state.picking = true; },
		'cancel-picking'() { state.picking = false; },
		'choose-admin'() { state.role = 'admin'; state.picking = false; },
		'pick-me'(value) {
			state.role = 'teacher';
			state.me = value;
			state.picking = false;
			save(STORE.me, value);
		},
		'change-profile'() {
			state.role = null;
			state.me = '';
			state.picking = false;
			save(STORE.me, null);
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
		ACTIONS[action](value);
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
		if (savedMe && db.teacherNames.indexOf(savedMe) !== -1) {
			state.role = 'teacher';
			state.me = savedMe;
		}

		const startDay = today() || 'Monday';
		state.selDay = startDay;
		state.subsDay = startDay;

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
