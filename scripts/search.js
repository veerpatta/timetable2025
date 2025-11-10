/**
 * Global Search Module for Timetable Command Center
 * Provides instant debounced search for teachers, classes, and subjects
 * with filters and search history
 *
 * @module Search
 * @requires state (global state object)
 * @featureFlag feat_advanced_search
 */

// ============================================
// SEARCH STATE & CONFIGURATION
// ============================================

const SEARCH_CONFIG = {
	DEBOUNCE_DELAY: 250,
	MAX_HISTORY_ITEMS: 10,
	STORAGE_KEY: 'timetable_search_history',
	MIN_SEARCH_LENGTH: 1
};

let searchState = {
	query: '',
	filters: {
		day: '',
		periodRange: { start: '', end: '' },
		subject: '',
		teacherAvailability: false
	},
	results: {
		teachers: [],
		classes: [],
		subjects: []
	},
	history: [],
	debounceTimer: null,
	focusTrapElements: []
};

// ============================================
// SEARCH HISTORY MANAGEMENT
// ============================================

/**
 * Load search history from localStorage
 * @private
 */
function loadSearchHistory() {
	try {
		const stored = localStorage.getItem(SEARCH_CONFIG.STORAGE_KEY);
		if (stored) {
			searchState.history = JSON.parse(stored);
		}
	} catch (error) {
		console.error('[Search] Failed to load search history:', error);
		searchState.history = [];
	}
}

/**
 * Save search history to localStorage
 * @private
 */
function saveSearchHistory() {
	try {
		localStorage.setItem(
			SEARCH_CONFIG.STORAGE_KEY,
			JSON.stringify(searchState.history.slice(0, SEARCH_CONFIG.MAX_HISTORY_ITEMS))
		);
	} catch (error) {
		console.error('[Search] Failed to save search history:', error);
	}
}

/**
 * Add a search query to history
 * @param {string} query - The search query to add
 * @private
 */
function addToHistory(query) {
	if (!query || query.trim().length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) return;

	const trimmedQuery = query.trim();

	// Remove duplicate if exists
	searchState.history = searchState.history.filter(item => item.query !== trimmedQuery);

	// Add to beginning with timestamp
	searchState.history.unshift({
		query: trimmedQuery,
		timestamp: Date.now(),
		filters: { ...searchState.filters }
	});

	// Limit size
	searchState.history = searchState.history.slice(0, SEARCH_CONFIG.MAX_HISTORY_ITEMS);

	saveSearchHistory();
}

/**
 * Clear all search history
 * @public
 */
