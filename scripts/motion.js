/**
 * Motion System for VPPS Timetable Command Center
 *
 * Provides micro-interactions and animations:
 * - Page transitions
 * - Counter animations
 * - Ripple effects
 * - Stagger animations
 * - Scroll reveal
 * - Loading skeletons
 *
 * Respects prefers-reduced-motion and feat_motion feature flag
 */

(function(window) {
    'use strict';

    /**
     * Motion System Class
     */
    class MotionSystem {
        constructor() {
            this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.isEnabled = true;
            this.observers = new Set();
            this.activeAnimations = new Map();

            // Listen for motion preference changes
            this.setupMediaQueryListener();
        }

        /**
         * Initialize the motion system
         */
        init() {
            // Check feature flag
            if (window.FEATURE_FLAGS && window.FEATURE_FLAGS.feat_motion === false) {
                console.log('[Motion] Motion feature is disabled via feature flag');
                this.isEnabled = false;
                return;
            }

            // Setup scroll reveal observer
            this.setupScrollReveal();

            // Setup ripple effects
            this.setupRippleEffects();

            console.log('[Motion] Motion system initialized', {
                enabled: this.isEnabled,
                reducedMotion: this.prefersReducedMotion
            });
        }

        /**
         * Setup media query listener for motion preferences
         */
        setupMediaQueryListener() {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

            mediaQuery.addEventListener('change', (e) => {
                this.prefersReducedMotion = e.matches;
                console.log('[Motion] Reduced motion preference changed:', e.matches);
            });
        }

        /**
         * Check if motion should be applied
         */
        shouldAnimate() {
            return this.isEnabled && !this.prefersReducedMotion;
        }

        /**
         * Page transition animation
         * @param {HTMLElement} element - Element to animate
         * @param {string} type - Transition type ('slide', 'fade', 'scale')
         * @param {Function} callback - Optional callback after animation
         */
        pageTransition(element, type = 'slide', callback = null) {
            if (!this.shouldAnimate() || !element) {
                if (callback) callback();
                return;
            }

            // Remove old classes
            element.classList.remove('motion-slide-enter', 'motion-fade-enter', 'motion-scale-enter');

            // Add appropriate class
            const className = `motion-${type}-enter`;
            element.classList.add(className);

            // Clean up after animation
            const cleanup = () => {
                element.classList.remove(className);
                if (callback) callback();
            };

            element.addEventListener('animationend', cleanup, { once: true });
        }

        /**
         * Exit transition animation
         * @param {HTMLElement} element - Element to animate out
         * @param {string} type - Transition type ('slide', 'fade')
         * @param {Function} callback - Callback after animation
         */
        pageTransitionExit(element, type = 'slide', callback = null) {
            if (!this.shouldAnimate() || !element) {
                if (callback) callback();
                return;
            }

            const className = `motion-${type}-exit`;
            element.classList.add(className);

            const cleanup = () => {
                element.classList.remove(className);
                if (callback) callback();
            };

            element.addEventListener('animationend', cleanup, { once: true });
        }

        /**
         * Animate a counter from start to end value
         * @param {HTMLElement} element - Element containing the number
         * @param {number} endValue - Target number
         * @param {number} duration - Animation duration in ms (default 1000)
         * @param {number} startValue - Starting number (default 0)
         */
        animateCounter(element, endValue, duration = 1000, startValue = 0) {
            if (!this.shouldAnimate() || !element) {
                element.textContent = endValue;
                return;
            }

            element.classList.add('motion-counter', 'motion-counter-animating');

            const startTime = performance.now();
            const range = endValue - startValue;

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.floor(startValue + (range * easeOut));

                element.textContent = currentValue;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = endValue;
                    element.classList.remove('motion-counter-animating');
                }
            };

            requestAnimationFrame(updateCounter);
        }

        /**
         * Animate multiple counters simultaneously
         * @param {Array} counters - Array of {element, endValue, duration, startValue}
         */
        animateCounters(counters) {
            if (!Array.isArray(counters)) return;

            counters.forEach(({ element, endValue, duration = 1000, startValue = 0 }) => {
                this.animateCounter(element, endValue, duration, startValue);
            });
        }

        /**
         * Setup ripple effects for clickable elements
         */
        setupRippleEffects() {
            if (!this.shouldAnimate()) return;

            // Delegate event listener for ripple effect
            document.addEventListener('click', (e) => {
                const rippleElement = e.target.closest('.motion-ripple');
                if (!rippleElement) return;

                // Create ripple element
                const ripple = document.createElement('span');
                const rect = rippleElement.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    top: ${y}px;
                    left: ${x}px;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    pointer-events: none;
                    transform: scale(0);
                    opacity: 1;
                    transition: transform 0.6s, opacity 0.6s;
                `;

                rippleElement.style.position = 'relative';
                rippleElement.style.overflow = 'hidden';
                rippleElement.appendChild(ripple);

                // Trigger animation
                requestAnimationFrame(() => {
                    ripple.style.transform = 'scale(2)';
                    ripple.style.opacity = '0';
                });

                // Remove after animation
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        }

        /**
         * Apply stagger animation to elements
         * @param {string|NodeList} selector - CSS selector or NodeList
         * @param {number} delayIncrement - Delay between items in ms (default 50)
         */
        staggerAnimation(selector, delayIncrement = 50) {
            if (!this.shouldAnimate()) return;

            const elements = typeof selector === 'string'
                ? document.querySelectorAll(selector)
                : selector;

            elements.forEach((element, index) => {
                element.classList.add('motion-stagger-item');

                // Override animation delay for custom timing
                if (index < 10) {
                    element.style.animationDelay = `${index * delayIncrement}ms`;
                }
            });
        }

        /**
         * Remove stagger classes
         * @param {string|NodeList} selector - CSS selector or NodeList
         */
        removeStagger(selector) {
            const elements = typeof selector === 'string'
                ? document.querySelectorAll(selector)
                : selector;

            elements.forEach((element) => {
                element.classList.remove('motion-stagger-item');
                element.style.animationDelay = '';
            });
        }

        /**
         * Setup scroll reveal animation
         */
        setupScrollReveal() {
            if (!this.shouldAnimate()) return;

            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            }, observerOptions);

            // Observe all scroll-reveal elements
            const observeScrollReveal = () => {
                document.querySelectorAll('.motion-scroll-reveal').forEach((element) => {
                    observer.observe(element);
                });
            };

            // Initial observation
            observeScrollReveal();

            // Store observer for cleanup
            this.observers.add(observer);

            // Re-observe when new elements are added
            this.scrollRevealObserver = observer;
        }

        /**
         * Add scroll reveal to element
         * @param {HTMLElement|string} element - Element or selector
         */
        addScrollReveal(element) {
            if (!this.shouldAnimate()) return;

            const el = typeof element === 'string'
                ? document.querySelector(element)
                : element;

            if (el && this.scrollRevealObserver) {
                el.classList.add('motion-scroll-reveal');
                this.scrollRevealObserver.observe(el);
            }
        }

        /**
         * Create and show a loading skeleton
         * @param {HTMLElement} container - Container element
         * @param {string} type - Skeleton type ('text', 'card', 'heading', 'button', 'circle')
         * @param {number} count - Number of skeleton elements (default 1)
         * @returns {Array} Array of skeleton elements
         */
        showSkeleton(container, type = 'text', count = 1) {
            if (!container) return [];

            const skeletons = [];
            const baseClass = 'motion-skeleton';
            const typeClass = type !== 'default' ? `motion-skeleton-${type}` : '';

            for (let i = 0; i < count; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = `${baseClass} ${typeClass}`.trim();
                skeleton.setAttribute('aria-hidden', 'true');
                skeleton.setAttribute('data-skeleton', 'true');
                container.appendChild(skeleton);
                skeletons.push(skeleton);
            }

            return skeletons;
        }

        /**
         * Remove all skeletons from container
         * @param {HTMLElement} container - Container element
         */
        hideSkeleton(container) {
            if (!container) return;

            const skeletons = container.querySelectorAll('[data-skeleton="true"]');
            skeletons.forEach(skeleton => skeleton.remove());
        }

        /**
         * Show loading skeleton for a specific period
         * @param {HTMLElement} container - Container element
         * @param {Function} loadFn - Async function that loads data
         * @param {string} skeletonType - Type of skeleton
         * @param {number} count - Number of skeletons
         */
        async withSkeleton(container, loadFn, skeletonType = 'card', count = 3) {
            if (!container) return;

            // Show skeletons
            this.showSkeleton(container, skeletonType, count);

            try {
                // Load data
                await loadFn();
            } finally {
                // Hide skeletons
                this.hideSkeleton(container);
            }
        }

        /**
         * Smooth scroll to element
         * @param {string|HTMLElement} target - Target element or selector
         * @param {number} offset - Offset from top (default 0)
         */
        smoothScrollTo(target, offset = 0) {
            const element = typeof target === 'string'
                ? document.querySelector(target)
                : target;

            if (!element) return;

            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: this.shouldAnimate() ? 'smooth' : 'auto'
            });
        }

        /**
         * Add motion class to element
         * @param {HTMLElement} element - Target element
         * @param {string} motionClass - Motion class to add
         */
        addMotionClass(element, motionClass) {
            if (!this.shouldAnimate() || !element) return;
            element.classList.add(motionClass);
        }

        /**
         * Remove motion class from element
         * @param {HTMLElement} element - Target element
         * @param {string} motionClass - Motion class to remove
         */
        removeMotionClass(element, motionClass) {
            if (!element) return;
            element.classList.remove(motionClass);
        }

        /**
         * Apply shake animation to element
         * @param {HTMLElement} element - Target element
         */
        shake(element) {
            if (!this.shouldAnimate() || !element) return;

            element.classList.add('motion-shake');
            element.addEventListener('animationend', () => {
                element.classList.remove('motion-shake');
            }, { once: true });
        }

        /**
         * Apply wiggle animation to element
         * @param {HTMLElement} element - Target element
         */
        wiggle(element) {
            if (!this.shouldAnimate() || !element) return;

            element.classList.add('motion-wiggle');
            element.addEventListener('animationend', () => {
                element.classList.remove('motion-wiggle');
            }, { once: true });
        }

        /**
         * Cleanup all observers and animations
         */
        cleanup() {
            // Clean up observers
            this.observers.forEach(observer => observer.disconnect());
            this.observers.clear();

            // Cancel active animations
            this.activeAnimations.forEach(animation => animation.cancel());
            this.activeAnimations.clear();
        }

        /**
         * Destroy the motion system
         */
        destroy() {
            this.cleanup();
            console.log('[Motion] Motion system destroyed');
        }
    }

    /**
     * Create global instance
     */
    window.MotionSystem = MotionSystem;
    window.motionSystem = new MotionSystem();

    /**
     * Auto-initialize on DOMContentLoaded
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.motionSystem.init();
        });
    } else {
        window.motionSystem.init();
    }

    /**
     * Export helper functions for convenience
     */
    window.Motion = {
        /**
         * Page transition
         */
        transition: (element, type, callback) => {
            return window.motionSystem.pageTransition(element, type, callback);
        },

        /**
         * Page transition exit
         */
        transitionExit: (element, type, callback) => {
            return window.motionSystem.pageTransitionExit(element, type, callback);
        },

        /**
         * Animate counter
         */
        counter: (element, endValue, duration, startValue) => {
            return window.motionSystem.animateCounter(element, endValue, duration, startValue);
        },

        /**
         * Animate multiple counters
         */
        counters: (counters) => {
            return window.motionSystem.animateCounters(counters);
        },

        /**
         * Apply stagger animation
         */
        stagger: (selector, delay) => {
            return window.motionSystem.staggerAnimation(selector, delay);
        },

        /**
         * Remove stagger
         */
        removeStagger: (selector) => {
            return window.motionSystem.removeStagger(selector);
        },

        /**
         * Show skeleton
         */
        showSkeleton: (container, type, count) => {
            return window.motionSystem.showSkeleton(container, type, count);
        },

        /**
         * Hide skeleton
         */
        hideSkeleton: (container) => {
            return window.motionSystem.hideSkeleton(container);
        },

        /**
         * With skeleton (async)
         */
        withSkeleton: (container, loadFn, type, count) => {
            return window.motionSystem.withSkeleton(container, loadFn, type, count);
        },

        /**
         * Smooth scroll
         */
        scrollTo: (target, offset) => {
            return window.motionSystem.smoothScrollTo(target, offset);
        },

        /**
         * Add scroll reveal
         */
        addScrollReveal: (element) => {
            return window.motionSystem.addScrollReveal(element);
        },

        /**
         * Shake animation
         */
        shake: (element) => {
            return window.motionSystem.shake(element);
        },

        /**
         * Wiggle animation
         */
        wiggle: (element) => {
            return window.motionSystem.wiggle(element);
        },

        /**
         * Check if motion should animate
         */
        shouldAnimate: () => {
            return window.motionSystem.shouldAnimate();
        }
    };

})(window);
