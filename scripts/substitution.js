(function initSubstitutionEngine(root, factory) {
	const api = factory();
	if (typeof module === 'object' && module.exports) module.exports = api;
	if (root) root.SubstitutionEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSubstitutionEngine() {
	'use strict';

	const STORAGE_KEY = 'vpps-substitution-plans-v1';
	const STORAGE_VERSION = 1;
	const DEFAULT_MAX_AUTO_SUBSTITUTIONS = 2;
	const DEFAULT_MAX_CONSECUTIVE = 3;
	const SUBJECT_ALIASES = {
		'mathematics': 'maths',
		'math': 'maths',
		'english': 'english compulsory',
		'computer science': 'ccs',
		'computers': 'ccs',
		'physical education': 'sports',
		'games': 'sports',
		'environmental studies': 'evs',
		'social studies': 'sst',
		'accounts': 'accountancy',
		'eng lit': 'english literature',
		'gs': 'general studies'
	};
	const SUBJECT_GROUPS = {
		english: ['english compulsory', 'english literature', 'elga'],
		science: ['science', 'physics', 'chemistry', 'biology', 'evs'],
		social: ['sst', 'history', 'geography', 'political science', 'civics', 'general studies'],
		commerce: ['accountancy', 'business studies', 'economics'],
		computing: ['ccs', 'robotics'],
		maths: ['maths'],
		hindi: ['hindi'],
		sanskrit: ['sanskrit'],
		sports: ['sports']
	};

	// A shift is a teacher's standing working window - not a one-off absence.
	// Anjana is part-time and is only in the building for P5-P8, so P1-P4 look
	// "free" in her timetable when in fact she has not arrived. Without this
	// the planner happily hands her cover duty before she gets there.
	//
	// Her window is availability, not teaching load: she teaches P6-P8 but is
	// on site from P5, so P5 is a period she can legitimately be asked to
	// cover. Everyone else works the full day and needs no entry here.
	const DEFAULT_SHIFTS = {
		Anjana: { fromPeriodIndex: 4, note: 'Part-time: Periods 5-8 only' }
	};

	/*
	 * Bumped whenever DEFAULT_SHIFTS changes.
	 *
	 * Shift timings are shared, editable state: they live in localStorage and
	 * in Neon, and on every load the stored copy wins over the built-in
	 * default - otherwise the admin shift editor would be undone by a refresh.
	 * That means a shipped policy change reaches nobody, because every device
	 * and the database already hold the previous answer.
	 *
	 * The version breaks that tie exactly once. A stored set stamped below the
	 * shipped version is stale by definition, so it is discarded in favour of
	 * DEFAULT_SHIFTS and written back at the new version; anything stamped at
	 * or above it is a deliberate edit and is left alone.
	 */
	const SHIFT_POLICY_VERSION = 2;

	/*
	 * Ranking policy, in one place.
	 *
	 * The tiers are ordered by how useful the cover actually is to the class,
	 * and school policy is that familiarity with the class comes first: a
	 * teacher those children already know can hold a useful lesson, where a
	 * stranger with the right subject often cannot.
	 *
	 * "First" here is arithmetic, not aspiration. Tier bases are spaced
	 * TIER_GAP apart and every other signal is clamped to +/- MODIFIER_CAP,
	 * with MODIFIER_CAP < TIER_GAP / 2. No combination of fatigue, repetition
	 * and history can therefore lift one tier above another - the score stays
	 * a single scalar for the min-cost flow while ordering lexicographically.
	 * `tierDominates()` is the executable statement of that invariant.
	 */
	const TIER_ORDER = ['class_subject', 'class', 'exact', 'approved', 'related', 'general', 'last_resort', 'reserve'];
	const TIER_GAP = 1500;
	const MODIFIER_CAP = 700;
	const TIER_SCORE = {
		class_subject: 15000,
		class: 13500,
		exact: 12000,
		approved: 10500,
		related: 5500,
		general: 4000,
		// Duty-holders: coordinators and exam in-charges. The free-teacher
		// chart stars them and says to use them "only if no one else is
		// free", so they sit below every ordinary candidate but above the
		// reserve - they are still teaching staff and still get suggested,
		// just last, and never without a coordinator confirming.
		last_resort: 2500,
		// Admin staff who can be asked, but are never volunteered. Bottom of
		// the ladder so they sort last by the ordinary rules rather than by a
		// special case bolted onto the sort.
		reserve: 1000
	};
	// Tiers the engine may assign without a coordinator confirming. `class`
	// qualifies on the school's own evidence: the timetable says this teacher
	// works with these children every week.
	const AUTO_TIERS = ['class_subject', 'class', 'exact', 'approved'];

	const WEIGHTS = {
		// Familiarity, inside a tier: eight periods a week beats one.
		classPeriod: 26,
		classPeriodMax: 210,
		sameGrade: 90,
		sameBand: 45,
		lightDay: 22,
		// Fatigue.
		consecutiveEach: 45,
		consecutiveOver: 210,
		lastFreePeriod: 620,
		nearlyFullDay: 150,
		// Repetition, today and over the retention window.
		repeatToday: 260,
		historyEach: 70,
		historyMax: 420,
		// Cost added to each successive cover in the flow. Below TIER_GAP, so
		// spreading reorders within a tier and never overrides familiarity.
		spreadStep: 600
	};

	function clamp(value, limit) {
		return Math.max(-limit, Math.min(limit, value));
	}

	function tierRank(tier) {
		const at = TIER_ORDER.indexOf(tier);
		return at === -1 ? TIER_ORDER.length : at;
	}

	/** True when `better` outranks `worse` on tier alone, whatever the load. */
	function tierDominates(better, worse) {
		return tierRank(better) < tierRank(worse) &&
			TIER_SCORE[better] - TIER_SCORE[worse] > 2 * MODIFIER_CAP;
	}

	function canonicalSubject(value) {
		const normalized = String(value || '')
			.toLowerCase()
			.replace(/\s+/g, ' ')
			.trim();
		return SUBJECT_ALIASES[normalized] || normalized;
	}

	function extractGrade(className) {
		const match = String(className || '').match(/(\d+)/);
		return match ? Number(match[1]) : null;
	}

	function gradeBand(grade) {
		if (!grade) return '';
		if (grade <= 5) return 'primary';
		if (grade <= 8) return 'middle';
		if (grade <= 10) return 'secondary';
		return 'senior';
	}

	function subjectGroup(subject) {
		const canonical = canonicalSubject(subject);
		return Object.keys(SUBJECT_GROUPS).find(group => SUBJECT_GROUPS[group].includes(canonical)) || '';
	}

	/**
	 * The period indexes a teacher is actually in school for. A shift may be
	 * expressed as an explicit list, or as a from/to range; no entry at all
	 * means the whole day.
	 */
	function shiftPeriods(shift, periodCount) {
		const count = periodCount || 8;
		const all = Array.from({ length: count }, (_, index) => index);
		if (!shift) return all;
		if (Array.isArray(shift.allowedPeriodIndexes)) {
			return all.filter(index => shift.allowedPeriodIndexes.indexOf(index) !== -1);
		}
		const from = Number.isFinite(shift.fromPeriodIndex) ? shift.fromPeriodIndex : 0;
		const to = Number.isFinite(shift.toPeriodIndex) ? shift.toPeriodIndex : count - 1;
		return all.filter(index => index >= from && index <= to);
	}

	function isFullDayShift(shift, periodCount) {
		return shiftPeriods(shift, periodCount).length === (periodCount || 8);
	}

	/** Is this teacher in the building for this period? */
	function isOnShift(shifts, teacher, periodIndex, periodCount) {
		const shift = shifts && shifts[teacher];
		if (!shift) return true;
		return shiftPeriods(shift, periodCount).indexOf(Number(periodIndex)) !== -1;
	}

	/** One canonical storage shape, whatever the caller wrote. */
	function normalizeShifts(shifts, periodCount) {
		const normalized = {};
		Object.keys(shifts || {}).forEach(teacher => {
			const shift = shifts[teacher] || {};
			normalized[teacher] = {
				allowedPeriodIndexes: shiftPeriods(shift, periodCount),
				note: shift.note || ''
			};
		});
		return normalized;
	}

	/**
	 * Shifts expressed as the `policyOverrides` shape `buildTeacherProfiles`
	 * already understands, so `isAvailableByPolicy` does the enforcing.
	 * Full-day teachers are omitted - an override with no restriction is noise.
	 */
	function shiftsToPolicyOverrides(shifts, periodCount) {
		const overrides = {};
		Object.keys(shifts || {}).forEach(teacher => {
			const shift = shifts[teacher];
			if (isFullDayShift(shift, periodCount)) return;
			overrides[teacher] = {
				availability: { allowedPeriodIndexes: shiftPeriods(shift, periodCount) }
			};
		});
		return overrides;
	}

	/*
	 * Combining two classes under one teacher.
	 *
	 * When nobody is free, a school does not leave thirty children alone - it
	 * sends them next door. `MAX_GRADE_GAP` of 1 keeps that sensible: Class 5
	 * may join Class 4 or 6, and the three Class 11 streams may join each
	 * other, but Class 1 never joins Class 9.
	 *
	 * On the real timetable roughly three hosts qualify for any given period,
	 * so finding one is easy and *choosing well* is the whole job. Hence the
	 * ranking below, and hence this being a suggestion rather than an action:
	 * every merge costs the host class part of its lesson.
	 */
	const MAX_GRADE_GAP = 1;

	function canCombine(classA, classB) {
		if (!classA || !classB || classA === classB) return false;
		const a = extractGrade(classA);
		const b = extractGrade(classB);
		if (a == null || b == null) return false;
		return Math.abs(a - b) <= MAX_GRADE_GAP;
	}

	/**
	 * Pick the class a stranded period should join.
	 *
	 * `hosts` is every class still being taught this period, as
	 * `{ className, teacher, substituted }`. Same grade first, then a class
	 * with its own teacher over one already being covered - handing a
	 * substitute a second room is how a plan starts falling over.
	 */
	function chooseMergeHost(className, hosts) {
		const grade = extractGrade(className);
		return (hosts || [])
			.filter(host => host && host.teacher && canCombine(className, host.className))
			.slice()
			.sort((a, b) => {
				const sameA = extractGrade(a.className) === grade ? 0 : 1;
				const sameB = extractGrade(b.className) === grade ? 0 : 1;
				if (sameA !== sameB) return sameA - sameB;
				const subA = a.substituted ? 1 : 0;
				const subB = b.substituted ? 1 : 0;
				if (subA !== subB) return subA - subB;
				return String(a.className).localeCompare(String(b.className));
			})[0] || null;
	}

	function toArray(value) {
		if (!value) return [];
		if (value instanceof Set) return Array.from(value);
		return Array.isArray(value) ? value : [value];
	}

	function normalizeAssignmentList(assignments) {
		if (!assignments) return [];
		if (Array.isArray(assignments)) return assignments.filter(Boolean);
		return Object.keys(assignments).map(slotId => ({ slotId, ...assignments[slotId] })).filter(Boolean);
	}

	function buildTeacherProfiles(input) {
		const teacherDetails = input?.teacherDetails || {};
		const roster = input?.roster || Object.keys(teacherDetails);
		const overrides = input?.policyOverrides || {};
		const reserve = new Set(toArray(input?.reserveStaff));
		const dutyHolders = new Set(toArray(input?.dutyStaff));
		const profiles = {};

		roster.slice().sort((a, b) => a.localeCompare(b)).forEach(teacher => {
			const data = teacherDetails[teacher] || {};
			const override = overrides[teacher] || {};
			const subjects = new Set(toArray(data.subjects).map(canonicalSubject).filter(Boolean));
			const grades = new Set();
			// Which classes this teacher actually stands in front of, and how
			// often. `grades` only ever kept the grade number, so "teaches
			// Class 5" and "teaches some other Class 5 stream" were the same
			// thing to the scorer, and "teaches this class" was unknowable.
			const classLoad = {};
			const classSubjects = {};
			Object.values(data.schedule || {}).forEach(daySchedule => {
				(daySchedule || []).forEach(period => {
					if (!period) return;
					if (period.subject) subjects.add(canonicalSubject(period.subject));
					const grade = extractGrade(period.className);
					if (grade) grades.add(grade);
					if (period.className) {
						classLoad[period.className] = (classLoad[period.className] || 0) + 1;
						if (!classSubjects[period.className]) classSubjects[period.className] = new Set();
						if (period.subject) classSubjects[period.className].add(canonicalSubject(period.subject));
					}
				});
			});
			toArray(override.canTeach).forEach(subject => subjects.add(canonicalSubject(subject)));

			profiles[teacher] = {
				teacher,
				// Can be asked by a coordinator; never proposed by the planner.
				reserve: reserve.has(teacher),
				// Proposed by the planner, but only after everyone else.
				// Reserve wins the flag if somebody is somehow on both lists:
				// "never automatic" is the stricter promise of the two.
				lastResort: !reserve.has(teacher) && dutyHolders.has(teacher),
				subjects,
				canCover: new Set(toArray(override.canCover).map(canonicalSubject).filter(Boolean)),
				grades,
				classLoad,
				classSubjects,
				gradeBands: new Set([
					...Array.from(grades).map(gradeBand),
					...toArray(override.gradeBands)
				].filter(Boolean)),
				schedule: data.schedule || {},
				availability: override.availability || null,
				maxAutoSubstitutions: Number.isFinite(override.maxAutoSubstitutions)
					? override.maxAutoSubstitutions
					: DEFAULT_MAX_AUTO_SUBSTITUTIONS
			};
		});

		return profiles;
	}

	function isAvailableByPolicy(profile, periodIndex) {
		const availability = profile?.availability;
		if (!availability) return true;
		if (Array.isArray(availability.allowedPeriodIndexes)) {
			return availability.allowedPeriodIndexes.includes(periodIndex);
		}
		if (Array.isArray(availability.blockedPeriodIndexes)) {
			return !availability.blockedPeriodIndexes.includes(periodIndex);
		}
		return true;
	}

	function countTeacherAssignments(teacher, assignments) {
		return normalizeAssignmentList(assignments).filter(item => item.teacher === teacher).length;
	}

	function isTeacherAssignedInPeriod(teacher, periodIndex, assignments, excludedSlotId) {
		return normalizeAssignmentList(assignments).some(item => (
			item.teacher === teacher &&
			Number(item.periodIndex) === Number(periodIndex) &&
			item.slotId !== excludedSlotId
		));
	}

	function getRegularBusyPeriods(profile, day, periodCount) {
		const schedule = profile?.schedule?.[day] || [];
		return Array.from({ length: periodCount }, (_, index) => Boolean(schedule[index]));
	}

	function longestConsecutiveRun(flags) {
		let longest = 0;
		let current = 0;
		flags.forEach(flag => {
			current = flag ? current + 1 : 0;
			longest = Math.max(longest, current);
		});
		return longest;
	}

	function getLoadFacts(profile, day, periodIndex, assignments, periodCount, slotId) {
		const regular = getRegularBusyPeriods(profile, day, periodCount);
		const planned = Array(periodCount).fill(false);
		normalizeAssignmentList(assignments).forEach(item => {
			if (item.teacher === profile.teacher && item.slotId !== slotId && Number.isFinite(Number(item.periodIndex))) {
				planned[Number(item.periodIndex)] = true;
			}
		});
		const substitutions = planned.filter(Boolean).length;
		const before = regular.map((busy, index) => busy || planned[index]);
		const after = before.slice();
		after[periodIndex] = true;
		const totalAfter = after.filter(Boolean).length;
		return {
			regular: regular.filter(Boolean).length,
			substitutions,
			totalAfter,
			// Free periods left once this cover is taken. Preparation and
			// marking time is real: taking the last one is not the same as
			// taking one of four.
			freeAfter: Math.max(0, periodCount - totalAfter),
			consecutiveBefore: longestConsecutiveRun(before),
			consecutiveAfter: longestConsecutiveRun(after)
		};
	}

	function candidateForTeacher(input, teacher) {
		const profile = input.teacherProfiles?.[teacher];
		const vacancy = input.vacancy || {};
		const periodIndex = Number(vacancy.periodIndex);
		const periodCount = input.periodCount || 8;
		const assignments = input.assignments || [];
		const absentTeachers = input.absentTeachers || [];
		const blocked = [];
		const warnings = [];
		if (!profile) return null;
		if (absentTeachers.includes(teacher)) blocked.push('absent');
		if (profile.schedule?.[input.day]?.[periodIndex]) blocked.push('regular_class');
		if (isTeacherAssignedInPeriod(teacher, periodIndex, assignments, vacancy.slotId)) blocked.push('double_booked');
		if (!isAvailableByPolicy(profile, periodIndex)) blocked.push('unavailable');

		const targetSubject = canonicalSubject(vacancy.subject);
		const className = vacancy.className;
		const classPeriods = (className && profile.classLoad?.[className]) || 0;
		const teachesThisClass = classPeriods > 0;
		const teachesSubjectHere = Boolean(
			className && profile.classSubjects?.[className]?.has(targetSubject)
		);
		const teachesSubject = profile.subjects.has(targetSubject);

		// Familiarity with the class leads; subject qualification decides the
		// order among strangers to it. Reserve staff sit below all of it, and
		// duty-holders just above them.
		//
		// Neither climbs. A duty-holder who teaches the very class and
		// subject would otherwise rank top and be picked first, which is the
		// opposite of what the chart asks for - the star is about protecting
		// their coordinator time, not about what they are qualified to teach.
		let matchTier = profile.reserve ? 'reserve' : (profile.lastResort ? 'last_resort' : 'general');
		if (profile.reserve || profile.lastResort) { /* no tier climbing: their duties, not their subjects, set the rank */ }
		else if (teachesThisClass && (teachesSubjectHere || teachesSubject)) matchTier = 'class_subject';
		else if (teachesThisClass) matchTier = 'class';
		else if (teachesSubject) matchTier = 'exact';
		else if (profile.canCover.has(targetSubject)) matchTier = 'approved';
		else if (subjectGroup(targetSubject) &&
			Array.from(profile.subjects).some(subject => subjectGroup(subject) === subjectGroup(targetSubject))) {
			matchTier = 'related';
		}

		if (matchTier === 'reserve') warnings.push('reserve_staff');
		if (matchTier === 'last_resort') warnings.push('duty_holder');
		if (matchTier === 'class') warnings.push('class_not_subject');
		if (matchTier === 'related') warnings.push('related_subject');
		if (matchTier === 'general') warnings.push('subject_mismatch');
		const load = getLoadFacts(profile, input.day, periodIndex, assignments, periodCount, vacancy.slotId);
		if (load.substitutions >= profile.maxAutoSubstitutions) warnings.push('over_substitution_limit');
		if (load.totalAfter >= periodCount) warnings.push('full_day');
		const maxConsecutive = input.policy?.maxConsecutive || DEFAULT_MAX_CONSECUTIVE;
		if (load.consecutiveAfter > Math.max(maxConsecutive, load.consecutiveBefore)) warnings.push('excessive_consecutive');

		const grade = extractGrade(vacancy.className);
		const exactGrade = grade != null && profile.grades.has(grade);
		const sameBand = grade != null && profile.gradeBands.has(gradeBand(grade));
		const recentCovers = Number(input.coverHistory?.[teacher]) || 0;

		// Everything that is not the tier. Clamped, so it can only reorder
		// candidates inside a tier - see the note on TIER_SCORE.
		let modifiers = 0;
		modifiers += Math.min(classPeriods * WEIGHTS.classPeriod, WEIGHTS.classPeriodMax);
		if (exactGrade) modifiers += WEIGHTS.sameGrade;
		else if (sameBand) modifiers += WEIGHTS.sameBand;
		modifiers += Math.max(0, (periodCount - load.regular) * WEIGHTS.lightDay);
		modifiers -= load.consecutiveAfter * WEIGHTS.consecutiveEach;
		modifiers -= Math.max(0, load.consecutiveAfter - maxConsecutive) * WEIGHTS.consecutiveOver;
		if (load.freeAfter === 0) modifiers -= WEIGHTS.lastFreePeriod;
		else if (load.freeAfter === 1) modifiers -= WEIGHTS.nearlyFullDay;
		modifiers -= load.substitutions * WEIGHTS.repeatToday;
		modifiers -= Math.min(recentCovers * WEIGHTS.historyEach, WEIGHTS.historyMax);

		const score = TIER_SCORE[matchTier] + clamp(modifiers, MODIFIER_CAP);

		const autoEligible = blocked.length === 0 &&
			!profile.reserve &&
			// Stated here as well as by tier, so the promise survives anyone
			// later adding `last_resort` to AUTO_TIERS by mistake.
			!profile.lastResort &&
			AUTO_TIERS.indexOf(matchTier) !== -1 &&
			!warnings.includes('over_substitution_limit') &&
			!warnings.includes('full_day') &&
			!warnings.includes('excessive_consecutive');

		return {
			teacher,
			score,
			matchTier,
			autoEligible,
			reserve: Boolean(profile.reserve),
			lastResort: Boolean(profile.lastResort),
			blocked,
			warnings,
			load,
			grade,
			exactGrade,
			sameBand,
			classPeriods,
			recentCovers,
			reasonKey: `sub.${matchTier}`
		};
	}

	function rankCandidates(input) {
		return Object.keys(input.teacherProfiles || {})
			.map(teacher => candidateForTeacher(input, teacher))
			.filter(Boolean)
			.sort((a, b) => {
				if (a.blocked.length !== b.blocked.length) return a.blocked.length - b.blocked.length;
				if (a.autoEligible !== b.autoEligible) return a.autoEligible ? -1 : 1;
				if (b.score !== a.score) return b.score - a.score;
				return a.teacher.localeCompare(b.teacher);
			});
	}

	function addEdge(graph, from, to, capacity, cost, metadata) {
		const forward = { to, rev: graph[to].length, capacity, cost, metadata, initialCapacity: capacity };
		const reverse = { to: from, rev: graph[from].length, capacity: 0, cost: -cost, metadata: null, initialCapacity: 0 };
		graph[from].push(forward);
		graph[to].push(reverse);
		return forward;
	}

	function minCostMaximumFlow(graph, source, sink) {
		let flow = 0;
		let cost = 0;
		while (true) {
			const distance = Array(graph.length).fill(Infinity);
			const previousNode = Array(graph.length).fill(-1);
			const previousEdge = Array(graph.length).fill(-1);
			const inQueue = Array(graph.length).fill(false);
			const queue = [source];
			distance[source] = 0;
			inQueue[source] = true;
			while (queue.length) {
				const node = queue.shift();
				inQueue[node] = false;
				graph[node].forEach((edge, edgeIndex) => {
					if (edge.capacity <= 0) return;
					const nextDistance = distance[node] + edge.cost;
					if (nextDistance >= distance[edge.to]) return;
					distance[edge.to] = nextDistance;
					previousNode[edge.to] = node;
					previousEdge[edge.to] = edgeIndex;
					if (!inQueue[edge.to]) {
						queue.push(edge.to);
						inQueue[edge.to] = true;
					}
				});
			}
			if (!Number.isFinite(distance[sink])) break;
			let node = sink;
			while (node !== source) {
				const parent = previousNode[node];
				const edge = graph[parent][previousEdge[node]];
				edge.capacity -= 1;
				graph[node][edge.rev].capacity += 1;
				node = parent;
			}
			flow += 1;
			cost += distance[sink];
		}
		return { flow, cost };
	}

	function generatePlan(input) {
		const vacancies = (input.vacancies || []).map((vacancy, index) => ({
			...vacancy,
			slotId: vacancy.slotId || `${input.day}|${vacancy.className}|${vacancy.periodIndex}|${index}`
		}));
		const existingAssignments = normalizeAssignmentList(input.existingAssignments || input.assignments);
		const teacherProfiles = input.teacherProfiles || {};
		const teachers = Object.keys(teacherProfiles).sort((a, b) => a.localeCompare(b));
		const candidateMatrix = {};
		vacancies.forEach(vacancy => {
			candidateMatrix[vacancy.slotId] = rankCandidates({
				...input,
				vacancy,
				assignments: existingAssignments,
				teacherProfiles
			});
		});

		const source = 0;
		let nextNode = 1;
		const teacherNodes = {};
		const teacherPeriodNodes = {};
		teachers.forEach(teacher => {
			teacherNodes[teacher] = nextNode++;
			teacherPeriodNodes[teacher] = {};
			for (let period = 0; period < (input.periodCount || 8); period++) {
				teacherPeriodNodes[teacher][period] = nextNode++;
			}
		});
		const vacancyNodes = {};
		vacancies.forEach(vacancy => { vacancyNodes[vacancy.slotId] = nextNode++; });
		const sink = nextNode++;
		const graph = Array.from({ length: nextNode }, () => []);
		const assignmentEdges = [];

		teachers.forEach(teacher => {
			const profile = teacherProfiles[teacher];
			const used = countTeacherAssignments(teacher, existingAssignments);
			const capacity = Math.max(0, profile.maxAutoSubstitutions - used);
			// One unit-capacity edge per cover, each dearer than the last, so a
			// teacher's second period genuinely costs the optimiser more than
			// their first. A single edge of capacity 2 priced them the same,
			// which is why the load used to pile onto whoever scored highest.
			// The step sits below TIER_GAP: spreading reorders within a tier,
			// it never overrides class familiarity. Max flow is still
			// maximised first, so this never covers fewer periods.
			for (let unit = 0; unit < capacity; unit++) {
				addEdge(graph, source, teacherNodes[teacher], 1, (used + unit) * WEIGHTS.spreadStep);
			}
			for (let period = 0; period < (input.periodCount || 8); period++) {
				addEdge(graph, teacherNodes[teacher], teacherPeriodNodes[teacher][period], 1, 0);
			}
		});

		vacancies.forEach(vacancy => {
			addEdge(graph, vacancyNodes[vacancy.slotId], sink, 1, 0);
			candidateMatrix[vacancy.slotId]
				.filter(candidate => candidate.autoEligible)
				.forEach(candidate => {
					const edge = addEdge(
						graph,
						teacherPeriodNodes[candidate.teacher][vacancy.periodIndex],
						vacancyNodes[vacancy.slotId],
						1,
						-candidate.score,
						{ vacancy, candidate }
					);
					assignmentEdges.push(edge);
				});
		});

		const flowResult = minCostMaximumFlow(graph, source, sink);
		const generated = assignmentEdges
			.filter(edge => edge.initialCapacity === 1 && edge.capacity === 0)
			.map(edge => ({
				slotId: edge.metadata.vacancy.slotId,
				periodIndex: edge.metadata.vacancy.periodIndex,
				className: edge.metadata.vacancy.className,
				subject: edge.metadata.vacancy.subject,
				originalTeacher: edge.metadata.vacancy.originalTeacher,
				teacher: edge.metadata.candidate.teacher,
				matchTier: edge.metadata.candidate.matchTier,
				warnings: edge.metadata.candidate.warnings,
				load: edge.metadata.candidate.load,
				classPeriods: edge.metadata.candidate.classPeriods,
				recentCovers: edge.metadata.candidate.recentCovers,
				reasonKey: edge.metadata.candidate.reasonKey,
				source: 'auto'
			}))
			.sort((a, b) => a.periodIndex - b.periodIndex || a.className.localeCompare(b.className));

		const assignedSlotIds = new Set(generated.map(item => item.slotId));
		const reviewSuggestions = [];
		const openSlots = [];

		/*
		 * Suggestions are made one at a time, each re-ranked against
		 * everything already proposed. Reading them all off the matrix built
		 * before the flow ran meant two vacancies in the same period could be
		 * offered the same teacher - a double booking - and that one willing
		 * teacher collected every leftover period, because the repetition
		 * penalty never saw the suggestions being made alongside it.
		 */
		const proposed = existingAssignments.concat(generated);
		vacancies.filter(vacancy => !assignedSlotIds.has(vacancy.slotId)).forEach(vacancy => {
			const candidates = rankCandidates({
				...input,
				vacancy,
				assignments: proposed,
				teacherProfiles
			})
				// Reserve staff have no timetable, so they read as free in
				// every period and would be suggested the moment every regular
				// teacher is blocked. "Never automatic" has to mean the
				// suggestion path as well, or they would quietly fill the
				// hardest periods - exactly the ones a coordinator wants to
				// decide themselves.
				.filter(candidate => candidate.blocked.length === 0 && !candidate.reserve);

			/*
			 * Nobody takes a third period while somebody else can take a
			 * first. The daily cap has to be a rule rather than a score: the
			 * repetition penalty is clamped (so tier order stays guaranteed),
			 * which means past a few covers it stops growing and a
			 * well-connected teacher would keep winning every leftover period.
			 * Only when everyone under the cap is unavailable do we go over.
			 */
			const underCap = candidates.filter(candidate =>
				!candidate.warnings.includes('over_substitution_limit'));
			const suggestion = (underCap.length ? underCap : candidates)[0] || null;
			if (suggestion) {
				proposed.push({
					slotId: vacancy.slotId,
					teacher: suggestion.teacher,
					periodIndex: vacancy.periodIndex
				});
				reviewSuggestions.push({
					...vacancy,
					teacher: suggestion.teacher,
					matchTier: suggestion.matchTier,
					warnings: suggestion.warnings,
					load: suggestion.load,
					classPeriods: suggestion.classPeriods,
					recentCovers: suggestion.recentCovers,
					reasonKey: suggestion.reasonKey,
					source: 'suggestion'
				});
			} else {
				openSlots.push(vacancy);
			}
		});

		return {
			assignments: [...existingAssignments, ...generated],
			reviewSuggestions,
			openSlots,
			diagnostics: {
				vacancies: vacancies.length,
				autoAssigned: generated.length,
				reviewRequired: reviewSuggestions.length,
				open: openSlots.length,
				flow: flowResult.flow,
				objectiveCost: flowResult.cost
			}
		};
	}

	function validateAssignment(input) {
		const candidate = candidateForTeacher(input, input.teacher);
		if (!candidate) return { valid: false, canOverride: false, errors: ['unknown_teacher'], warnings: [] };
		return {
			valid: candidate.blocked.length === 0 && candidate.warnings.length === 0,
			canOverride: candidate.blocked.length === 0,
			errors: candidate.blocked,
			warnings: candidate.warnings,
			candidate
		};
	}

	function emptyStore(scheduleVersion) {
		return { version: STORAGE_VERSION, scheduleVersion, plans: {} };
	}

	function createPlanStore(storage, options) {
		const target = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
		const scheduleVersion = options?.scheduleVersion || '2026-27-v4';
		const nowProvider = options?.now || (() => new Date());

		function write(store) {
			if (!target) return store;
			target.setItem(STORAGE_KEY, JSON.stringify(store));
			return store;
		}

		function load() {
			if (!target) return emptyStore(scheduleVersion);
			let parsed;
			try { parsed = JSON.parse(target.getItem(STORAGE_KEY) || 'null'); } catch (error) { parsed = null; }
			if (!parsed || parsed.version !== STORAGE_VERSION || typeof parsed.plans !== 'object') {
				return write(emptyStore(scheduleVersion));
			}
			if (parsed.scheduleVersion !== scheduleVersion) {
				const reset = emptyStore(scheduleVersion);
				reset.invalidated = true;
				return write(reset);
			}
			return cleanup(parsed);
		}

		function cleanup(store) {
			const cutoff = new Date(nowProvider());
			cutoff.setHours(0, 0, 0, 0);
			cutoff.setDate(cutoff.getDate() - 30);
			Object.keys(store.plans || {}).forEach(date => {
				const parsedDate = new Date(`${date}T00:00:00`);
				if (!Number.isNaN(parsedDate.getTime()) && parsedDate < cutoff) delete store.plans[date];
			});
			return write(store);
		}

		function getPlan(date) {
			return load().plans[date] || null;
		}

		function savePlan(date, plan) {
			const store = load();
			store.plans[date] = {
				...plan,
				date,
				scheduleVersion,
				updatedAt: nowProvider().toISOString()
			};
			write(store);
			return store.plans[date];
		}

		function removePlan(date) {
			const store = load();
			delete store.plans[date];
			write(store);
		}

		return { load, cleanup, getPlan, savePlan, removePlan };
	}

	return {
		STORAGE_KEY,
		STORAGE_VERSION,
		DEFAULT_MAX_AUTO_SUBSTITUTIONS,
		DEFAULT_MAX_CONSECUTIVE,
		SUBJECT_ALIASES,
		SUBJECT_GROUPS,
		DEFAULT_SHIFTS,
		SHIFT_POLICY_VERSION,
		TIER_ORDER,
		TIER_SCORE,
		MAX_GRADE_GAP,
		canCombine,
		chooseMergeHost,
		TIER_GAP,
		MODIFIER_CAP,
		AUTO_TIERS,
		WEIGHTS,
		tierRank,
		tierDominates,
		canonicalSubject,
		extractGrade,
		gradeBand,
		shiftPeriods,
		isFullDayShift,
		isOnShift,
		normalizeShifts,
		shiftsToPolicyOverrides,
		buildTeacherProfiles,
		rankCandidates,
		generatePlan,
		validateAssignment,
		createPlanStore
	};
});
