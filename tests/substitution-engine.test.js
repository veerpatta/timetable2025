const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../scripts/substitution.js');
const I18n = require('../scripts/i18n.js');

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

test('English and Hindi dictionaries expose the same complete interface keys', () => {
	const dictionaries = I18n.getDictionaries();
	assert.deepEqual(Object.keys(dictionaries.en).sort(), Object.keys(dictionaries.hi).sort());
	I18n.setLanguage('hi', { persist: false, emit: false });
	assert.equal(I18n.t('sub.selected', { count: 2 }), '2 चयनित');
	I18n.setLanguage('en', { persist: false, emit: false });
});
