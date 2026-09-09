const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../scripts/substitution.js');
const I18n = require('../scripts/i18n.js');
const Data = require('../scripts/data.js');

function schedule(periods = {}) {
	const result = Array(8).fill(null);
	Object.entries(periods).forEach(([index, value]) => { result[Number(index)] = value; });
	return { Monday: result };
}

function profileInput() {
	return {
		teacherDetails: {
			Asha: {
				subjects: new Set(['Physics', 'Science']),
				schedule: schedule({ 0: { subject: 'Physics', className: 'Class 11 Science' } })
			},
			Bela: {
				subjects: new Set(['Science']),
				schedule: schedule({ 3: { subject: 'Science', className: 'Class 9' } })
			},
			Charu: {
				subjects: new Set(['Sports']),
				schedule: schedule({})
			}
		},
		roster: ['Asha', 'Bela', 'Charu'],
		policyOverrides: {}
	};
}

function baseInput() {
	return {
		day: 'Monday',
		periodCount: 8,
		teacherProfiles: Engine.buildTeacherProfiles(profileInput()),
		absentTeachers: [],
		assignments: [],
		policy: { maxConsecutive: 3 }
	};
}

test('canonical subjects and profiles merge timetable experience with explicit policy', () => {
	const input = profileInput();
	input.policyOverrides.Charu = {
		canCover: ['Math'],
		gradeBands: ['primary'],
		availability: { allowedPeriodIndexes: [4, 5] },
		maxAutoSubstitutions: 1
	};
	const profiles = Engine.buildTeacherProfiles(input);
	assert.equal(Engine.canonicalSubject(' Mathematics '), 'maths');
	assert.equal(profiles.Charu.canCover.has('maths'), true);
	assert.equal(profiles.Charu.maxAutoSubstitutions, 1);
	assert.equal(profiles.Asha.grades.has(11), true);
});

test('the tier ladder runs class+subject, class, subject, approved, related, general', () => {
	const input = baseInput();

	// Asha teaches Physics to Class 11 Science: both the class and the subject.
	const physics = Engine.rankCandidates({
		...input,
		vacancy: { slotId: 'physics', periodIndex: 2, subject: 'Physics', className: 'Class 11 Science' }
	});
	assert.equal(physics[0].teacher, 'Asha');
	assert.equal(physics[0].matchTier, 'class_subject');
	assert.equal(physics[0].autoEligible, true);

	// Same class, a subject she does not teach: still the class she knows, and
	// still automatic - the timetable is the school's own evidence that she
	// works with these children.
	const biology = Engine.rankCandidates({
		...input,
		vacancy: { slotId: 'biology', periodIndex: 2, subject: 'Biology', className: 'Class 11 Science' }
	});
	const ashaOnBiology = biology.find(item => item.teacher === 'Asha');
	assert.equal(ashaOnBiology.matchTier, 'class');
	assert.equal(ashaOnBiology.autoEligible, true);
	assert.equal(ashaOnBiology.warnings.includes('class_not_subject'), true,
		'it is still flagged as a subject the cover does not teach');

	// A teacher with neither the class nor the subject stays a review-only
	// suggestion, exactly as before.
	const charuOnBiology = biology.find(item => item.teacher === 'Charu');
	assert.equal(charuOnBiology.matchTier, 'general');
	assert.equal(charuOnBiology.autoEligible, false);
});

test('a teacher who knows the class outranks an outside subject specialist', () => {
	// Bela takes Class 9 for Science. Asha is the Physics specialist but has
	// never stood in front of Class 9. For a Class 9 Physics vacancy the
	// children get the teacher they know.
	const input = baseInput();
	const ranked = Engine.rankCandidates({
		...input,
		vacancy: { slotId: 'c9physics', periodIndex: 5, subject: 'Physics', className: 'Class 9' }
	});
	const bela = ranked.find(item => item.teacher === 'Bela');
	const asha = ranked.find(item => item.teacher === 'Asha');

	assert.equal(bela.matchTier, 'class');
	assert.equal(asha.matchTier, 'exact');
	assert.equal(ranked[0].teacher, 'Bela', 'class familiarity leads the ranking');
	assert.ok(bela.score > asha.score);
	assert.equal(bela.autoEligible, true, 'and it can be assigned without review');
});

