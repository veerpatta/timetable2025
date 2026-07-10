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
		'accounts': 'accountancy'
	};
	const SUBJECT_GROUPS = {
		english: ['english compulsory', 'english literature', 'elga'],
		science: ['science', 'physics', 'chemistry', 'biology', 'evs'],
		social: ['sst', 'history', 'geography', 'political science', 'civics'],
		commerce: ['accountancy', 'business studies', 'economics'],
		computing: ['ccs', 'robotics'],
		maths: ['maths'],
		hindi: ['hindi'],
		sanskrit: ['sanskrit'],
		sports: ['sports']
	};

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
		const profiles = {};

		roster.slice().sort((a, b) => a.localeCompare(b)).forEach(teacher => {
			const data = teacherDetails[teacher] || {};
			const override = overrides[teacher] || {};
			const subjects = new Set(toArray(data.subjects).map(canonicalSubject).filter(Boolean));
			const grades = new Set();
			Object.values(data.schedule || {}).forEach(daySchedule => {
				(daySchedule || []).forEach(period => {
					if (!period) return;
					if (period.subject) subjects.add(canonicalSubject(period.subject));
					const grade = extractGrade(period.className);
					if (grade) grades.add(grade);
				});
			});
			toArray(override.canTeach).forEach(subject => subjects.add(canonicalSubject(subject)));

			profiles[teacher] = {
				teacher,
				subjects,
				canCover: new Set(toArray(override.canCover).map(canonicalSubject).filter(Boolean)),
				grades,
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
		return {
			regular: regular.filter(Boolean).length,
			substitutions,
			totalAfter: after.filter(Boolean).length,
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
		let matchTier = 'general';
		if (profile.subjects.has(targetSubject)) matchTier = 'exact';
		else if (profile.canCover.has(targetSubject)) matchTier = 'approved';
		else if (subjectGroup(targetSubject) && subjectGroup(targetSubject) === subjectGroup(Array.from(profile.subjects)[0])) matchTier = 'related';
		else if (subjectGroup(targetSubject) && Array.from(profile.subjects).some(subject => subjectGroup(subject) === subjectGroup(targetSubject))) matchTier = 'related';

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
		const tierScore = { exact: 10000, approved: 9500, related: 3000, general: 1000 }[matchTier];
		let score = tierScore;
		if (exactGrade) score += 500;
		else if (sameBand) score += 220;
		score += Math.max(0, (periodCount - load.regular) * 35);
		score -= load.substitutions * 500;
		score -= Math.max(0, load.consecutiveAfter - maxConsecutive) * 180;
		if (load.totalAfter >= periodCount) score -= 900;

		const autoEligible = blocked.length === 0 &&
			(matchTier === 'exact' || matchTier === 'approved') &&
			!warnings.includes('over_substitution_limit') &&
			!warnings.includes('full_day') &&
			!warnings.includes('excessive_consecutive');

		return {
			teacher,
			score,
			matchTier,
			autoEligible,
			blocked,
			warnings,
			load,
			grade,
			exactGrade,
			sameBand,
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
			if (capacity > 0) addEdge(graph, source, teacherNodes[teacher], capacity, 0);
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
				source: 'auto'
			}))
			.sort((a, b) => a.periodIndex - b.periodIndex || a.className.localeCompare(b.className));

		const assignedSlotIds = new Set(generated.map(item => item.slotId));
		const reviewSuggestions = [];
		const openSlots = [];
		vacancies.filter(vacancy => !assignedSlotIds.has(vacancy.slotId)).forEach(vacancy => {
			const candidates = candidateMatrix[vacancy.slotId].filter(candidate => candidate.blocked.length === 0);
			const suggestion = candidates[0] || null;
			if (suggestion) {
				reviewSuggestions.push({
					...vacancy,
					teacher: suggestion.teacher,
					matchTier: suggestion.matchTier,
					warnings: suggestion.warnings,
					load: suggestion.load,
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
		canonicalSubject,
		extractGrade,
		gradeBand,
		buildTeacherProfiles,
		rankCandidates,
		generatePlan,
		validateAssignment,
		createPlanStore
	};
});
