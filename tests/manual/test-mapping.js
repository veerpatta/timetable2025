/**
 * Subject Category Mapping Test
 * Verifies that subjects are correctly categorized
 */

// Copy the mapping logic from colors.js
const SUBJECT_CATEGORIES = {
	languages: [
		'english', 'hindi', 'sanskrit', 'elga',
		'english literature', 'hindi boards',
		'language', 'grammar', 'literature'
	],
	sciences: [
		'science', 'physics', 'chemistry', 'biology',
		'evs', 'environmental', 'lab', 'practical'
	],
	math: [
		'maths', 'mathematics', 'math', 'algebra',
		'geometry', 'calculus', 'statistics'
	],
	social: [
		'sst', 'social', 'history', 'geography',
		'civics', 'political science', 'economics',
		'accountancy', 'business', 'commerce'
	],
	sports: [
		'sports', 'physical', 'pt', 'games',
		'yoga', 'exercise', 'activity', 'pe'
	]
};

function getSubjectCategory(subject) {
	if (!subject || typeof subject !== 'string') {
		return 'default';
	}

	const normalizedSubject = subject.toLowerCase().trim();

	// Special cases that need exact matching first (to avoid partial matches)
	if (normalizedSubject.includes('political science')) {
		return 'social';
	}

	if (normalizedSubject.includes('ccs')) {
		return 'social'; // Computer Science can be social/applied
	}

	if (normalizedSubject.includes('home work') || normalizedSubject.includes('homework')) {
		return 'default';
	}

	if (normalizedSubject.includes('self study')) {
		return 'default';
	}

	// Check each category for a match (order matters - check longer phrases first)
	for (const [category, keywords] of Object.entries(SUBJECT_CATEGORIES)) {
		// Sort keywords by length descending to match longer phrases first
		const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
		for (const keyword of sortedKeywords) {
			if (normalizedSubject.includes(keyword)) {
				return category;
			}
		}
	}

	return 'default';
}

// Test subjects from the timetable
const testSubjects = [
	// Languages
	{ subject: 'English', expected: 'languages' },
	{ subject: 'Hindi', expected: 'languages' },
	{ subject: 'Sanskrit', expected: 'languages' },
	{ subject: 'ELGA', expected: 'languages' },
	{ subject: 'English Literature', expected: 'languages' },
	{ subject: 'Hindi Boards', expected: 'languages' },

	// Sciences
	{ subject: 'Science', expected: 'sciences' },
	{ subject: 'Physics', expected: 'sciences' },
	{ subject: 'Chemistry', expected: 'sciences' },
	{ subject: 'Biology', expected: 'sciences' },
	{ subject: 'EVS', expected: 'sciences' },

	// Math
	{ subject: 'Maths', expected: 'math' },
	{ subject: 'Mathematics', expected: 'math' },

	// Social Studies
	{ subject: 'SST', expected: 'social' },
	{ subject: 'History', expected: 'social' },
	{ subject: 'Geography', expected: 'social' },
	{ subject: 'Political Science', expected: 'social' },
	{ subject: 'Economics', expected: 'social' },
	{ subject: 'Accountancy', expected: 'social' },
	{ subject: 'Business', expected: 'social' },
	{ subject: 'CCS', expected: 'social' },

	// Sports
	{ subject: 'Sports', expected: 'sports' },
	{ subject: 'Physical Education', expected: 'sports' },
	{ subject: 'PT', expected: 'sports' },

	// Default
	{ subject: 'Home Work', expected: 'default' },
	{ subject: 'Self Study', expected: 'default' },
];

console.log('='.repeat(60));
console.log('Subject Category Mapping Test');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

testSubjects.forEach(({ subject, expected }) => {
	const result = getSubjectCategory(subject);
	const status = result === expected ? '✓ PASS' : '✗ FAIL';

	if (result === expected) {
		passed++;
	} else {
		failed++;
		console.log(`\n${status} ${subject}`);
		console.log(`  Expected: ${expected}`);
		console.log(`  Got:      ${result}`);
	}
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(failed === 0 ? '✓ All mappings correct!' : `✗ ${failed} mapping(s) incorrect`);
console.log('='.repeat(60));