test('tier order survives the worst possible load, fatigue and history', () => {
	// The guarantee is arithmetic, not a hope: tier bases are spaced further
	// apart than twice the modifier clamp, so no combination of penalties can
	// lift one tier past another.
	Engine.TIER_ORDER.slice(1).forEach((worse, index) => {
		const better = Engine.TIER_ORDER[index];
		assert.equal(Engine.tierDominates(better, worse), true,
			better + ' must always outrank ' + worse);
	});

	// Demonstrated end to end: a class-familiar teacher buried under every
	// penalty the scorer can apply still beats a fresh subject specialist.
	const input = baseInput();
	const vacancy = { slotId: 'c9physics', periodIndex: 7, subject: 'Physics', className: 'Class 9' };
	const ranked = Engine.rankCandidates({
		...input,
		vacancy,
		assignments: [
			{ slotId: 'x', teacher: 'Bela', periodIndex: 4 },
			{ slotId: 'y', teacher: 'Bela', periodIndex: 5 },
			{ slotId: 'z', teacher: 'Bela', periodIndex: 6 }
		],
		coverHistory: { Bela: 50 }
	});
	assert.equal(ranked.find(item => item.teacher === 'Bela').score >
		ranked.find(item => item.teacher === 'Asha').score, true);
});

test('absent, regularly busy, unavailable, and already assigned teachers are blocked', () => {
	const input = baseInput();
	input.teacherProfiles.Charu.availability = { allowedPeriodIndexes: [4] };
	const absent = Engine.validateAssignment({
		...input,
		teacher: 'Bela',
		absentTeachers: ['Bela'],
		vacancy: { slotId: 'v1', periodIndex: 2, subject: 'Science', className: 'Class 9' }
	});
	assert.deepEqual(absent.errors, ['absent']);
	const busy = Engine.validateAssignment({
		...input,
		teacher: 'Asha',
		vacancy: { slotId: 'v2', periodIndex: 0, subject: 'Physics', className: 'Class 10' }
	});
	assert.equal(busy.errors.includes('regular_class'), true);
	const unavailable = Engine.validateAssignment({
		...input,
		teacher: 'Charu',
		vacancy: { slotId: 'v3', periodIndex: 2, subject: 'Sports', className: 'Class 7' }
	});
	assert.equal(unavailable.errors.includes('unavailable'), true);
	const doubleBooked = Engine.validateAssignment({
		...input,
		teacher: 'Bela',
		assignments: [{ slotId: 'other', teacher: 'Bela', periodIndex: 2 }],
		vacancy: { slotId: 'v4', periodIndex: 2, subject: 'Science', className: 'Class 8' }
	});
	assert.equal(doubleBooked.errors.includes('double_booked'), true);
});

test('whole-day matching preserves the scarce specialist and remains deterministic', () => {
	const input = baseInput();
	const vacancies = [
		{ slotId: 'science', periodIndex: 2, subject: 'Science', className: 'Class 9', originalTeacher: 'Absent 1' },
		{ slotId: 'physics', periodIndex: 2, subject: 'Physics', className: 'Class 11 Science', originalTeacher: 'Absent 2' }
	];
	const first = Engine.generatePlan({ ...input, vacancies });
	const second = Engine.generatePlan({ ...input, vacancies });
	assert.deepEqual(first, second);
	assert.equal(first.assignments.length, 2);
	assert.equal(first.assignments.find(item => item.slotId === 'physics').teacher, 'Asha');
	assert.equal(first.assignments.find(item => item.slotId === 'science').teacher, 'Bela');
	assert.equal(new Set(first.assignments.map(item => item.teacher)).size, 2);
});

test('generic fallback is suggested but not automatically assigned', () => {
	const input = baseInput();
	const result = Engine.generatePlan({
		...input,
		vacancies: [{ slotId: 'maths', periodIndex: 5, subject: 'Maths', className: 'Class 5', originalTeacher: 'Absent' }]
	});
	assert.equal(result.assignments.length, 0);
	assert.equal(result.reviewSuggestions.length, 1);
	assert.equal(result.reviewSuggestions[0].matchTier, 'general');
});

test('automatic assignments respect the two-substitution daily limit', () => {
	const input = baseInput();
	const result = Engine.generatePlan({
		...input,
		teacherProfiles: { Asha: input.teacherProfiles.Asha },
		vacancies: [
			{ slotId: 'a', periodIndex: 2, subject: 'Physics', className: 'Class 11 Science' },
			{ slotId: 'b', periodIndex: 4, subject: 'Physics', className: 'Class 11 Science' },
			{ slotId: 'c', periodIndex: 6, subject: 'Physics', className: 'Class 11 Science' }
		]
	});
	assert.equal(result.assignments.length, 2);
	assert.equal(result.reviewSuggestions.length, 1);
	const override = Engine.validateAssignment({
		...input,
		teacher: 'Asha',
		assignments: [
			{ slotId: 'a', teacher: 'Asha', periodIndex: 2 },
			{ slotId: 'b', teacher: 'Asha', periodIndex: 4 }
		],
		vacancy: { slotId: 'c', periodIndex: 6, subject: 'Physics', className: 'Class 11 Science' }
	});
	assert.equal(override.canOverride, true);
	assert.equal(override.warnings.includes('over_substitution_limit'), true);
});

/* ---------------------------------------------------------------------- *
 * Fatigue and load spreading
 * ---------------------------------------------------------------------- */

