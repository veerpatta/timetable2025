/**
 * Accessibility Enhancement Module
 * Veer Patta Public School Timetable Command Center
 *
 * Features:
 * - Keyboard shortcuts menu (?)
 * - ARIA live announcements
 * - High contrast mode
 * - Enhanced focus management
 * - Screen reader optimizations
 *
 * Feature Flag: feat_accessibility
 */

(function() {
	'use strict';

	// Feature flag key
	const FEATURE_FLAG = 'feat_accessibility';

	// Keyboard shortcuts configuration
	const KEYBOARD_SHORTCUTS = {
		'?': { action: 'toggleShortcutsMenu', description: 'Show keyboard shortcuts' },
		'h': { action: 'goHome', description: 'Go to home/dashboard' },
		'd': { action: 'toggleDayView', description: 'Toggle day view' },
		'c': { action: 'toggleClassView', description: 'Toggle class view' },
		't': { action: 'toggleTeacherView', description: 'Toggle teacher view' },
		'n': { action: 'goToCurrentPeriod', description: 'Go to current period/today' },
		'm': { action: 'toggleTheme', description: 'Toggle dark/light mode' },
		'k': { action: 'toggleHighContrast', description: 'Toggle high contrast mode' },
		'Escape': { action: 'closeModal', description: 'Close open modal/menu' },
		'/': { action: 'focusSearch', description: 'Focus search (if available)' },
	};

	// State
	let shortcutsModalOpen = false;
	let highContrastMode = false;
	let ariaLiveRegion = null;

	/**
	 * Check if the accessibility feature is enabled
	 * @returns {boolean}
	 */
	function isFeatureEnabled() {
		try {
			const value = localStorage.getItem(FEATURE_FLAG);
			return value === null || value === 'true' || value === '1' || value === 'enabled';
		} catch (e) {
			console.warn('Unable to read feature flag from localStorage:', e);
			return true; // Default to enabled
		}
	}

	/**
	 * Create ARIA live region for announcements
	 */
	function createAriaLiveRegion() {
		if (ariaLiveRegion) return;

		ariaLiveRegion = document.createElement('div');
		ariaLiveRegion.setAttribute('role', 'status');
		ariaLiveRegion.setAttribute('aria-live', 'polite');
		ariaLiveRegion.setAttribute('aria-atomic', 'true');
		ariaLiveRegion.className = 'sr-only';
		ariaLiveRegion.id = 'aria-live-region';
		document.body.appendChild(ariaLiveRegion);
	}

	/**
	 * Announce a message to screen readers
	 * @param {string} message - The message to announce
	 * @param {string} priority - 'polite' or 'assertive'
	 */
	function announce(message, priority = 'polite') {
		if (!ariaLiveRegion) {
			createAriaLiveRegion();
		}

		// Clear previous message
		ariaLiveRegion.textContent = '';
		ariaLiveRegion.setAttribute('aria-live', priority);

		// Set new message after a brief delay to ensure it's announced
		setTimeout(() => {
			ariaLiveRegion.textContent = message;
		}, 100);

		// Clear after announcement
		setTimeout(() => {
			ariaLiveRegion.textContent = '';
		}, 3000);
	}

	/**
	 * Create keyboard shortcuts modal
	 */
	function createShortcutsModal() {
		const existingModal = document.getElementById('keyboard-shortcuts-modal');
		if (existingModal) {
			existingModal.remove();
		}

		const modal = document.createElement('div');
		modal.id = 'keyboard-shortcuts-modal';
		modal.className = 'a11y-modal';
		modal.setAttribute('role', 'dialog');
		modal.setAttribute('aria-labelledby', 'shortcuts-modal-title');
		modal.setAttribute('aria-modal', 'true');

		const modalContent = `
			<div class="a11y-modal-overlay" data-modal-close></div>
			<div class="a11y-modal-content" role="document">
				<div class="a11y-modal-header">
					<h2 id="shortcuts-modal-title">Keyboard Shortcuts</h2>
					<button class="a11y-modal-close" data-modal-close aria-label="Close shortcuts menu">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="a11y-modal-body">
					<div class="shortcuts-grid">
						${Object.entries(KEYBOARD_SHORTCUTS)
							.map(([key, config]) => `
								<div class="shortcut-item">
									<kbd class="shortcut-key">${key === ' ' ? 'Space' : key}</kbd>
									<span class="shortcut-description">${config.description}</span>
								</div>
							`)
							.join('')}
					</div>
					<div class="shortcuts-footer">
						<p><strong>Tip:</strong> Press <kbd>Esc</kbd> to close any modal</p>
					</div>
				</div>
			</div>
		`;

		modal.innerHTML = modalContent;
		document.body.appendChild(modal);

		// Add event listeners for closing
		const closeElements = modal.querySelectorAll('[data-modal-close]');
		closeElements.forEach(el => {
			el.addEventListener('click', closeShortcutsModal);
		});

		// Focus trap
		trapFocusInModal(modal);

		// Focus the modal
		setTimeout(() => {
			const closeButton = modal.querySelector('.a11y-modal-close');
			if (closeButton) closeButton.focus();
		}, 100);

		return modal;
	}

	/**
	 * Trap focus within modal
	 * @param {HTMLElement} modal - The modal element
	 */
	function trapFocusInModal(modal) {
		const focusableElements = modal.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const firstFocusable = focusableElements[0];
		const lastFocusable = focusableElements[focusableElements.length - 1];

		modal.addEventListener('keydown', (e) => {
			if (e.key === 'Tab') {
				if (e.shiftKey) {
					// Shift + Tab
					if (document.activeElement === firstFocusable) {
						e.preventDefault();
						lastFocusable.focus();
					}
				} else {
					// Tab
					if (document.activeElement === lastFocusable) {
						e.preventDefault();
						firstFocusable.focus();
					}
				}
			}
		});
	}

	/**
	 * Open keyboard shortcuts modal
	 */
	function openShortcutsModal() {
		if (shortcutsModalOpen) return;

		createShortcutsModal();
		shortcutsModalOpen = true;
		document.body.style.overflow = 'hidden';
		announce('Keyboard shortcuts menu opened');
	}

	/**
	 * Close keyboard shortcuts modal
	 */
	function closeShortcutsModal() {
		const modal = document.getElementById('keyboard-shortcuts-modal');
		if (modal) {
			modal.remove();
			shortcutsModalOpen = false;
			document.body.style.overflow = '';
			announce('Keyboard shortcuts menu closed');
		}
	}

	/**
	 * Toggle keyboard shortcuts modal
	 */
	function toggleShortcutsMenu() {
		if (shortcutsModalOpen) {
			closeShortcutsModal();
		} else {
			openShortcutsModal();
		}
	}

	/**
	 * Toggle high contrast mode
	 */
	function toggleHighContrast() {
		highContrastMode = !highContrastMode;
		document.documentElement.setAttribute('data-high-contrast', highContrastMode);

		try {
			localStorage.setItem('feat_high_contrast', highContrastMode ? 'true' : 'false');
		} catch (e) {
			console.warn('Failed to save high contrast preference:', e);
		}

		announce(highContrastMode ? 'High contrast mode enabled' : 'High contrast mode disabled');
	}

	/**
	 * Initialize high contrast mode from localStorage
	 */
	function initHighContrastMode() {
		try {
			const saved = localStorage.getItem('feat_high_contrast');
			if (saved === 'true') {
				highContrastMode = true;
				document.documentElement.setAttribute('data-high-contrast', 'true');
			}
		} catch (e) {
			console.warn('Failed to load high contrast preference:', e);
		}
	}

	/**
	 * Keyboard shortcut actions
	 */
	const actions = {
		toggleShortcutsMenu,

		goHome() {
			const homeButton = document.querySelector('[data-view="dashboard"]');
			if (homeButton) {
				homeButton.click();
				announce('Navigated to dashboard');
			}
		},

		toggleDayView() {
			const dayButton = document.querySelector('[data-view="day"]');
			if (dayButton) {
				dayButton.click();
				announce('Switched to day view');
			}
		},

		toggleClassView() {
			const classButton = document.querySelector('[data-view="class"]');
			if (classButton) {
				classButton.click();
				announce('Switched to class view');
			}
		},

		toggleTeacherView() {
			const teacherButton = document.querySelector('[data-view="teacher"]');
			if (teacherButton) {
				teacherButton.click();
				announce('Switched to teacher view');
			}
		},

		goToCurrentPeriod() {
			const fabButton = document.getElementById('fab-go-now');
			if (fabButton) {
				fabButton.click();
				announce('Jumped to current period');
			}
		},

		toggleTheme() {
			const themeToggle = document.getElementById('theme-toggle');
			if (themeToggle) {
				themeToggle.click();
				const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
				announce(isDark ? 'Dark mode enabled' : 'Light mode enabled');
			}
		},

		toggleHighContrast,

		closeModal() {
			if (shortcutsModalOpen) {
				closeShortcutsModal();
			}
		},

		focusSearch() {
			const searchInput = document.querySelector('input[type="search"], input[type="text"]');
			if (searchInput) {
				searchInput.focus();
				announce('Search focused');
			}
		}
	};

	/**
	 * Handle keyboard shortcuts
	 * @param {KeyboardEvent} e - The keyboard event
	 */
	function handleKeyboardShortcut(e) {
		// Don't trigger shortcuts when typing in inputs
		if (e.target.matches('input, textarea, select')) {
			return;
		}

		// Get the key
		const key = e.key;

		// Check if this key has an action
		const shortcut = KEYBOARD_SHORTCUTS[key];
		if (shortcut && actions[shortcut.action]) {
			e.preventDefault();
			actions[shortcut.action]();
		}
	}

	/**
	 * Enhance focus indicators
	 */
	function enhanceFocusIndicators() {
		// Add keyboard user detection
		document.body.addEventListener('mousedown', () => {
			document.body.classList.add('using-mouse');
		});

		document.body.addEventListener('keydown', (e) => {
			if (e.key === 'Tab') {
				document.body.classList.remove('using-mouse');
			}
		});
	}

	/**
	 * Improve ARIA labels throughout the app
	 */
	function improveAriaLabels() {
		// Add labels to navigation buttons if missing
		const navButtons = document.querySelectorAll('.nav-button');
		navButtons.forEach(button => {
			if (!button.getAttribute('aria-label') && button.textContent) {
				button.setAttribute('aria-label', button.textContent.trim());
			}
		});

		// Add role and aria-label to main content area if missing
		const mainContent = document.querySelector('main, #app, .content');
		if (mainContent && !mainContent.getAttribute('role')) {
			mainContent.setAttribute('role', 'main');
		}

		// Improve table accessibility
		const tables = document.querySelectorAll('table:not([role])');
		tables.forEach(table => {
			table.setAttribute('role', 'table');
		});
	}

	/**
	 * Add skip to main content link
	 */
	function addSkipLink() {
		const existingSkipLink = document.getElementById('skip-to-main');
		if (existingSkipLink) return;

		const skipLink = document.createElement('a');
		skipLink.id = 'skip-to-main';
		skipLink.href = '#main-content';
		skipLink.className = 'skip-link';
		skipLink.textContent = 'Skip to main content';

		// Add main content ID if not present
		const mainContent = document.querySelector('main, #app, .content');
		if (mainContent && !mainContent.id) {
			mainContent.id = 'main-content';
		}

		document.body.insertBefore(skipLink, document.body.firstChild);
	}

	/**
	 * Monitor view changes and announce them
	 */
	function monitorViewChanges() {
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				// Check for view changes
				if (mutation.type === 'childList') {
					const viewTitle = document.querySelector('h1, h2, .view-title');
					if (viewTitle && mutation.addedNodes.length > 0) {
						// Debounce announcements
						clearTimeout(monitorViewChanges.timeout);
						monitorViewChanges.timeout = setTimeout(() => {
							announce(`View updated: ${viewTitle.textContent}`);
						}, 500);
					}
				}
			});
		});

		const appContainer = document.querySelector('#app, main, .content');
		if (appContainer) {
			observer.observe(appContainer, {
				childList: true,
				subtree: true
			});
		}
	}

	/**
	 * Initialize keyboard navigation enhancements
	 */
	function initKeyboardNavigation() {
		// Make interactive elements keyboard accessible
		const interactiveElements = document.querySelectorAll('.timetable-row, .card[onclick], [onclick]:not([tabindex])');
		interactiveElements.forEach(el => {
			if (!el.hasAttribute('tabindex')) {
				el.setAttribute('tabindex', '0');
			}
			if (!el.hasAttribute('role')) {
				el.setAttribute('role', 'button');
			}

			// Add keyboard event if missing
			el.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					el.click();
				}
			});
		});
	}

	/**
	 * Initialize the accessibility module
	 */
	function init() {
		if (!isFeatureEnabled()) {
			console.log('Accessibility features disabled');
			return;
		}

		console.log('🎯 Initializing accessibility features...');

		// Create ARIA live region
		createAriaLiveRegion();

		// Initialize high contrast mode
		initHighContrastMode();

		// Add keyboard shortcuts listener
		document.addEventListener('keydown', handleKeyboardShortcut);

		// Enhance focus indicators
		enhanceFocusIndicators();

		// Improve ARIA labels
		improveAriaLabels();

		// Add skip link
		addSkipLink();

		// Monitor view changes
		monitorViewChanges();

		// Initialize keyboard navigation
		initKeyboardNavigation();

		// Announce that accessibility features are ready
		setTimeout(() => {
			announce('Accessibility features loaded. Press ? for keyboard shortcuts.');
		}, 1000);

		console.log('✓ Accessibility features initialized');
	}

	/**
	 * Disable accessibility features (rollback)
	 */
	function disable() {
		document.removeEventListener('keydown', handleKeyboardShortcut);
		closeShortcutsModal();

		if (ariaLiveRegion) {
			ariaLiveRegion.remove();
			ariaLiveRegion = null;
		}

		const skipLink = document.getElementById('skip-to-main');
		if (skipLink) skipLink.remove();

		console.log('✓ Accessibility features disabled');
	}

	// Public API
	window.A11y = {
		init,
		disable,
		isEnabled: isFeatureEnabled,
		announce,
		toggleShortcutsMenu,
		openShortcutsModal,
		closeShortcutsModal,
		toggleHighContrast,
		FEATURE_FLAG
	};

	// Auto-initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})();
