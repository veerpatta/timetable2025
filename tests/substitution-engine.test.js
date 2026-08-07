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

test('exact or explicitly approved subjects are automatic; related and general matches require review', () => {
	const input = baseInput();
	const physics = Engine.rankCandidates({
		...input,
		vacancy: { slotId: 'physics', periodIndex: 2, subject: 'Physics', className: 'Class 11 Science' }
	});
	assert.equal(physics[0].teacher, 'Asha');
	assert.equal(physics[0].matchTier, 'exact');
	assert.equal(physics[0].autoEligible, true);
	const biology = Engine.rankCandidates({
		...input,
		vacancy: { slotId: 'biology', periodIndex: 2, subject: 'Biology', className: 'Class 11 Science' }
	});
	assert.equal(biology.find(item => item.teacher === 'Asha').matchTier, 'related');
	assert.equal(biology.find(item => item.teacher === 'Asha').autoEligible, false);
	assert.equal(biology.find(item => item.teacher === 'Charu').matchTier, 'general');
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