/** Two teachers, identical in every way the scorer can see. */
function twinsInput(scheduleA, scheduleB) {
	return {
		day: 'Monday',
		periodCount: 8,
		teacherProfiles: Engine.buildTeacherProfiles({
			teacherDetails: {
				Twin1: { subjects: new Set(['Sports']), schedule: scheduleA },
				Twin2: { subjects: new Set(['Sports']), schedule: scheduleB }
			},
			roster: ['Twin1', 'Twin2']
		}),
		absentTeachers: [],
		assignments: [],
		policy: { maxConsecutive: 3 }
	};
}

test('taking a teachers last free period is avoided', () => {
	const busy = subject => ({ subject, className: 'Class 7' });
	// Twin1 has one period left after covering; Twin2 would have none.
	const input = twinsInput(
		schedule({ 0: busy('Sports'), 1: busy('Sports'), 2: busy('Sports'), 3: busy('Sports'), 4: busy('Sports') }),
		schedule({ 0: busy('Sports'), 1: busy('Sports'), 2: busy('Sports'), 3: busy('Sports'), 4: busy('Sports'), 5: busy('Sports'), 6: busy('Sports') })
	);
	const ranked = Engine.rankCandidates({
		...input,
		vacancy: { slotId: 'v', periodIndex: 7, subject: 'Sports', className: 'Class 7' }
	});
	const one = ranked.find(item => item.teacher === 'Twin1');
	const none = ranked.find(item => item.teacher === 'Twin2');
	assert.equal(none.load.freeAfter, 0);
	assert.ok(one.load.freeAfter > 0);
	assert.ok(one.score > none.score, 'the teacher who keeps a free period ranks higher');
	assert.equal(ranked[0].teacher, 'Twin1');
});

test('a long consecutive run is penalised more steeply than a short one', () => {
	const busy = { subject: 'Sports', className: 'Class 7' };
	// Both teach four periods and both keep three free, so day load and free
	// time cancel out and only the shape of the day differs. Covering P5,
	// Twin1's period stands alone while Twin2's extends a block to four.
	const input = twinsInput(
		schedule({ 0: busy, 1: busy, 6: busy, 7: busy }),
		schedule({ 1: busy, 2: busy, 3: busy, 7: busy })
	);
	const ranked = Engine.rankCandidates({
		...input,
		vacancy: { slotId: 'v', periodIndex: 4, subject: 'Sports', className: 'Class 7' }
	});
	const short = ranked.find(item => item.teacher === 'Twin1');
	const long = ranked.find(item => item.teacher === 'Twin2');

	assert.equal(short.load.regular, long.load.regular, 'same amount of teaching');
	assert.equal(short.load.freeAfter, long.load.freeAfter, 'same free time left');
	assert.equal(short.load.consecutiveAfter, 2);
	assert.equal(long.load.consecutiveAfter, 4);
	assert.ok(short.score > long.score, 'only the unbroken run separates them');
	assert.equal(long.warnings.includes('excessive_consecutive'), true);
	assert.equal(ranked[0].teacher, 'Twin1');
});

test('two vacancies go to two teachers rather than both to one', () => {
	// Identical twins, two vacancies, and a per-teacher cap of 2 - so one
	// teacher *could* legally take both. The convex cost is what stops it.
	const input = twinsInput(schedule({}), schedule({}));
	const plan = Engine.generatePlan({
		...input,
		vacancies: [
			{ slotId: 'v1', periodIndex: 2, subject: 'Sports', className: 'Class 7' },
			{ slotId: 'v2', periodIndex: 5, subject: 'Sports', className: 'Class 7' }
		]
	});
	assert.equal(plan.assignments.length, 2);
	assert.equal(new Set(plan.assignments.map(item => item.teacher)).size, 2,
		'the load is shared instead of stacked on the higher-scoring teacher');
});

test('review suggestions never double-book one teacher in the same period', () => {
	// Two classes need cover in the same period and only Twin1 and Twin2 are
	// free. Suggestions used to be read off a matrix built before any of them
	// were made, so the top-ranked teacher was offered for both at once.
	const input = twinsInput(schedule({}), schedule({}));
	const plan = Engine.generatePlan({
		...input,
		vacancies: [
			{ slotId: 'a', periodIndex: 3, subject: 'History', className: 'Class 6' },
			{ slotId: 'b', periodIndex: 3, subject: 'History', className: 'Class 8' }
		]
	});
	const proposed = plan.assignments.concat(plan.reviewSuggestions);
	const inPeriod3 = proposed.filter(item => item.periodIndex === 3).map(item => item.teacher);
	assert.equal(new Set(inPeriod3).size, inPeriod3.length,
		'nobody is proposed for two classes at once: ' + inPeriod3.join(', '));
});

