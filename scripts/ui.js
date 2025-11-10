/**
 * Modern UI Components - Veer Patta Public School Timetable
 *
 * @fileoverview Provides modern UI components including FAB, bottom sheets,
 * filter chips, snackbars, pull-to-refresh, and swipeable cards.
 *
 * @version 1.0.0
 * @license MIT
 *
 * Feature Flag: feat_modern_ui
 *
 * Components:
 * - ModernFAB: Floating Action Button with expandable sub-actions
 * - ModernBottomSheet: Mobile-optimized bottom sheet / modal dialog
 * - ModernFilterChips: Interactive filter chip component
 * - ModernSnackbar: Accessible notification system (replaces toasts)
 * - ModernPullRefresh: Pull-to-refresh for mobile
 * - ModernSwipeCard: Swipeable cards with touch gestures
 *
 * @example
 * // Enable the feature
 * ModernUI.enable();
 *
 * // Create a FAB
 * const fab = ModernUI.createFAB({
 *   icon: 'plus',
 *   actions: [
 *     { icon: 'calendar', label: 'Add Event', onClick: () => {} }
 *   ]
 * });
 *
 * // Show a snackbar
 * ModernUI.showSnackbar('Operation successful', { type: 'success' });
 */

(function() {
    'use strict';

    // ============================================
    // FEATURE FLAG CHECK
    // ============================================
    const FEATURE_FLAG = 'feat_modern_ui';

    /**
     * Checks if modern UI feature is enabled
     * @returns {boolean} True if feature is enabled
     */
    function isFeatureEnabled() {
        if (typeof window.FEATURE_FLAGS !== 'undefined' && window.FEATURE_FLAGS[FEATURE_FLAG] !== undefined) {
            return window.FEATURE_FLAGS[FEATURE_FLAG] === true;
        }
        const stored = localStorage.getItem(FEATURE_FLAG);
        return stored === 'true' || stored === '1' || stored === 'enabled';
    }

    // ============================================
    // ICON HELPER (Lucide Icons)
    // ============================================

    /**
     * Creates an SVG icon element
     * @param {string} name - Icon name
     * @param {number} size - Icon size in pixels
     * @returns {SVGElement} SVG element
     */
    function createIcon(name, size = 24) {
        const icons = {
            plus: 'M12 5v14m-7-7h14',
            x: 'M18 6L6 18M6 6l12 12',
            'chevron-down': 'M6 9l6 6 6-6',
            calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
            filter: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
            'check-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            'alert-circle': 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            'alert-triangle': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
            info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
            edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
            share: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
            'arrow-down': 'M19 14l-7 7m0 0l-7-7m7 7V3'
        };

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');

        if (icons[name]) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', icons[name]);
            svg.appendChild(path);
        }

        return svg;
    }

    // ============================================
    // 1. FLOATING ACTION BUTTON (FAB)
    // ============================================

    /**
     * ModernFAB - Floating Action Button with expandable sub-actions
     *
     * @class
     * @example
     * const fab = new ModernFAB({
     *   icon: 'plus',
     *   ariaLabel: 'Actions',
     *   actions: [
     *     { icon: 'calendar', label: 'Add Event', onClick: () => console.log('Add event') }
     *   ]
     * });
     * document.body.appendChild(fab.element);
     */
    class ModernFAB {
        /**
         * @param {Object} options - Configuration options
         * @param {string} options.icon - Main FAB icon name
         * @param {string} options.ariaLabel - Accessibility label
         * @param {Array<Object>} options.actions - Sub-action buttons
         */
        constructor(options = {}) {
            this.options = {
                icon: options.icon || 'plus',
                ariaLabel: options.ariaLabel || 'Actions',
                actions: options.actions || []
            };

            this.isExpanded = false;
            this.element = this.createFAB();
            this.bindEvents();
        }

        createFAB() {
            const container = document.createElement('div');
            container.className = 'modern-fab-container';

            // Main FAB button
            const fab = document.createElement('button');
            fab.className = 'modern-fab';
            fab.setAttribute('aria-label', this.options.ariaLabel);
            fab.setAttribute('aria-expanded', 'false');
            fab.setAttribute('aria-haspopup', 'true');
            fab.appendChild(createIcon(this.options.icon));
            this.fab = fab;

            // Sub-actions container
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'modern-fab-actions';
            actionsContainer.setAttribute('role', 'menu');
            this.actionsContainer = actionsContainer;

            // Create sub-action buttons
            this.options.actions.forEach((action, index) => {
                const actionWrapper = document.createElement('div');
                actionWrapper.className = 'modern-fab-action';

                const button = document.createElement('button');
                button.className = 'modern-fab-action-button';
                button.setAttribute('role', 'menuitem');
                button.setAttribute('aria-label', action.label);
                button.appendChild(createIcon(action.icon, 20));
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (action.onClick) action.onClick();
                    this.collapse();
                });

                const label = document.createElement('span');
                label.className = 'modern-fab-action-label';
                label.textContent = action.label;

                actionWrapper.appendChild(label);
                actionWrapper.appendChild(button);
                actionsContainer.appendChild(actionWrapper);
            });

            // Backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modern-fab-backdrop';
            backdrop.setAttribute('aria-hidden', 'true');
            this.backdrop = backdrop;

            container.appendChild(actionsContainer);
            container.appendChild(fab);

            return container;
        }

        bindEvents() {
            this.fab.addEventListener('click', () => this.toggle());

            // Close on backdrop click
            if (this.backdrop) {
                this.backdrop.addEventListener('click', () => this.collapse());
            }

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isExpanded) {
                    this.collapse();
                }
            });
        }

        toggle() {
            this.isExpanded ? this.collapse() : this.expand();
        }

        expand() {
            if (this.isExpanded) return;

            this.isExpanded = true;
            this.fab.classList.add('expanded');
            this.fab.setAttribute('aria-expanded', 'true');
            this.actionsContainer.classList.add('expanded');

            // Add backdrop to body
            if (this.backdrop && !document.body.contains(this.backdrop)) {
                document.body.appendChild(this.backdrop);
                setTimeout(() => this.backdrop.classList.add('visible'), 10);
            }

            // Announce to screen readers
            this.announce('Actions menu expanded');
        }

        collapse() {
            if (!this.isExpanded) return;

            this.isExpanded = false;
            this.fab.classList.remove('expanded');
            this.fab.setAttribute('aria-expanded', 'false');
            this.actionsContainer.classList.remove('expanded');

            if (this.backdrop) {
                this.backdrop.classList.remove('visible');
                setTimeout(() => {
                    if (this.backdrop.parentNode) {
                        this.backdrop.parentNode.removeChild(this.backdrop);
                    }
                }, 300);
            }

            // Announce to screen readers
            this.announce('Actions menu collapsed');
        }

        announce(message) {
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'sr-only';
            announcement.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
            announcement.textContent = message;
            document.body.appendChild(announcement);
            setTimeout(() => document.body.removeChild(announcement), 1000);
        }

        destroy() {
            if (this.backdrop && this.backdrop.parentNode) {
                this.backdrop.parentNode.removeChild(this.backdrop);
            }
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }
    }

    // ============================================
    // 2. BOTTOM SHEET
    // ============================================

    /**
     * ModernBottomSheet - Mobile-optimized bottom sheet / modal dialog
     *
     * @class
     * @example
     * const sheet = new ModernBottomSheet({
     *   title: 'Options',
     *   content: '<p>Sheet content</p>'
     * });
     * sheet.show();
     */
    class ModernBottomSheet {
        /**
         * @param {Object} options - Configuration options
         * @param {string} options.title - Sheet title
         * @param {string|HTMLElement} options.content - Sheet content
         * @param {Function} options.onClose - Close callback
         */
        constructor(options = {}) {
            this.options = {
                title: options.title || 'Sheet',
                content: options.content || '',
                onClose: options.onClose || null
            };

            this.isVisible = false;
            this.element = this.createSheet();
            this.bindEvents();
        }

        createSheet() {
            // Backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modern-bottom-sheet-backdrop';
            backdrop.setAttribute('aria-hidden', 'true');
            this.backdrop = backdrop;

            // Sheet container
            const sheet = document.createElement('div');
            sheet.className = 'modern-bottom-sheet';
            sheet.setAttribute('role', 'dialog');
            sheet.setAttribute('aria-modal', 'true');
            sheet.setAttribute('aria-labelledby', 'bottom-sheet-title');

            // Handle for dragging
            const handle = document.createElement('div');
            handle.className = 'modern-bottom-sheet-handle';
            handle.setAttribute('aria-hidden', 'true');
            this.handle = handle;

            // Header
            const header = document.createElement('div');
            header.className = 'modern-bottom-sheet-header';

            const title = document.createElement('h2');
            title.className = 'modern-bottom-sheet-title';
            title.id = 'bottom-sheet-title';
            title.textContent = this.options.title;

            const closeBtn = document.createElement('button');
            closeBtn.className = 'modern-bottom-sheet-close';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.appendChild(createIcon('x', 20));
            this.closeBtn = closeBtn;

            header.appendChild(title);
            header.appendChild(closeBtn);

            // Content
            const content = document.createElement('div');
            content.className = 'modern-bottom-sheet-content';
            if (typeof this.options.content === 'string') {
                content.innerHTML = this.options.content;
            } else if (this.options.content instanceof HTMLElement) {
                content.appendChild(this.options.content);
            }
            this.contentEl = content;

            sheet.appendChild(handle);
            sheet.appendChild(header);
            sheet.appendChild(content);
            this.sheet = sheet;

            return sheet;
        }

        bindEvents() {
            this.closeBtn.addEventListener('click', () => this.hide());
            this.backdrop.addEventListener('click', () => this.hide());

            // Handle swipe-to-dismiss
            let startY = 0;
            let currentY = 0;
            let isDragging = false;

            const onStart = (e) => {
                if (window.innerWidth >= 768) return; // Desktop: no swipe
                const touch = e.touches ? e.touches[0] : e;
                startY = touch.clientY;
                isDragging = true;
                this.sheet.style.transition = 'none';
            };

            const onMove = (e) => {
                if (!isDragging) return;
                const touch = e.touches ? e.touches[0] : e;
                currentY = touch.clientY;
                const deltaY = currentY - startY;

                if (deltaY > 0) {
                    this.sheet.style.transform = `translateY(${deltaY}px)`;
                }
            };

            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                const deltaY = currentY - startY;
                this.sheet.style.transition = '';

                if (deltaY > 100) {
                    this.hide();
                } else {
                    this.sheet.style.transform = '';
                }
            };

            this.handle.addEventListener('touchstart', onStart);
            this.handle.addEventListener('touchmove', onMove);
            this.handle.addEventListener('touchend', onEnd);

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible) {
                    this.hide();
                }
            });
        }

        show() {
            if (this.isVisible) return;

            document.body.appendChild(this.backdrop);
            document.body.appendChild(this.sheet);

            // Trigger reflow for animation
            requestAnimationFrame(() => {
                this.backdrop.classList.add('visible');
                this.sheet.classList.add('visible');
                this.isVisible = true;

                // Focus management
                this.previousFocus = document.activeElement;
                this.closeBtn.focus();

                // Prevent body scroll
                document.body.style.overflow = 'hidden';
            });
        }

        hide() {
            if (!this.isVisible) return;

            this.backdrop.classList.remove('visible');
            this.sheet.classList.remove('visible');
            this.isVisible = false;

            setTimeout(() => {
                if (this.backdrop.parentNode) this.backdrop.parentNode.removeChild(this.backdrop);
                if (this.sheet.parentNode) this.sheet.parentNode.removeChild(this.sheet);

                // Restore body scroll
                document.body.style.overflow = '';

                // Restore focus
                if (this.previousFocus) {
                    this.previousFocus.focus();
                }

                if (this.options.onClose) {
                    this.options.onClose();
                }
            }, 300);
        }

        setContent(content) {
            if (typeof content === 'string') {
                this.contentEl.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                this.contentEl.innerHTML = '';
                this.contentEl.appendChild(content);
            }
        }

        destroy() {
            this.hide();
        }
    }

    // ============================================
    // 3. FILTER CHIPS
    // ============================================

    /**
     * ModernFilterChips - Interactive filter chip component
     *
     * @class
     * @example
     * const chips = new ModernFilterChips({
     *   chips: [
     *     { id: 'all', label: 'All', active: true },
     *     { id: 'math', label: 'Math' }
     *   ],
     *   onChange: (activeChips) => console.log(activeChips)
     * });
     * document.querySelector('#filter-container').appendChild(chips.element);
     */
    class ModernFilterChips {
        /**
         * @param {Object} options - Configuration options
         * @param {Array<Object>} options.chips - Chip definitions
         * @param {boolean} options.multiple - Allow multiple active chips
         * @param {Function} options.onChange - Change callback
         */
        constructor(options = {}) {
            this.options = {
                chips: options.chips || [],
                multiple: options.multiple !== false,
                onChange: options.onChange || null
            };

            this.activeChips = new Set(
                this.options.chips.filter(c => c.active).map(c => c.id)
            );

            this.element = this.createChips();
        }

        createChips() {
            const container = document.createElement('div');
            container.className = 'modern-filter-chips';
            container.setAttribute('role', 'group');
            container.setAttribute('aria-label', 'Filter options');

            this.options.chips.forEach(chip => {
                const chipEl = this.createChip(chip);
                container.appendChild(chipEl);
            });

            return container;
        }

        createChip(chip) {
            const button = document.createElement('button');
            button.className = 'modern-chip';
            button.setAttribute('role', 'switch');
            button.setAttribute('aria-checked', this.activeChips.has(chip.id) ? 'true' : 'false');
            button.setAttribute('data-chip-id', chip.id);

            if (chip.icon) {
                button.appendChild(createIcon(chip.icon, 16));
            }

            const label = document.createElement('span');
            label.textContent = chip.label;
            button.appendChild(label);

            if (this.activeChips.has(chip.id)) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => this.toggleChip(chip.id));

            return button;
        }

        toggleChip(chipId) {
            if (this.options.multiple) {
                if (this.activeChips.has(chipId)) {
                    this.activeChips.delete(chipId);
                } else {
                    this.activeChips.add(chipId);
                }
            } else {
                this.activeChips.clear();
                this.activeChips.add(chipId);
            }

            this.updateUI();

            if (this.options.onChange) {
                this.options.onChange(Array.from(this.activeChips));
            }
        }

        updateUI() {
            const buttons = this.element.querySelectorAll('.modern-chip');
            buttons.forEach(button => {
                const chipId = button.getAttribute('data-chip-id');
                const isActive = this.activeChips.has(chipId);

                button.classList.toggle('active', isActive);
                button.setAttribute('aria-checked', isActive ? 'true' : 'false');
            });
        }

        getActiveChips() {
            return Array.from(this.activeChips);
        }

        setActiveChips(chipIds) {
            this.activeChips = new Set(chipIds);
            this.updateUI();
        }

        destroy() {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }
    }

    // ============================================
    // 4. SNACKBAR (Accessible Notifications)
    // ============================================

    /**
     * ModernSnackbar - Accessible notification system
     * Replaces the legacy toast system with improved accessibility
     *
     * @namespace
     */
    const ModernSnackbar = {
        container: null,
        queue: [],
        activeSnackbars: [],

        /**
         * Initialize the snackbar container
         */
        init() {
            if (this.container) return;

            this.container = document.createElement('div');
            this.container.className = 'modern-snackbar-container';
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this.container);
        },

        /**
         * Show a snackbar notification
         * @param {string} message - Notification message
         * @param {Object} options - Configuration options
         * @param {string} options.type - Type: 'info', 'success', 'error', 'warning'
         * @param {number} options.duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
         * @param {string} options.actionLabel - Action button label
         * @param {Function} options.onAction - Action button callback
         * @returns {Object} Snackbar instance with dismiss() method
         */
        show(message, options = {}) {
            this.init();

            const config = {
                type: options.type || 'info',
                duration: options.duration !== undefined ? options.duration : 4000,
                actionLabel: options.actionLabel || null,
                onAction: options.onAction || null
            };

            const snackbar = this.createSnackbar(message, config);
            this.container.appendChild(snackbar.element);

            // Animate in
            requestAnimationFrame(() => {
                snackbar.element.classList.add('visible');
            });

            this.activeSnackbars.push(snackbar);

            // Auto-dismiss
            if (config.duration > 0) {
                snackbar.timeout = setTimeout(() => {
                    this.dismiss(snackbar);
                }, config.duration);
            }

            return snackbar;
        },

        /**
         * Create a snackbar element
         * @private
         */
        createSnackbar(message, config) {
            const element = document.createElement('div');
            element.className = `modern-snackbar ${config.type}`;
            element.setAttribute('role', 'status');

            // Icon
            const iconMap = {
                success: 'check-circle',
                error: 'alert-circle',
                warning: 'alert-triangle',
                info: 'info'
            };
            const icon = createIcon(iconMap[config.type] || 'info', 20);
            icon.className = 'modern-snackbar-icon';
            element.appendChild(icon);

            // Message
            const messageEl = document.createElement('span');
            messageEl.className = 'modern-snackbar-message';
            messageEl.textContent = message;
            element.appendChild(messageEl);

            // Action button
            if (config.actionLabel && config.onAction) {
                const actionBtn = document.createElement('button');
                actionBtn.className = 'modern-snackbar-action';
                actionBtn.textContent = config.actionLabel;
                actionBtn.addEventListener('click', () => {
                    config.onAction();
                    this.dismiss(snackbar);
                });
                element.appendChild(actionBtn);
            }

            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modern-snackbar-close';
            closeBtn.setAttribute('aria-label', 'Close notification');
            closeBtn.appendChild(createIcon('x', 18));
            closeBtn.addEventListener('click', () => {
                this.dismiss(snackbar);
            });
            element.appendChild(closeBtn);

            const snackbar = {
                element,
                timeout: null,
                dismiss: () => this.dismiss(snackbar)
            };

            return snackbar;
        },

        /**
         * Dismiss a snackbar
         * @param {Object} snackbar - Snackbar instance
         */
        dismiss(snackbar) {
            if (!snackbar || !snackbar.element) return;

            if (snackbar.timeout) {
                clearTimeout(snackbar.timeout);
            }

            snackbar.element.classList.remove('visible');
            snackbar.element.classList.add('hiding');

            setTimeout(() => {
                if (snackbar.element.parentNode) {
                    snackbar.element.parentNode.removeChild(snackbar.element);
                }

                const index = this.activeSnackbars.indexOf(snackbar);
                if (index > -1) {
                    this.activeSnackbars.splice(index, 1);
                }
            }, 300);
        },

        /**
         * Dismiss all active snackbars
         */
        dismissAll() {
            [...this.activeSnackbars].forEach(snackbar => this.dismiss(snackbar));
        }
    };

    // ============================================
    // 5. PULL-TO-REFRESH
    // ============================================

    /**
     * ModernPullRefresh - Pull-to-refresh for mobile
     *
     * @class
     * @example
     * const pullRefresh = new ModernPullRefresh({
     *   container: document.querySelector('#main'),
     *   onRefresh: async () => {
     *     await fetchData();
     *   }
     * });
     */
    class ModernPullRefresh {
        /**
         * @param {Object} options - Configuration options
         * @param {HTMLElement} options.container - Container element
         * @param {Function} options.onRefresh - Refresh callback (async)
         * @param {number} options.threshold - Pull threshold in pixels
         */
        constructor(options = {}) {
            this.options = {
                container: options.container || document.body,
                onRefresh: options.onRefresh || (() => Promise.resolve()),
                threshold: options.threshold || 80
            };

            this.startY = 0;
            this.currentY = 0;
            this.isDragging = false;
            this.isRefreshing = false;

            this.element = this.createIndicator();
            this.init();
        }

        createIndicator() {
            const container = document.createElement('div');
            container.className = 'modern-pull-refresh-indicator';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');

            const spinner = document.createElement('div');
            spinner.className = 'modern-pull-refresh-spinner';
            this.spinner = spinner;

            const icon = createIcon('arrow-down', 24);
            icon.className = 'modern-pull-refresh-icon';
            this.icon = icon;

            container.appendChild(spinner);
            container.appendChild(icon);

            this.indicator = container;
            return container;
        }

        init() {
            // Only enable on mobile/touch devices
            if (!('ontouchstart' in window)) return;

            this.options.container.style.position = 'relative';
            this.options.container.insertBefore(this.element, this.options.container.firstChild);

            this.bindEvents();
        }

        bindEvents() {
            const container = this.options.container;

            const onStart = (e) => {
                if (this.isRefreshing || container.scrollTop > 0) return;

                const touch = e.touches[0];
                this.startY = touch.clientY;
                this.isDragging = true;
                this.indicator.classList.add('pulling');
            };

            const onMove = (e) => {
                if (!this.isDragging) return;

                const touch = e.touches[0];
                this.currentY = touch.clientY;
                const deltaY = this.currentY - this.startY;

                if (deltaY > 0 && container.scrollTop === 0) {
                    e.preventDefault();

                    // Apply rubber-band effect
                    const pullDistance = Math.min(deltaY * 0.5, this.options.threshold * 1.5);
                    this.indicator.style.top = `${pullDistance - 60}px`;

                    if (pullDistance >= this.options.threshold) {
                        this.indicator.classList.add('can-refresh');
                        this.announceToScreenReader('Release to refresh');
                    } else {
                        this.indicator.classList.remove('can-refresh');
                    }
                }
            };

            const onEnd = () => {
                if (!this.isDragging) return;

                this.isDragging = false;
                this.indicator.classList.remove('pulling');

                const deltaY = this.currentY - this.startY;
                const pullDistance = deltaY * 0.5;

                if (pullDistance >= this.options.threshold) {
                    this.refresh();
                } else {
                    this.reset();
                }
            };

            container.addEventListener('touchstart', onStart, { passive: false });
            container.addEventListener('touchmove', onMove, { passive: false });
            container.addEventListener('touchend', onEnd);
            container.addEventListener('touchcancel', onEnd);
        }

        async refresh() {
            if (this.isRefreshing) return;

            this.isRefreshing = true;
            this.indicator.classList.add('refreshing');
            this.indicator.classList.remove('can-refresh');
            this.spinner.style.display = 'block';
            this.icon.style.display = 'none';

            this.announceToScreenReader('Refreshing');

            try {
                await this.options.onRefresh();
                this.announceToScreenReader('Refresh complete');
            } catch (error) {
                console.error('Refresh failed:', error);
                this.announceToScreenReader('Refresh failed');
            }

            setTimeout(() => {
                this.reset();
                this.isRefreshing = false;
            }, 500);
        }

        reset() {
            this.indicator.classList.remove('refreshing', 'can-refresh');
            this.indicator.style.top = '';
            this.spinner.style.display = 'none';
            this.icon.style.display = 'block';
        }

        announceToScreenReader(message) {
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'sr-only';
            announcement.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
            announcement.textContent = message;
            document.body.appendChild(announcement);
            setTimeout(() => document.body.removeChild(announcement), 1000);
        }

        destroy() {
            if (this.indicator.parentNode) {
                this.indicator.parentNode.removeChild(this.indicator);
            }
        }
    }

    // ============================================
    // 6. SWIPEABLE CARDS
    // ============================================

    /**
     * ModernSwipeCard - Swipeable cards with touch gestures
     *
     * @class
     * @example
     * const card = new ModernSwipeCard({
     *   element: document.querySelector('.card'),
     *   leftActions: [
     *     { icon: 'check-circle', type: 'success', onAction: () => {} }
     *   ],
     *   rightActions: [
     *     { icon: 'trash', type: 'danger', onAction: () => {} }
     *   ]
     * });
     */
    class ModernSwipeCard {
        /**
         * @param {Object} options - Configuration options
         * @param {HTMLElement} options.element - Card element
         * @param {Array<Object>} options.leftActions - Left swipe actions
         * @param {Array<Object>} options.rightActions - Right swipe actions
         * @param {number} options.threshold - Swipe threshold in pixels
         */
        constructor(options = {}) {
            this.options = {
                element: options.element,
                leftActions: options.leftActions || [],
                rightActions: options.rightActions || [],
                threshold: options.threshold || 100
            };

            if (!this.options.element) {
                throw new Error('ModernSwipeCard requires an element');
            }

            this.startX = 0;
            this.currentX = 0;
            this.isDragging = false;
            this.element = this.options.element;

            this.init();
        }

        init() {
            this.element.classList.add('modern-swipeable-card');

            // Create content wrapper
            const content = document.createElement('div');
            content.className = 'modern-swipeable-card-content';
            while (this.element.firstChild) {
                content.appendChild(this.element.firstChild);
            }
            this.content = content;

            // Create action containers
            if (this.options.leftActions.length > 0) {
                const leftActions = this.createActionsContainer(this.options.leftActions, 'left');
                this.element.appendChild(leftActions);
            }

            if (this.options.rightActions.length > 0) {
                const rightActions = this.createActionsContainer(this.options.rightActions, 'right');
                this.element.appendChild(rightActions);
            }

            this.element.appendChild(content);

            this.bindEvents();
        }

        createActionsContainer(actions, side) {
            const container = document.createElement('div');
            container.className = `modern-swipeable-card-actions ${side}`;

            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = `modern-swipeable-action ${action.type || 'primary'}`;
                button.setAttribute('aria-label', action.label || 'Action');
                button.appendChild(createIcon(action.icon, 20));
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (action.onAction) action.onAction();
                    this.reset();
                });
                container.appendChild(button);
            });

            return container;
        }

        bindEvents() {
            const onStart = (e) => {
                const touch = e.touches ? e.touches[0] : e;
                this.startX = touch.clientX;
                this.isDragging = true;
                this.element.classList.add('swiping');
            };

            const onMove = (e) => {
                if (!this.isDragging) return;

                const touch = e.touches ? e.touches[0] : e;
                this.currentX = touch.clientX;
                const deltaX = this.currentX - this.startX;

                // Only allow swiping if actions exist
                if (deltaX > 0 && this.options.leftActions.length === 0) return;
                if (deltaX < 0 && this.options.rightActions.length === 0) return;

                this.content.style.transform = `translateX(${deltaX}px)`;
            };

            const onEnd = () => {
                if (!this.isDragging) return;

                this.isDragging = false;
                this.element.classList.remove('swiping');

                const deltaX = this.currentX - this.startX;

                if (Math.abs(deltaX) >= this.options.threshold) {
                    // Snap to actions
                    if (deltaX > 0) {
                        this.content.style.transform = 'translateX(100px)';
                    } else {
                        this.content.style.transform = 'translateX(-100px)';
                    }
                } else {
                    // Reset
                    this.reset();
                }
            };

            this.element.addEventListener('touchstart', onStart, { passive: true });
            this.element.addEventListener('touchmove', onMove, { passive: true });
            this.element.addEventListener('touchend', onEnd);
            this.element.addEventListener('touchcancel', onEnd);

            // Mouse support for desktop testing
            this.element.addEventListener('mousedown', onStart);
            document.addEventListener('mousemove', (e) => {
                if (this.isDragging) onMove(e);
            });
            document.addEventListener('mouseup', onEnd);
        }

        reset() {
            this.content.style.transform = '';
        }

        destroy() {
            this.element.classList.remove('modern-swipeable-card', 'swiping');
            // Note: Full cleanup would require removing event listeners
        }
    }

    // ============================================
    // PUBLIC API
    // ============================================

    /**
     * ModernUI - Public API for modern UI components
     * @namespace
     */
    window.ModernUI = {
        /**
         * Check if feature is enabled
         * @returns {boolean}
         */
        isEnabled() {
            return isFeatureEnabled();
        },

        /**
         * Enable the feature
         */
        enable() {
            localStorage.setItem(FEATURE_FLAG, 'true');
            if (typeof window.FEATURE_FLAGS !== 'undefined') {
                window.FEATURE_FLAGS[FEATURE_FLAG] = true;
            }
            console.log('✓ Modern UI components enabled');
        },

        /**
         * Disable the feature
         */
        disable() {
            localStorage.setItem(FEATURE_FLAG, 'false');
            if (typeof window.FEATURE_FLAGS !== 'undefined') {
                window.FEATURE_FLAGS[FEATURE_FLAG] = false;
            }
            console.log('✗ Modern UI components disabled');
        },

        /**
         * Component classes
         */
        FAB: ModernFAB,
        BottomSheet: ModernBottomSheet,
        FilterChips: ModernFilterChips,
        Snackbar: ModernSnackbar,
        PullRefresh: ModernPullRefresh,
        SwipeCard: ModernSwipeCard,

        /**
         * Quick helpers
         */
        createFAB: (options) => new ModernFAB(options),
        createBottomSheet: (options) => new ModernBottomSheet(options),
        createFilterChips: (options) => new ModernFilterChips(options),
        createPullRefresh: (options) => new ModernPullRefresh(options),
        createSwipeCard: (options) => new ModernSwipeCard(options),

        /**
         * Show a snackbar (convenient shorthand)
         * @param {string} message - Message text
         * @param {Object} options - Configuration options
         * @returns {Object} Snackbar instance
         */
        showSnackbar(message, options) {
            return ModernSnackbar.show(message, options);
        },

        /**
         * Initialize all components automatically
         */
        initAll() {
            if (!isFeatureEnabled()) {
                console.log('Modern UI components are disabled');
                return;
            }

            console.log('🚀 Initializing Modern UI components...');

            // Initialize snackbar container
            ModernSnackbar.init();

            // Auto-convert legacy cards to swipeable
            document.querySelectorAll('[data-swipeable="true"]').forEach(card => {
                try {
                    new ModernSwipeCard({ element: card });
                } catch (e) {
                    console.warn('Failed to initialize swipeable card:', e);
                }
            });

            console.log('✓ Modern UI components initialized');
        }
    };

    // ============================================
    // AUTO-INITIALIZATION
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (isFeatureEnabled()) {
                window.ModernUI.initAll();
            }
        });
    } else {
        if (isFeatureEnabled()) {
            window.ModernUI.initAll();
        }
    }

    console.log('Modern UI module loaded. Use ModernUI.enable() to activate.');

})();