function clearSearchHistory() {
	searchState.history = [];
	saveSearchHistory();
	renderSearchHistory();
	showToast('Search history cleared', 2000, 'success');
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

/**
 * Perform search across teachers, classes, and subjects
 * @param {string} query - The search query
 * @private
 */
function performSearch(query) {
	const normalizedQuery = query.toLowerCase().trim();

	if (normalizedQuery.length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
		searchState.results = { teachers: [], classes: [], subjects: [] };
		renderSearchResults();
		return;
	}

	const { timetable, teacherDetails } = state.allData || {};

	if (!timetable || !teacherDetails) {
		console.warn('[Search] Timetable data not available');
		searchState.results = { teachers: [], classes: [], subjects: [] };
		renderSearchResults();
		return;
	}

	// Search teachers
	const teachers = searchTeachers(normalizedQuery, teacherDetails);

	// Search classes
	const classes = searchClasses(normalizedQuery, timetable);

	// Search subjects
	const subjects = searchSubjects(normalizedQuery, timetable, teacherDetails);

	searchState.results = { teachers, classes, subjects };
	renderSearchResults();
}

/**
 * Search for teachers by name
 * @param {string} query - The search query
 * @param {Object} teacherDetails - Teacher details object
 * @returns {Array} Array of matching teachers
 * @private
 */
function searchTeachers(query, teacherDetails) {
	const teachers = [];

	for (const [name, details] of Object.entries(teacherDetails)) {
		if (name.toLowerCase().includes(query)) {
			const subjects = Array.from(details.subjects || []);
			const periodCount = details.periodCount || 0;

			// Apply filters
			if (applyTeacherFilters(name, details)) {
				teachers.push({
					name,
					subjects,
					periodCount,
					schedule: details.schedule || {}
				});
			}
		}
	}

	return teachers.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search for classes by name
 * @param {string} query - The search query
 * @param {Object} timetable - Timetable object
 * @returns {Array} Array of matching classes
 * @private
 */
function searchClasses(query, timetable) {
	const classSet = new Set();
	const classes = [];

	for (const day of Object.keys(timetable)) {
		for (const className of Object.keys(timetable[day])) {
			if (className.toLowerCase().includes(query) && !classSet.has(className)) {
				classSet.add(className);

				// Apply filters
				if (applyClassFilters(className, timetable)) {
					classes.push({
						name: className,
						days: getDaysForClass(className, timetable)
					});
				}
			}
		}
	}

	return classes.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search for subjects
 * @param {string} query - The search query
 * @param {Object} timetable - Timetable object
 * @param {Object} teacherDetails - Teacher details object
 * @returns {Array} Array of matching subjects
 * @private
 */
function searchSubjects(query, timetable, teacherDetails) {
	const subjectMap = new Map();

	// Collect subjects from timetable
	for (const day of Object.keys(timetable)) {
		for (const className of Object.keys(timetable[day])) {
			const periods = timetable[day][className];

			periods.forEach((period, periodIndex) => {
				if (period && period.subject) {
					const subjects = period.subject.split('/').map(s => s.trim());

					subjects.forEach(subject => {
						if (subject.toLowerCase().includes(query)) {
							if (!subjectMap.has(subject)) {
								subjectMap.set(subject, {
									name: subject,
									teachers: new Set(),
									classes: new Set(),
									occurrences: 0
								});
							}

							const subjectData = subjectMap.get(subject);
							if (period.teacher) {
								period.teacher.split('/').forEach(t =>
									subjectData.teachers.add(t.trim())
								);
							}
							subjectData.classes.add(className);
							subjectData.occurrences++;
						}
					});
				}
			});
		}
	}

	// Convert to array and apply filters
	const subjects = Array.from(subjectMap.values())
		.filter(subject => applySubjectFilters(subject))
		.map(subject => ({
			name: subject.name,
			teachers: Array.from(subject.teachers),
			classes: Array.from(subject.classes),
			occurrences: subject.occurrences
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

	return subjects;
}

// ============================================
// FILTER LOGIC
// ============================================

/**
 * Apply filters to teacher results
 * @param {string} name - Teacher name
 * @param {Object} details - Teacher details
 * @returns {boolean} True if teacher passes filters
 * @private
 */
function applyTeacherFilters(name, details) {
	const { day, periodRange, teacherAvailability } = searchState.filters;

	// Day filter
	if (day && details.schedule) {
		if (!details.schedule[day] || Object.keys(details.schedule[day]).length === 0) {
			return false;
		}
	}

	// Teacher availability filter (free teachers)
	if (teacherAvailability && day && periodRange.start !== '') {
		const startPeriod = parseInt(periodRange.start) || 0;
		const endPeriod = periodRange.end !== '' ? parseInt(periodRange.end) : startPeriod;

		if (details.schedule && details.schedule[day]) {
			for (let p = startPeriod; p <= endPeriod; p++) {
				if (details.schedule[day][p]) {
					return false; // Teacher is busy
				}
			}
		}
	}

	return true;
}

/**
 * Apply filters to class results
 * @param {string} className - Class name
 * @param {Object} timetable - Timetable object
 * @returns {boolean} True if class passes filters
 * @private
 */
function applyClassFilters(className, timetable) {
	const { day, periodRange, subject } = searchState.filters;

	// Day filter
	if (day) {
		if (!timetable[day] || !timetable[day][className]) {
			return false;
		}

		// Period range filter for specific day
		if (periodRange.start !== '') {
			const startPeriod = parseInt(periodRange.start) || 0;
			const endPeriod = periodRange.end !== '' ? parseInt(periodRange.end) : startPeriod;
			const periods = timetable[day][className];

			let hasMatch = false;
			for (let p = startPeriod; p <= endPeriod && p < periods.length; p++) {
				if (periods[p]) {
					hasMatch = true;
					break;
				}
			}

			if (!hasMatch) return false;
		}

		// Subject filter for specific day
		if (subject) {
			const periods = timetable[day][className];
			let hasSubject = false;

			for (const period of periods) {
				if (period && period.subject &&
					period.subject.toLowerCase().includes(subject.toLowerCase())) {
					hasSubject = true;
					break;
				}
			}

			if (!hasSubject) return false;
		}
	}

	return true;
}

/**
 * Apply filters to subject results
 * @param {Object} subject - Subject data
 * @returns {boolean} True if subject passes filters
 * @private
 */
function applySubjectFilters(subject) {
	const { subject: subjectFilter } = searchState.filters;

	if (subjectFilter && !subject.name.toLowerCase().includes(subjectFilter.toLowerCase())) {
		return false;
	}

	return true;
}

/**
 * Get all days where a class is scheduled
 * @param {string} className - Class name
 * @param {Object} timetable - Timetable object
 * @returns {Array} Array of days
 * @private
 */
function getDaysForClass(className, timetable) {
	const days = [];
	for (const day of Object.keys(timetable)) {
		if (timetable[day][className]) {
			days.push(day);
		}
	}
	return days;
}

// ============================================
// DEBOUNCED SEARCH
// ============================================

/**
 * Handle search input with debouncing
 * @param {string} query - The search query
 * @public
 */
function handleSearchInput(query) {
	searchState.query = query;

	// Clear existing timer
	if (searchState.debounceTimer) {
		clearTimeout(searchState.debounceTimer);
	}

	// Set new timer
	searchState.debounceTimer = setTimeout(() => {
		performSearch(query);

		// Add to history if query is valid
		if (query.trim().length >= SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
			addToHistory(query);
			renderSearchHistory();
		}
	}, SEARCH_CONFIG.DEBOUNCE_DELAY);
}

/**
 * Handle filter changes
 * @param {string} filterName - Name of the filter
 * @param {*} value - Filter value
 * @public
 */
function handleFilterChange(filterName, value) {
	if (filterName === 'periodStart' || filterName === 'periodEnd') {
		const key = filterName === 'periodStart' ? 'start' : 'end';
		searchState.filters.periodRange[key] = value;
	} else {
		searchState.filters[filterName] = value;
	}

	// Re-run search with new filters
	if (searchState.query.trim().length >= SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
		performSearch(searchState.query);
	}
}

/**
 * Reset all filters
 * @public
 */
function resetFilters() {
	searchState.filters = {
		day: '',
		periodRange: { start: '', end: '' },
		subject: '',
		teacherAvailability: false
	};

	// Update UI
	const dayFilter = document.getElementById('search-filter-day');
	const periodStartFilter = document.getElementById('search-filter-period-start');
	const periodEndFilter = document.getElementById('search-filter-period-end');
	const subjectFilter = document.getElementById('search-filter-subject');
	const availabilityFilter = document.getElementById('search-filter-availability');

	if (dayFilter) dayFilter.value = '';
	if (periodStartFilter) periodStartFilter.value = '';
	if (periodEndFilter) periodEndFilter.value = '';
	if (subjectFilter) subjectFilter.value = '';
	if (availabilityFilter) availabilityFilter.checked = false;

	// Re-run search
	if (searchState.query.trim().length >= SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
		performSearch(searchState.query);
	}

	showToast('Filters reset', 1500, 'info');
}

// ============================================
// MODAL MANAGEMENT
// ============================================

/**
 * Open search modal
 * @public
 */
function openSearchModal() {
	const modal = document.getElementById('search-modal');
	const searchInput = document.getElementById('global-search-input-modal');

	if (!modal) {
		console.error('[Search] Modal not found');
		return;
	}

	modal.classList.add('active');
	document.body.style.overflow = 'hidden';

	// Focus on input
	if (searchInput) {
		setTimeout(() => searchInput.focus(), 100);
	}

	// Setup focus trap
	setupFocusTrap(modal);

	// Render search history
	renderSearchHistory();
}

/**
 * Close search modal
 * @public
 */
function closeSearchModal() {
	const modal = document.getElementById('search-modal');

	if (!modal) return;

	modal.classList.remove('active');
	document.body.style.overflow = '';

	// Clear search
	searchState.query = '';
	searchState.results = { teachers: [], classes: [], subjects: [] };

	const searchInput = document.getElementById('global-search-input-modal');
	if (searchInput) searchInput.value = '';

	renderSearchResults();

	// Return focus to trigger element
	const globalSearchInput = document.getElementById('global-search-input');
	if (globalSearchInput) {
		globalSearchInput.focus();
	}
}

/**
 * Setup focus trap for modal accessibility
 * @param {HTMLElement} modal - The modal element
 * @private
 */
function setupFocusTrap(modal) {
	const focusableElements = modal.querySelectorAll(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	);

	searchState.focusTrapElements = Array.from(focusableElements);

	if (searchState.focusTrapElements.length === 0) return;

	const firstElement = searchState.focusTrapElements[0];
	const lastElement = searchState.focusTrapElements[searchState.focusTrapElements.length - 1];

	modal.addEventListener('keydown', function handleTabKey(e) {
		if (e.key !== 'Tab') return;

		if (e.shiftKey) {
			// Shift + Tab
			if (document.activeElement === firstElement) {
				e.preventDefault();
				lastElement.focus();
			}
		} else {
			// Tab
			if (document.activeElement === lastElement) {
				e.preventDefault();
				firstElement.focus();
			}
		}
	});
}

// ============================================
// RENDERING
// ============================================

/**
 * Render search history in modal
 * @private
 */
function renderSearchHistory() {
	const container = document.getElementById('search-history-container');

	if (!container) return;

	if (searchState.history.length === 0) {
		container.innerHTML = `
			<div style="text-align: center; padding: 2rem; color: var(--gray-500);">
				<i data-lucide="search" style="width: 48px; height: 48px; margin-bottom: 0.5rem;"></i>
				<p>No search history yet</p>
			</div>
		`;

		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
		return;
	}

	const historyHTML = searchState.history.map((item, index) => `
		<div class="search-history-item" role="button" tabindex="0"
			onclick="applyHistoryItem(${index})"
			onkeypress="if(event.key==='Enter') applyHistoryItem(${index})">
			<div class="search-history-item-main">
				<i data-lucide="clock"></i>
				<span class="search-history-query">${escapeHtml(item.query)}</span>
			</div>
			<button class="search-history-remove"
				onclick="event.stopPropagation(); removeHistoryItem(${index})"
				aria-label="Remove from history"
				title="Remove from history">
				<i data-lucide="x"></i>
			</button>
		</div>
	`).join('');

	container.innerHTML = `
		<div class="search-history-header">
			<h3>Recent Searches</h3>
			<button class="button-text" onclick="clearSearchHistory()">
				<i data-lucide="trash-2"></i>
				Clear All
			</button>
		</div>
		<div class="search-history-list">
			${historyHTML}
		</div>
	`;

	if (typeof lucide !== 'undefined') {
		lucide.createIcons();
	}
}

/**
 * Apply a history item to current search
 * @param {number} index - Index of history item
 * @public
 */
function applyHistoryItem(index) {
	const item = searchState.history[index];

	if (!item) return;

	// Set search query
	const searchInput = document.getElementById('global-search-input-modal');
	if (searchInput) {
		searchInput.value = item.query;
		searchState.query = item.query;
	}

	// Apply filters if they exist
	if (item.filters) {
		searchState.filters = { ...item.filters };

		// Update filter UI
		const dayFilter = document.getElementById('search-filter-day');
		const periodStartFilter = document.getElementById('search-filter-period-start');
		const periodEndFilter = document.getElementById('search-filter-period-end');
		const subjectFilter = document.getElementById('search-filter-subject');
		const availabilityFilter = document.getElementById('search-filter-availability');

		if (dayFilter) dayFilter.value = item.filters.day || '';
		if (periodStartFilter) periodStartFilter.value = item.filters.periodRange?.start || '';
		if (periodEndFilter) periodEndFilter.value = item.filters.periodRange?.end || '';
		if (subjectFilter) subjectFilter.value = item.filters.subject || '';
		if (availabilityFilter) availabilityFilter.checked = item.filters.teacherAvailability || false;
	}

	// Perform search
	performSearch(item.query);
}

/**
 * Remove a history item
 * @param {number} index - Index of history item
 * @public
 */
function removeHistoryItem(index) {
	searchState.history.splice(index, 1);
	saveSearchHistory();
	renderSearchHistory();
}

/**
 * Render search results in modal
 * @private
 */
function renderSearchResults() {
	const container = document.getElementById('search-results-container');

	if (!container) return;

	const { teachers, classes, subjects } = searchState.results;
	const hasResults = teachers.length > 0 || classes.length > 0 || subjects.length > 0;

	if (!searchState.query || searchState.query.trim().length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
		container.innerHTML = '';
		return;
	}

	if (!hasResults) {
		container.innerHTML = `
			<div class="search-no-results">
				<i data-lucide="search-x" style="width: 48px; height: 48px; margin-bottom: 0.5rem;"></i>
				<h3>No results found</h3>
				<p>Try adjusting your search or filters</p>
			</div>
		`;

		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
		return;
	}

	let resultsHTML = '<div class="search-results-sections">';

	// Teachers
	if (teachers.length > 0) {
		resultsHTML += `
			<div class="search-results-section">
				<h3 class="search-results-section-title">
					<i data-lucide="users"></i>
					Teachers (${teachers.length})
				</h3>
				<div class="search-results-list">
					${teachers.map(teacher => renderTeacherResult(teacher)).join('')}
				</div>
			</div>
		`;
	}

	// Classes
	if (classes.length > 0) {
		resultsHTML += `
			<div class="search-results-section">
				<h3 class="search-results-section-title">
					<i data-lucide="school"></i>
					Classes (${classes.length})
				</h3>
				<div class="search-results-list">
					${classes.map(cls => renderClassResult(cls)).join('')}
				</div>
			</div>
		`;
	}

	// Subjects
	if (subjects.length > 0) {
		resultsHTML += `
			<div class="search-results-section">
				<h3 class="search-results-section-title">
					<i data-lucide="book-open"></i>
					Subjects (${subjects.length})
				</h3>
				<div class="search-results-list">
					${subjects.map(subject => renderSubjectResult(subject)).join('')}
				</div>
			</div>
		`;
	}

	resultsHTML += '</div>';
	container.innerHTML = resultsHTML;

	if (typeof lucide !== 'undefined') {
		lucide.createIcons();
	}
}

/**
 * Render a teacher result item
 * @param {Object} teacher - Teacher data
 * @returns {string} HTML string
 * @private
 */
function renderTeacherResult(teacher) {
	return `
		<div class="search-result-item">
			<div class="search-result-item-header">
				<div class="search-result-item-title">
					<i data-lucide="user"></i>
					<strong>${escapeHtml(teacher.name)}</strong>
				</div>
				<div class="search-result-item-meta">
					${teacher.periodCount} periods
				</div>
			</div>
			<div class="search-result-item-details">
				<span class="search-result-badge">
					<i data-lucide="book"></i>
					${teacher.subjects.length} subject${teacher.subjects.length !== 1 ? 's' : ''}
				</span>
			</div>
			<div class="search-result-actions">
				<button class="button-sm button-primary"
					onclick="viewTeacherSchedule('${escapeHtml(teacher.name)}')">
					<i data-lucide="calendar"></i>
					View Schedule
				</button>
				<button class="button-sm"
					onclick="favoriteTeacher('${escapeHtml(teacher.name)}')">
					<i data-lucide="star"></i>
					Favorite
				</button>
			</div>
		</div>
	`;
}

/**
 * Render a class result item
 * @param {Object} cls - Class data
 * @returns {string} HTML string
 * @private
 */
function renderClassResult(cls) {
	return `
		<div class="search-result-item">
			<div class="search-result-item-header">
				<div class="search-result-item-title">
					<i data-lucide="school"></i>
					<strong>${escapeHtml(cls.name)}</strong>
				</div>
				<div class="search-result-item-meta">
					${cls.days.length} day${cls.days.length !== 1 ? 's' : ''}
				</div>
			</div>
			<div class="search-result-item-details">
				<span class="search-result-badge">
					<i data-lucide="calendar-days"></i>
					${cls.days.map(d => d.substring(0, 3)).join(', ')}
				</span>
			</div>
			<div class="search-result-actions">
				<button class="button-sm button-primary"
					onclick="viewClassSchedule('${escapeHtml(cls.name)}')">
					<i data-lucide="calendar"></i>
					View Schedule
				</button>
				<button class="button-sm"
					onclick="favoriteClass('${escapeHtml(cls.name)}')">
					<i data-lucide="star"></i>
					Favorite
				</button>
			</div>
		</div>
	`;
}

/**
 * Render a subject result item
 * @param {Object} subject - Subject data
 * @returns {string} HTML string
 * @private
 */
function renderSubjectResult(subject) {
	return `
		<div class="search-result-item">
			<div class="search-result-item-header">
				<div class="search-result-item-title">
					<i data-lucide="book-open"></i>
					<strong>${escapeHtml(subject.name)}</strong>
				</div>
				<div class="search-result-item-meta">
					${subject.occurrences} period${subject.occurrences !== 1 ? 's' : ''}
				</div>
			</div>
			<div class="search-result-item-details">
				<span class="search-result-badge">
					<i data-lucide="users"></i>
					${subject.teachers.length} teacher${subject.teachers.length !== 1 ? 's' : ''}
				</span>
				<span class="search-result-badge">
					<i data-lucide="school"></i>
					${subject.classes.length} class${subject.classes.length !== 1 ? 'es' : ''}
				</span>
			</div>
			<div class="search-result-actions">
				<button class="button-sm button-primary"
					onclick="viewSubjectSchedule('${escapeHtml(subject.name)}')">
					<i data-lucide="calendar"></i>
					View Schedule
				</button>
				<button class="button-sm"
					onclick="favoriteSubject('${escapeHtml(subject.name)}')">
					<i data-lucide="star"></i>
					Favorite
				</button>
			</div>
		</div>
	`;
}

// ============================================
// QUICK ACTIONS
// ============================================

/**
 * View teacher schedule
 * @param {string} teacherName - Teacher name
 * @public
 */
function viewTeacherSchedule(teacherName) {
	closeSearchModal();

	// Switch to Teacher view and select the teacher
	if (typeof switchView === 'function') {
		switchView('Teacher');

		// Wait for view to render, then select teacher
		setTimeout(() => {
			const teacherSelect = document.getElementById('teacherSelect');
			if (teacherSelect) {
				teacherSelect.value = teacherName;

				// Trigger change event
				const event = new Event('change', { bubbles: true });
				teacherSelect.dispatchEvent(event);
			}
		}, 100);
	}
}

/**
 * View class schedule
 * @param {string} className - Class name
 * @public
 */
function viewClassSchedule(className) {
	closeSearchModal();

	// Switch to Class view and select the class
	if (typeof switchView === 'function') {
		switchView('Class');

		// Wait for view to render, then select class
		setTimeout(() => {
			const classSelect = document.getElementById('classSelect');
			if (classSelect) {
				classSelect.value = className;

				// Trigger change event
				const event = new Event('change', { bubbles: true });
				classSelect.dispatchEvent(event);
			}
		}, 100);
	}
}

/**
 * View subject schedule (show in Day view with filter)
 * @param {string} subjectName - Subject name
 * @public
 */
function viewSubjectSchedule(subjectName) {
	closeSearchModal();

	// Switch to Day view
	if (typeof switchView === 'function') {
		switchView('Day');
		showToast(`Showing schedule for ${subjectName}`, 2500, 'info');
	}
}

/**
 * Add teacher to favorites
 * @param {string} teacherName - Teacher name
 * @public
 */
function favoriteTeacher(teacherName) {
	try {
		const favorites = JSON.parse(localStorage.getItem('favorites_teachers') || '[]');

		if (favorites.includes(teacherName)) {
			showToast(`${teacherName} is already in favorites`, 2000, 'info');
			return;
		}

		favorites.push(teacherName);
		localStorage.setItem('favorites_teachers', JSON.stringify(favorites));

		showToast(`${teacherName} added to favorites`, 2000, 'success');
	} catch (error) {
		console.error('[Search] Failed to add favorite:', error);
		showToast('Failed to add favorite', 2000, 'error');
	}
}

/**
 * Add class to favorites
 * @param {string} className - Class name
 * @public
 */
function favoriteClass(className) {
	try {
		const favorites = JSON.parse(localStorage.getItem('favorites_classes') || '[]');

		if (favorites.includes(className)) {
			showToast(`${className} is already in favorites`, 2000, 'info');
			return;
		}

		favorites.push(className);
		localStorage.setItem('favorites_classes', JSON.stringify(favorites));

		showToast(`${className} added to favorites`, 2000, 'success');
	} catch (error) {
		console.error('[Search] Failed to add favorite:', error);
		showToast('Failed to add favorite', 2000, 'error');
	}
}

/**
 * Add subject to favorites
 * @param {string} subjectName - Subject name
 * @public
 */
function favoriteSubject(subjectName) {
	try {
		const favorites = JSON.parse(localStorage.getItem('favorites_subjects') || '[]');

		if (favorites.includes(subjectName)) {
			showToast(`${subjectName} is already in favorites`, 2000, 'info');
			return;
		}

		favorites.push(subjectName);
		localStorage.setItem('favorites_subjects', JSON.stringify(favorites));

		showToast(`${subjectName} added to favorites`, 2000, 'success');
	} catch (error) {
		console.error('[Search] Failed to add favorite:', error);
		showToast('Failed to add favorite', 2000, 'error');
	}
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 * @private
 */
function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize search module
 * @public
 */
function initSearch() {
	// Check feature flag
	if (!FEATURE_FLAGS || !FEATURE_FLAGS.feat_advanced_search) {
		console.log('[Search] Advanced search feature is disabled');

		// Hide search input
		const searchInput = document.getElementById('global-search-input');
		if (searchInput) {
			searchInput.style.display = 'none';
		}

		return;
	}

	console.log('[Search] Initializing global search...');

	// Load search history
	loadSearchHistory();

	// Setup event listeners
	const searchInput = document.getElementById('global-search-input');
	const searchInputModal = document.getElementById('global-search-input-modal');
	const modal = document.getElementById('search-modal');
	const modalClose = document.getElementById('search-modal-close');
	const modalOverlay = document.querySelector('.search-modal-overlay');

	// Header search input - opens modal on focus/click
	if (searchInput) {
		searchInput.addEventListener('focus', openSearchModal);
		searchInput.addEventListener('click', openSearchModal);
	}

	// Modal search input - performs search
	if (searchInputModal) {
		searchInputModal.addEventListener('input', (e) => {
			handleSearchInput(e.target.value);
		});

		// Clear button in input
		searchInputModal.addEventListener('search', (e) => {
			if (e.target.value === '') {
				handleSearchInput('');
			}
		});
	}

	// Close modal
	if (modalClose) {
		modalClose.addEventListener('click', closeSearchModal);
	}

	if (modalOverlay) {
		modalOverlay.addEventListener('click', closeSearchModal);
	}

	// ESC key to close modal
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
			closeSearchModal();
		}
	});

	// Filter change listeners
	const dayFilter = document.getElementById('search-filter-day');
	const periodStartFilter = document.getElementById('search-filter-period-start');
	const periodEndFilter = document.getElementById('search-filter-period-end');
	const subjectFilter = document.getElementById('search-filter-subject');
	const availabilityFilter = document.getElementById('search-filter-availability');

	if (dayFilter) {
		dayFilter.addEventListener('change', (e) => handleFilterChange('day', e.target.value));
	}

	if (periodStartFilter) {
		periodStartFilter.addEventListener('change', (e) => handleFilterChange('periodStart', e.target.value));
	}

	if (periodEndFilter) {
		periodEndFilter.addEventListener('change', (e) => handleFilterChange('periodEnd', e.target.value));
	}

	if (subjectFilter) {
		subjectFilter.addEventListener('input', (e) => handleFilterChange('subject', e.target.value));
	}

	if (availabilityFilter) {
		availabilityFilter.addEventListener('change', (e) => handleFilterChange('teacherAvailability', e.target.checked));
	}

	console.log('[Search] Global search initialized successfully');
}

// Export for use in HTML
if (typeof window !== 'undefined') {
	window.initSearch = initSearch;
	window.openSearchModal = openSearchModal;
	window.closeSearchModal = closeSearchModal;
	window.handleSearchInput = handleSearchInput;
	window.handleFilterChange = handleFilterChange;
	window.resetFilters = resetFilters;
	window.clearSearchHistory = clearSearchHistory;
	window.applyHistoryItem = applyHistoryItem;
	window.removeHistoryItem = removeHistoryItem;
	window.viewTeacherSchedule = viewTeacherSchedule;
	window.viewClassSchedule = viewClassSchedule;
	window.viewSubjectSchedule = viewSubjectSchedule;
	window.favoriteTeacher = favoriteTeacher;
	window.favoriteClass = favoriteClass;
	window.favoriteSubject = favoriteSubject;
}