test('leftover periods spread across teachers instead of stacking on one', () => {
	// Four vacancies, nobody qualified, per-teacher auto cap of 2. All four
	// fall to the suggestion path - which must still share them out.
	const input = twinsInput(schedule({}), schedule({}));
	const plan = Engine.generatePlan({
		...input,
		vacancies: [0, 1, 2, 3].map(index => ({
			slotId: 'v' + index, periodIndex: index, subject: 'History', className: 'Class 6'
		}))
	});
	const proposed = plan.assignments.concat(plan.reviewSuggestions);
	assert.equal(proposed.length, 4);
	const perTeacher = {};
	proposed.forEach(item => { perTeacher[item.teacher] = (perTeacher[item.teacher] || 0) + 1; });
	assert.deepEqual(Object.values(perTeacher).sort(), [2, 2],
		'two teachers take two each, rather than one taking all four');
});

test('the daily cap outranks a better match when someone else is still free', () => {
	// Star teaches the class (top tier); Spare has no connection at all
	// (bottom tier). Four vacancies, a cap of two. Tier order would hand every
	// period to Star, so the cap has to be a rule rather than a score.
	const busy = { subject: 'History', className: 'Class 6' };
	const profiles = Engine.buildTeacherProfiles({
		teacherDetails: {
			Star: { subjects: new Set(), schedule: { Monday: [busy, null, null, null, null, null, null, null] } },
			Spare: { subjects: new Set(), schedule: { Monday: Array(8).fill(null) } }
		},
		roster: ['Star', 'Spare']
	});
	const plan = Engine.generatePlan({
		day: 'Monday',
		periodCount: 8,
		teacherProfiles: profiles,
		absentTeachers: [],
		policy: { maxConsecutive: 3 },
		vacancies: [1, 2, 3, 4].map(index => ({
			slotId: 'v' + index, periodIndex: index, subject: 'History', className: 'Class 6'
		}))
	});

	const proposed = plan.assignments.concat(plan.reviewSuggestions);
	const perTeacher = {};
	proposed.forEach(item => { perTeacher[item.teacher] = (perTeacher[item.teacher] || 0) + 1; });
	assert.equal(perTeacher.Star, 2, 'the better match still stops at the daily cap');
	assert.equal(perTeacher.Spare, 2, 'the rest go to whoever is still under it');
});

test('recent cover history pushes a teacher down the ranking', () => {
	const input = twinsInput(schedule({}), schedule({}));
	const ranked = Engine.rankCandidates({
		...input,
		vacancy: { slotId: 'v', periodIndex: 3, subject: 'Sports', className: 'Class 7' },
		coverHistory: { Twin1: 6 }
	});
	const busy = ranked.find(item => item.teacher === 'Twin1');
	const rested = ranked.find(item => item.teacher === 'Twin2');
	assert.equal(busy.recentCovers, 6);
	assert.equal(rested.recentCovers, 0);
	assert.ok(rested.score > busy.score, 'whoever covered least recently goes first');
	assert.equal(ranked[0].teacher, 'Twin2');
});

test('history debt is capped so a heavy fortnight is not a permanent demotion', () => {
	const input = twinsInput(schedule({}), schedule({}));
	const rank = history => Engine.rankCandidates({
		...input,
		vacancy: { slotId: 'v', periodIndex: 3, subject: 'Sports', className: 'Class 7' },
		coverHistory: { Twin1: history }
	}).find(item => item.teacher === 'Twin1').score;
	assert.equal(rank(40), rank(400), 'past the cap, more history changes nothing');
});

/* ---------------------------------------------------------------------- *
 * Combining two classes
 * ---------------------------------------------------------------------- */

test('classes may only combine within one grade of each other', () => {
	assert.equal(Engine.canCombine('Class 5', 'Class 6'), true, 'adjacent');
	assert.equal(Engine.canCombine('Class 5', 'Class 4'), true, 'adjacent the other way');
	assert.equal(Engine.canCombine('Class 11 Science', 'Class 11 Arts'), true, 'streams of one grade');
	assert.equal(Engine.canCombine('Class 1', 'Class 9'), false, 'six-year-olds do not join teenagers');
	assert.equal(Engine.canCombine('Class 5', 'Class 5'), false, 'a class cannot join itself');
	assert.equal(Engine.canCombine('Class 5', null), false);
});

test('the merge host is chosen, not just found', () => {
	const hosts = [
		{ className: 'Class 10', teacher: 'Far', substituted: false },
		{ className: 'Class 11 Arts', teacher: 'Covered', substituted: true },
		{ className: 'Class 11 Science', teacher: 'Own', substituted: false }
	];
	// Same grade wins over an adjacent one, and among same-grade hosts the
	// class that still has its own teacher wins over one already covered.
	const chosen = Engine.chooseMergeHost('Class 11 Commerce', hosts);
	assert.equal(chosen.className, 'Class 11 Science');

	// With only the covered same-grade host left, that is still better than
	// dragging the class down a year.
	const fallback = Engine.chooseMergeHost('Class 11 Commerce', [hosts[0], hosts[1]]);
	assert.equal(fallback.className, 'Class 11 Arts');
});

