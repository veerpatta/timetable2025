/**
 * Subject Color Coding System
 * Veer Patta Public School Timetable Command Center
 *
 * This module provides subject-to-category mapping and color application
 * Feature Flag: feat_color_coding
 */

(function() {
	'use strict';

	// Feature flag key
	const FEATURE_FLAG = 'feat_color_coding';

	/**
	 * Subject Category Mappings
	 * Each subject is mapped to a color category
	 */
	const SUBJECT_CATEGORIES = {
		// Languages - Blue shades
		languages: [
			'english', 'hindi', 'sanskrit', 'elga',
			'english literature', 'hindi boards',
			'language', 'grammar', 'literature'
		],

		// Sciences - Green shades
		sciences: [
			'science', 'physics', 'chemistry', 'biology',
			'evs', 'environmental', 'lab', 'practical'
		],

		// Mathematics - Purple
		math: [
			'maths', 'mathematics', 'math', 'algebra',
			'geometry', 'calculus', 'statistics'
		],

		// Social Studies - Orange
		social: [
			'sst', 'social', 'history', 'geography',
			'civics', 'political science', 'economics',
			'accountancy', 'business', 'commerce'
		],

		// Sports & Activities - Red
		sports: [
			'sports', 'physical', 'pt', 'games',
			'yoga', 'exercise', 'activity', 'pe'
		]
	};

	/**
	 * Category display names for the legend
	 */
	const CATEGORY_LABELS = {
		languages: 'Languages',
		sciences: 'Sciences',
		math: 'Mathematics',
		social: 'Social Studies',
		sports: 'Sports & Activities'
	};

	/**
	 * Determine the category for a given subject
	 * @param {string} subject - The subject name
	 * @returns {string} The category name or 'default'
	 */
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

	/**
	 * Apply color coding to a subject element
	 * @param {HTMLElement} element - The element to apply colors to
	 * @param {string} subject - The subject name
	 */
	function applyColorToElement(element, subject) {
		if (!element) return;

		const category = getSubjectCategory(subject);

		// Remove any existing category classes
		element.removeAttribute('data-category');
		element.classList.remove(
			'subject-color-languages',
			'subject-color-sciences',
			'subject-color-math',
			'subject-color-social',
			'subject-color-sports',
			'subject-color-default'
		);

		// Apply new category
		element.setAttribute('data-category', category);
		element.classList.add(`subject-color-${category}`);
	}

	/**
	 * Remove color coding from an element (rollback)
	 * @param {HTMLElement} element - The element to remove colors from
	 */
	function removeColorFromElement(element) {
		if (!element) return;

		element.removeAttribute('data-category');
		element.classList.remove(
			'subject-color-languages',
			'subject-color-sciences',
			'subject-color-math',
			'subject-color-social',
			'subject-color-sports',
			'subject-color-default'
		);
	}

	/**
	 * Apply colors to all subject elements in the document
	 */
	function applyColorsToAllSubjects() {
		const subjectElements = document.querySelectorAll('.subject');

		subjectElements.forEach(element => {
			const subjectText = element.textContent || element.innerText || '';
			applyColorToElement(element, subjectText);
		});
	}

	/**
	 * Remove colors from all subject elements (rollback)
	 */
	function removeColorsFromAllSubjects() {
		const subjectElements = document.querySelectorAll('.subject');
		subjectElements.forEach(removeColorFromElement);
	}

	/**
	 * Create and inject the color legend into the page
	 * @param {string} containerId - ID of the container to inject the legend into
	 */
	function createColorLegend(containerId = 'color-legend-container') {
		const container = document.getElementById(containerId);
		if (!container) {
			console.warn(`Color legend container #${containerId} not found`);
			return;
		}

		const legend = document.createElement('div');
		legend.className = 'color-legend';
		legend.setAttribute('role', 'region');
		legend.setAttribute('aria-label', 'Subject color coding legend');

		let legendHTML = `
			<div class="color-legend-title">
				<span>📚</span>
				<span>Subject Categories</span>
			</div>
			<div class="color-legend-grid">
		`;

		// Add each category to the legend
		Object.entries(CATEGORY_LABELS).forEach(([category, label]) => {
			legendHTML += `
				<div class="color-legend-item ${category}" role="listitem">
					<div class="color-legend-indicator" aria-hidden="true"></div>
					<span class="color-legend-label">${label}</span>
				</div>
			`;
		});

		legendHTML += '</div>';
		legend.innerHTML = legendHTML;

		container.innerHTML = '';
		container.appendChild(legend);
	}

	/**
	 * Remove the color legend from the page
	 * @param {string} containerId - ID of the container with the legend
	 */
	function removeColorLegend(containerId = 'color-legend-container') {
		const container = document.getElementById(containerId);
		if (container) {
			container.innerHTML = '';
		}
	}

	/**
	 * Check if the color coding feature is enabled
	 * @returns {boolean}
	 */
	function isFeatureEnabled() {
		try {
			const value = localStorage.getItem(FEATURE_FLAG);
			return value === 'true' || value === '1' || value === 'enabled';
		} catch (e) {
			console.warn('Unable to read feature flag from localStorage:', e);
			return true; // Default to enabled if localStorage is unavailable
		}
	}

	/**
	 * Enable the color coding feature
	 */
	function enableColorCoding() {
		try {
			localStorage.setItem(FEATURE_FLAG, 'true');
			applyColorsToAllSubjects();
			createColorLegend();
			console.log('✓ Subject color coding enabled');
		} catch (e) {
			console.error('Failed to enable color coding:', e);
		}
	}

	/**
	 * Disable the color coding feature (rollback)
	 */
	function disableColorCoding() {
		try {
			localStorage.setItem(FEATURE_FLAG, 'false');
			removeColorsFromAllSubjects();
			removeColorLegend();
			console.log('✓ Subject color coding disabled');
		} catch (e) {
			console.error('Failed to disable color coding:', e);
		}
	}

	/**
	 * Initialize the color coding system
	 * @param {Object} options - Initialization options
	 * @param {string} options.legendContainer - ID of the legend container
	 * @param {boolean} options.autoApply - Whether to automatically apply on init
	 */
	function init(options = {}) {
		const {
			legendContainer = 'color-legend-container',
			autoApply = true
		} = options;

		if (isFeatureEnabled() && autoApply) {
			applyColorsToAllSubjects();
			createColorLegend(legendContainer);
		}
	}

	/**
	 * Observer to apply colors to dynamically added subject elements
	 */
	function observeDynamicSubjects() {
		if (!isFeatureEnabled()) return;

		const observer = new MutationObserver(mutations => {
			if (!isFeatureEnabled()) return;

			mutations.forEach(mutation => {
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						// Check if the added node is a subject element
						if (node.classList && node.classList.contains('subject')) {
							const subjectText = node.textContent || node.innerText || '';
							applyColorToElement(node, subjectText);
						}

						// Check for subject elements within the added node
						const subjectElements = node.querySelectorAll('.subject');
						subjectElements.forEach(element => {
							const subjectText = element.textContent || element.innerText || '';
							applyColorToElement(element, subjectText);
						});
					}
				});
			});
		});

		// Observe the entire document for changes
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		return observer;
	}

	// Public API
	window.SubjectColorCoding = {
		init,
		enable: enableColorCoding,
		disable: disableColorCoding,
		isEnabled: isFeatureEnabled,
		applyToElement: applyColorToElement,
		removeFromElement: removeColorFromElement,
		applyToAll: applyColorsToAllSubjects,
		removeFromAll: removeColorsFromAllSubjects,
		createLegend: createColorLegend,
		removeLegend: removeColorLegend,
		getCategory: getSubjectCategory,
		observeDynamic: observeDynamicSubjects,
		FEATURE_FLAG
	};

	// Auto-initialize if DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			init();
			observeDynamicSubjects();
		});
	} else {
		init();
		observeDynamicSubjects();
	}

})();