test('a class with no teacher can never host, and distance rules out the rest', () => {
	assert.equal(Engine.chooseMergeHost('Class 6', [
		{ className: 'Class 7', teacher: '', substituted: false },
		{ className: 'Class 7', teacher: null, substituted: false }
	]), null, 'a self-study class cannot take another class');

	assert.equal(Engine.chooseMergeHost('Class 2', [
		{ className: 'Class 9', teacher: 'Someone', substituted: false }
	]), null, 'too far apart, so no merge is offered at all');
});

test('host choice is deterministic', () => {
	const hosts = [
		{ className: 'Class 7', teacher: 'A', substituted: false },
		{ className: 'Class 5', teacher: 'B', substituted: false }
	];
	const first = Engine.chooseMergeHost('Class 6', hosts);
	const second = Engine.chooseMergeHost('Class 6', hosts.slice().reverse());
	assert.equal(first.className, second.className);
});

/* ---------------------------------------------------------------------- *
 * Reserve staff
 * ---------------------------------------------------------------------- */

/** One ordinary teacher and one admin, both free all day. */
function reserveInput() {
	return {
		day: 'Monday',
		periodCount: 8,
		teacherProfiles: Engine.buildTeacherProfiles({
			teacherDetails: {
				Regular: { subjects: new Set(), schedule: schedule({}) },
				'Director Mam': { subjects: new Set(), schedule: {} }
			},
			roster: ['Regular', 'Director Mam'],
			reserveStaff: ['Director Mam']
		}),
		absentTeachers: [],
		assignments: [],
		policy: { maxConsecutive: 3 }
	};
}

test('the app ships the three admin staff as reserve', () => {
	assert.deepEqual(Data.RESERVE_STAFF, ['Director Mam', 'Raj Sir', 'Gyan Sir']);
	const db = Data.load();
	db.reserveStaff.forEach(name => {
		assert.equal(db.teacherNames.includes(name), false, name + ' must stay out of the teaching roster');
		assert.equal(db.coverPool.includes(name), true, name + ' must be in the cover pool');
	});
	assert.equal(db.coverPool.length, db.teacherNames.length + db.reserveStaff.length);
});

test('reserve staff are offered to a coordinator but never ranked above a teacher', () => {
	const input = reserveInput();
	const ranked = Engine.rankCandidates({
		...input,
		vacancy: { slotId: 'v', periodIndex: 3, subject: 'Maths', className: 'Class 6' }
	});
	const director = ranked.find(item => item.teacher === 'Director Mam');

	assert.ok(director, 'still listed, so the sheet can offer her');
	assert.equal(director.reserve, true);
	assert.equal(director.matchTier, 'reserve');
	assert.equal(director.autoEligible, false);
	assert.equal(director.warnings.includes('reserve_staff'), true);
	assert.equal(ranked[ranked.length - 1].teacher, 'Director Mam', 'and ranked last');
});

test('reserve staff are not suggested even when every teacher is blocked', () => {
	// The trap: an admin has no timetable, so she reads as free in every
	// period. With the only teacher absent she would be the top non-blocked
	// candidate and get quietly proposed for the hardest period of the day.
	const input = reserveInput();
	const plan = Engine.generatePlan({
		...input,
		absentTeachers: ['Regular'],
		vacancies: [{ slotId: 'v', periodIndex: 3, subject: 'Maths', className: 'Class 6', originalTeacher: 'Regular' }]
	});

	const proposed = plan.assignments.concat(plan.reviewSuggestions);
	assert.deepEqual(proposed, [], 'nothing is proposed at all');
	assert.equal(plan.openSlots.length, 1, 'the period is reported open, for a human to decide');
});

test('a reserve pin is still honoured once a coordinator makes it', () => {
	const input = reserveInput();
	const check = Engine.validateAssignment({
		...input,
		teacher: 'Director Mam',
		vacancy: { slotId: 'v', periodIndex: 3, subject: 'Maths', className: 'Class 6' }
	});
	assert.equal(check.canOverride, true, 'asking her is allowed; volunteering her is not');
	assert.deepEqual(check.errors, []);
});

/* ---------------------------------------------------------------------- *
 * Shift timings
 * ---------------------------------------------------------------------- */

test('a shift can be written as a range or a list, and no entry means all day', () => {
	assert.deepEqual(Engine.shiftPeriods(null, 8), [0, 1, 2, 3, 4, 5, 6, 7]);
	assert.deepEqual(Engine.shiftPeriods({ fromPeriodIndex: 4 }, 8), [4, 5, 6, 7]);
	assert.deepEqual(Engine.shiftPeriods({ fromPeriodIndex: 2, toPeriodIndex: 4 }, 8), [2, 3, 4]);
	assert.deepEqual(Engine.shiftPeriods({ allowedPeriodIndexes: [5, 7] }, 8), [5, 7]);

	assert.equal(Engine.isFullDayShift(null, 8), true);
	assert.equal(Engine.isFullDayShift({ fromPeriodIndex: 0 }, 8), true);
	assert.equal(Engine.isFullDayShift({ fromPeriodIndex: 4 }, 8), false);

	const shifts = { Anjana: { fromPeriodIndex: 4 } };
	assert.equal(Engine.isOnShift(shifts, 'Anjana', 0, 8), false);
	assert.equal(Engine.isOnShift(shifts, 'Anjana', 4, 8), true);
	assert.equal(Engine.isOnShift(shifts, 'Bela', 0, 8), true, 'nobody else is restricted');
});

test('shifts normalise to one storage shape and only restricted staff become overrides', () => {
	const normalized = Engine.normalizeShifts({
		Anjana: { fromPeriodIndex: 4, note: 'Late shift' },
		Bela: { allowedPeriodIndexes: [0, 1, 2, 3, 4, 5, 6, 7] }
	}, 8);
	assert.deepEqual(normalized.Anjana, { allowedPeriodIndexes: [4, 5, 6, 7], note: 'Late shift' });
	assert.deepEqual(normalized.Bela.allowedPeriodIndexes, [0, 1, 2, 3, 4, 5, 6, 7]);

	const overrides = Engine.shiftsToPolicyOverrides(normalized, 8);
	assert.deepEqual(overrides.Anjana, { availability: { allowedPeriodIndexes: [4, 5, 6, 7] } });
	assert.equal('Bela' in overrides, false, 'a full-day teacher needs no override');
});

test('the built-in default matches the window Anjana actually teaches in', () => {
	assert.ok(Engine.DEFAULT_SHIFTS.Anjana, 'the part-time shift ships with the app');
	assert.deepEqual(Engine.shiftPeriods(Engine.DEFAULT_SHIFTS.Anjana, 8), [5, 6, 7]);

	// The number above is not a preference, it is a fact about the timetable:
	// v10 makes Anjana part-time on P6-P8. Deriving it here means a future
	// timetable that moves her fails this test instead of quietly handing her
	// cover duty before she is in the building.
	const db = Data.load();
	const taught = new Set();
	db.days.forEach(day => db.teacherMap.Anjana[day]
		.forEach((slot, index) => { if (slot) taught.add(index); }));
	assert.deepEqual(
		Array.from(taught).sort((a, b) => a - b),
		Engine.shiftPeriods(Engine.DEFAULT_SHIFTS.Anjana, 8),
		'the shipped shift is exactly the periods she appears in'
	);
});

test('a late-shift teacher is blocked before arrival and usable after it', () => {
	// Charu teaches nothing on Monday, so before this fix she was "free" all
	// day and the planner handed her cover from Period 1.
	const input = profileInput();
	input.policyOverrides = Engine.shiftsToPolicyOverrides({ Charu: { fromPeriodIndex: 4 } }, 8);
	const profiles = Engine.buildTeacherProfiles(input);
	const base = { day: 'Monday', periodCount: 8, teacherProfiles: profiles, absentTeachers: [], assignments: [] };

	[0, 1, 2, 3].forEach(periodIndex => {
		const early = Engine.rankCandidates({
			...base,
			vacancy: { slotId: 'early' + periodIndex, periodIndex, subject: 'Sports', className: 'Class 7' }
		}).find(item => item.teacher === 'Charu');
		assert.equal(early.blocked.includes('unavailable'), true, 'P' + (periodIndex + 1) + ' is before her shift');
		assert.equal(early.autoEligible, false);
	});

	const late = Engine.rankCandidates({
		...base,
		vacancy: { slotId: 'late', periodIndex: 5, subject: 'Sports', className: 'Class 7' }
	}).find(item => item.teacher === 'Charu');
	assert.deepEqual(late.blocked, [], 'inside her shift she is an ordinary candidate');
	assert.equal(late.autoEligible, true, 'and can be assigned her own subject');
});

test('allocation never places a shifted teacher before their shift starts', () => {
	const input = profileInput();
	input.policyOverrides = Engine.shiftsToPolicyOverrides({ Charu: { fromPeriodIndex: 4 } }, 8);
	const profiles = Engine.buildTeacherProfiles(input);

	const plan = Engine.generatePlan({
		day: 'Monday',
		periodCount: 8,
		teacherProfiles: profiles,
		absentTeachers: ['Asha'],
		existingAssignments: [],
		vacancies: [
			{ slotId: 'p1', periodIndex: 0, subject: 'Sports', className: 'Class 7' },
			{ slotId: 'p6', periodIndex: 5, subject: 'Sports', className: 'Class 7' }
		]
	});

	const proposed = plan.assignments.concat(plan.reviewSuggestions);
	assert.equal(proposed.some(item => item.periodIndex === 0 && item.teacher === 'Charu'), false,
		'Charu must not appear anywhere in Period 1 - not even as a suggestion');
	assert.equal(proposed.some(item => item.slotId === 'p1' && item.teacher === 'Bela'), true,
		'Period 1 falls to the teacher who is actually in school');
	assert.equal(plan.assignments.some(item => item.slotId === 'p6' && item.teacher === 'Charu'), true,
		'and she still covers Period 6, where she is in school and teaches the subject');
});

class MemoryStorage {
	constructor() { this.values = new Map(); }
	getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
	setItem(key, value) { this.values.set(key, String(value)); }
	removeItem(key) { this.values.delete(key); }
}

test('date-keyed plans persist, prune after 30 days, and recover from invalid data', () => {
	const storage = new MemoryStorage();
	const now = () => new Date('2026-07-10T09:00:00Z');
	let store = Engine.createPlanStore(storage, { scheduleVersion: 'v4', now });
	store.savePlan('2026-07-10', { weekday: 'Friday', absentTeachers: ['Asha'], assignments: [] });
	store.savePlan('2026-05-01', { weekday: 'Friday', absentTeachers: [], assignments: [] });
	assert.deepEqual(store.getPlan('2026-07-10').absentTeachers, ['Asha']);
	assert.equal(store.getPlan('2026-05-01'), null);
	storage.setItem(Engine.STORAGE_KEY, '{bad json');
	store = Engine.createPlanStore(storage, { scheduleVersion: 'v4', now });
	assert.deepEqual(store.load().plans, {});
});

test('schedule changes invalidate saved plans', () => {
	const storage = new MemoryStorage();
	const now = () => new Date('2026-07-10T09:00:00Z');
	Engine.createPlanStore(storage, { scheduleVersion: 'v4', now })
		.savePlan('2026-07-10', { absentTeachers: ['Asha'], assignments: [] });
	const changed = Engine.createPlanStore(storage, { scheduleVersion: 'v5', now }).load();
	assert.equal(changed.invalidated, true);
	assert.deepEqual(changed.plans, {});
});

test('practice bells apply through 15 August and the regular bells resume on the 16th', () => {
	const on = (year, month, day) => Data.scheduleFor(new Date(year, month - 1, day)).id;

	assert.equal(on(2026, 8, 7), 'practice');
	assert.equal(on(2026, 8, 15), 'practice', '15 August is the last practice day');
	assert.equal(on(2026, 8, 16), 'regular', 'regular bells must resume unaided on 16 August');
	assert.equal(on(2026, 9, 1), 'regular');
	assert.equal(on(2027, 1, 1), 'regular', 'the practice window must not reopen in a later year');

	// Late on the last practice day and a minute into the first regular one:
	// the switch is by calendar date, so the time of day must not matter.
	assert.equal(Data.scheduleFor(new Date(2026, 7, 15, 23, 59)).id, 'practice');
	assert.equal(Data.scheduleFor(new Date(2026, 7, 16, 0, 1)).id, 'regular');

	// The restored schedule is the real 2026-27 one, not a mutated copy.
	const regular = Data.SCHEDULES.regular;
	assert.equal(regular.periods.length, 8);
	assert.equal(regular.periods[0].label, '8:30 - 9:10 AM');
	assert.equal(regular.periods[7].label, '1:30 - 2:10 PM');
	assert.equal(regular.break.label, '11:10 - 11:30 AM');
	assert.equal(regular.break.kind, 'break');
	assert.equal(regular.zero, null, 'the zero period belongs to the practice bells only');
});

test('both bell schedules run 8:30 AM to 2:10 PM with no gaps or overlaps', () => {
	Object.values(Data.SCHEDULES).forEach(plan => {
		const blocks = plan.periods
			.concat([plan.break], plan.zero ? [plan.zero] : [])
			.sort((a, b) => a.s - b.s);

		assert.equal(blocks[0].s, 510, plan.id + ': first bell is 8:30 AM');
		assert.equal(blocks[blocks.length - 1].e, plan.close, plan.id + ': last block ends at dispersal');
		assert.equal(plan.close, 850, plan.id + ': dispersal stays 2:10 PM');
		assert.ok(plan.reporting < blocks[0].s, plan.id + ': reporting precedes the first bell');

		blocks.slice(1).forEach((block, index) => {
			assert.equal(block.s, blocks[index].e, plan.id + ': no gap or overlap before ' + block.label);
		});

		plan.periods.forEach((period, index) => {
			assert.equal(period.n, index + 1, plan.id + ': periods stay numbered 1-8 in order');
			assert.ok(period.e > period.s, plan.id + ': period ' + period.n + ' has positive length');
		});
	});
});

test('English and Hindi dictionaries expose the same complete interface keys', () => {
	const dictionaries = I18n.getDictionaries();
	assert.deepEqual(Object.keys(dictionaries.en).sort(), Object.keys(dictionaries.hi).sort());
	I18n.setLanguage('hi', { persist: false, emit: false });
	assert.equal(I18n.t('sub.selected', { count: 2 }), '2 चयनित');
	I18n.setLanguage('en', { persist: false, emit: false });
});

test('a parallel elective is not a co-taught block, and still needs a substitute', () => {
	// "Biology / Maths (Hemlata / Prateek)" is two lessons side by side, one
	// cohort each. Reading it as a shared block would record Hemlata's Biology
	// group as covered by Prateek, who is teaching Maths in the same room.
	const db = Data.load();
	const cell = db.timetable.Monday['Class 11 Science'][1];
	assert.equal(cell.subject, 'Biology / Maths', 'the class grid still shows both');
	assert.equal(cell.parallel, true);
	assert.deepEqual(cell.subjects, ['Biology', 'Maths']);

	const hemlata = db.teacherMap.Hemlata.Monday[1];
	const prateek = db.teacherMap.Prateek.Monday[1];
	assert.equal(hemlata.subject, 'Biology', 'each teacher owns their own subject');
	assert.equal(prateek.subject, 'Maths');
	assert.equal(hemlata.shared, false, 'a parallel elective is never team-covered');
	assert.equal(prateek.shared, false);
});

test('ELGA stays a shared block the rest of the primary team absorbs', () => {
	// The case the "shared" rule was written for: one activity, five teachers.
	const db = Data.load();
	const cell = db.timetable.Monday['Class 1'][2];
	assert.equal(cell.subject, 'ELGA');
	assert.equal(cell.parallel, undefined, 'one subject, many teachers - not parallel');
	assert.equal(cell.teachers.length, 5);
	assert.equal(db.teacherMap.Bindu.Monday[2].shared, true);
	assert.deepEqual(db.teacherMap.Bindu.Monday[2].alsoClassNames, [],
		'a shared block is one activity, not five simultaneous classes');
});

test('a combined senior period keeps every section it is taught to', () => {
	// 11 Science, Commerce and Arts sit together for Hindi. That is one room
	// and one cover teacher, so it stays one slot - but all three timetables
	// have to name it.
	const db = Data.load();
	const hindi = db.teacherMap.Jainendra.Monday[4];
	assert.equal(hindi.subject, 'Hindi');
	assert.equal(hindi.className, 'Class 11 Science');
	assert.deepEqual(hindi.alsoClassNames, ['Class 11 Commerce', 'Class 11 Arts']);

	// Economics runs across two sections rather than three, and one of them
	// carries it inside a parallel elective - it still groups.
	const economics = db.teacherMap.Prakash.Monday[1];
	assert.equal(economics.subject, 'Economics');
	assert.deepEqual(economics.alsoClassNames, ['Class 11 Arts']);

	// An ordinary single-section period groups with nothing.
	assert.deepEqual(db.teacherMap.Bindu.Monday[0].alsoClassNames, []);
});

test('the timetable is the roster the v10 PDFs describe', () => {
	const db = Data.load();
	assert.equal(db.days.length, 6);
	assert.equal(db.classNames.length, 16);
	assert.deepEqual(db.teacherNames, [
		'Anita', 'Anjana', 'Antima', 'Bindu', 'Hemlata', 'Jainendra', 'Kusum',
		'Maya', 'Mumal', 'Nathulal', 'Nidhika', 'Nishant', 'Prakash', 'Prateek',
		'Rashmita', 'Ravina', 'Roshan', 'SP', 'Toshit'
	]);

	// Every cell is taught: v10 leaves no section with a free period, so a
	// "Free" cell appearing again means a row lost a column.
	let cells = 0;
	db.days.forEach(day => db.classNames.forEach(className => {
		const row = db.timetable[day][className];
		assert.equal(row.length, 8, className + ' on ' + day + ' has eight periods');
		row.forEach(cell => {
			cells += 1;
			assert.equal(Boolean(cell.free), false, className + ' ' + day + ': unexpected free period');
			assert.ok(cell.teachers.length > 0, className + ' ' + day + ': a period with nobody teaching it');
		});
	}));
	assert.equal(cells, 768);
});

test('every teacher carries the weekly load their v10 page states', () => {
	// A combined period and an ELGA block each count once, which is what makes
	// these numbers comparable with the TeacherWise PDF headers.
	const db = Data.load();
	const expected = {
		Anita: 42, Anjana: 14, Antima: 41, Bindu: 42, Hemlata: 39, Jainendra: 42,
		Kusum: 41, Maya: 42, Mumal: 42, Nathulal: 37, Nidhika: 38, Nishant: 40,
		Prakash: 42, Prateek: 41, Rashmita: 37, Ravina: 42, Roshan: 42, SP: 24,
		Toshit: 42
	};
	const actual = {};
	db.teacherNames.forEach(teacher => {
		actual[teacher] = db.days.reduce((total, day) =>
			total + db.teacherMap[teacher][day].filter(Boolean).length, 0);
	});
	assert.deepEqual(actual, expected);
});
