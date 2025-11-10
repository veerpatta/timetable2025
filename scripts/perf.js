/**
 * Performance Optimization Module for Veer Patta Public School Timetable
 * Features: Virtual Scrolling, Lazy Loading, Caching, Debouncing
 * Feature Flag: feat_perf_opt
 */

// ============================================================================
// FEATURE FLAG SYSTEM
// ============================================================================

const PerformanceFeatures = {
  VIRTUAL_SCROLLING: 'virtual_scrolling',
  LAZY_LOADING: 'lazy_loading',
  CACHE_ENABLED: 'cache_enabled',
  DEBOUNCING: 'debouncing',
  LAZY_IMAGES: 'lazy_images'
};

class FeatureFlags {
  constructor() {
    this.flags = this.loadFlags();
  }

  loadFlags() {
    const stored = localStorage.getItem('feat_perf_opt');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse feature flags, using defaults');
      }
    }

    // Default: all performance features enabled
    return {
      [PerformanceFeatures.VIRTUAL_SCROLLING]: true,
      [PerformanceFeatures.LAZY_LOADING]: true,
      [PerformanceFeatures.CACHE_ENABLED]: true,
      [PerformanceFeatures.DEBOUNCING]: true,
      [PerformanceFeatures.LAZY_IMAGES]: true
    };
  }

  isEnabled(feature) {
    return this.flags[feature] === true;
  }

  enable(feature) {
    this.flags[feature] = true;
    this.save();
  }

  disable(feature) {
    this.flags[feature] = false;
    this.save();
  }

  toggle(feature) {
    this.flags[feature] = !this.flags[feature];
    this.save();
    return this.flags[feature];
  }

  save() {
    localStorage.setItem('feat_perf_opt', JSON.stringify(this.flags));
  }

  reset() {
    localStorage.removeItem('feat_perf_opt');
    this.flags = this.loadFlags();
  }

  getAll() {
    return { ...this.flags };
  }
}

// Global feature flags instance
const featureFlags = new FeatureFlags();

// ============================================================================
// DEBOUNCE & THROTTLE UTILITIES
// ============================================================================

/**
 * Debounce function - delays execution until after wait period of inactivity
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300, immediate = false) {
  if (!featureFlags.isEnabled(PerformanceFeatures.DEBOUNCING)) {
    return func; // Return original function if debouncing disabled
  }

  let timeout;
  return function executedFunction(...args) {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle function - limits execution to once per time period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 300) {
  if (!featureFlags.isEnabled(PerformanceFeatures.DEBOUNCING)) {
    return func;
  }

  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ============================================================================
// SESSION STORAGE CACHE WITH TTL
// ============================================================================

class CacheManager {
  constructor(namespace = 'timetable_cache') {
    this.namespace = namespace;
    this.enabled = featureFlags.isEnabled(PerformanceFeatures.CACHE_ENABLED);
  }

  /**
   * Generate cache key with namespace
   */
  _getKey(key) {
    return `${this.namespace}:${key}`;
  }

  /**
   * Set cache entry with TTL (Time To Live)
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    if (!this.enabled) return false;

    try {
      const cacheEntry = {
        value: value,
        timestamp: Date.now(),
        ttl: ttl
      };
      sessionStorage.setItem(this._getKey(key), JSON.stringify(cacheEntry));
      return true;
    } catch (e) {
      console.warn('Cache set failed:', e);
      // Handle quota exceeded errors
      if (e.name === 'QuotaExceededError') {
        this.clear();
        try {
          sessionStorage.setItem(this._getKey(key), JSON.stringify({
            value, timestamp: Date.now(), ttl
          }));
          return true;
        } catch (e2) {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Get cache entry if not expired
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key) {
    if (!this.enabled) return null;

    try {
      const cached = sessionStorage.getItem(this._getKey(key));
      if (!cached) return null;

      const entry = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;

      // Check if expired
      if (age > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.value;
    } catch (e) {
      console.warn('Cache get failed:', e);
      return null;
    }
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    try {
      sessionStorage.removeItem(this._getKey(key));
    } catch (e) {
      console.warn('Cache delete failed:', e);
    }
  }

  /**
   * Clear all cache entries for this namespace
   */
  clear() {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.namespace + ':')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Cache clear failed:', e);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    try {
      const keys = Object.keys(sessionStorage);
      const cacheKeys = keys.filter(k => k.startsWith(this.namespace + ':'));

      let totalSize = 0;
      let validEntries = 0;
      let expiredEntries = 0;

      cacheKeys.forEach(key => {
        const value = sessionStorage.getItem(key);
        totalSize += value.length;

        try {
          const entry = JSON.parse(value);
          const age = Date.now() - entry.timestamp;
          if (age <= entry.ttl) {
            validEntries++;
          } else {
            expiredEntries++;
          }
        } catch (e) {
          // Invalid entry
        }
      });

      return {
        totalEntries: cacheKeys.length,
        validEntries,
        expiredEntries,
        totalSize,
        enabled: this.enabled
      };
    } catch (e) {
      return { error: e.message };
    }
  }
}

// Global cache manager instance
const cache = new CacheManager();

// ============================================================================
// LAZY LOADING FOR COMPONENTS/MODULES
// ============================================================================

class LazyLoader {
  constructor() {
    this.loaded = new Set();
    this.loading = new Map();
    this.enabled = featureFlags.isEnabled(PerformanceFeatures.LAZY_LOADING);
  }

  /**
   * Lazy load a script
   * @param {string} src - Script source URL
   * @param {string} id - Optional unique identifier
   * @returns {Promise<void>}
   */
  async loadScript(src, id = null) {
    if (!this.enabled) {
      // Load synchronously if lazy loading disabled
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        if (id) script.id = id;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const key = id || src;

    // Already loaded
    if (this.loaded.has(key)) {
      return Promise.resolve();
    }

    // Currently loading
    if (this.loading.has(key)) {
      return this.loading.get(key);
    }

    // Start loading
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      if (id) script.id = id;

      script.onload = () => {
        this.loaded.add(key);
        this.loading.delete(key);
        resolve();
      };

      script.onerror = () => {
        this.loading.delete(key);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });

    this.loading.set(key, promise);
    return promise;
  }

  /**
   * Lazy load html2canvas library
   */
  async loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve();
    return this.loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      'html2canvas-lib'
    );
  }

  /**
   * Lazy load jsPDF library
   */
  async loadJsPDF() {
    if (window.jspdf) return Promise.resolve();
    return this.loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'jspdf-lib'
    );
  }

  /**
   * Check if a script is loaded
   */
  isLoaded(id) {
    return this.loaded.has(id);
  }
}

// Global lazy loader instance
const lazyLoader = new LazyLoader();

// ============================================================================
// LAZY IMAGE LOADING
// ============================================================================

class LazyImageLoader {
  constructor() {
    this.enabled = featureFlags.isEnabled(PerformanceFeatures.LAZY_IMAGES);
    this.observer = null;
    this.init();
  }

  init() {
    if (!this.enabled || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before visible
      threshold: 0.01
    });
  }

  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    img.src = src;
    img.removeAttribute('data-src');
    img.classList.remove('lazy');
    img.classList.add('loaded');

    if (this.observer) {
      this.observer.unobserve(img);
    }
  }

  /**
   * Observe images for lazy loading
   * @param {string} selector - CSS selector for images (default: img[data-src])
   */
  observe(selector = 'img[data-src]') {
    if (!this.enabled || !this.observer) {
      // Load all images immediately if disabled
      document.querySelectorAll(selector).forEach(img => {
        const src = img.dataset.src;
        if (src) img.src = src;
      });
      return;
    }

    document.querySelectorAll(selector).forEach(img => {
      this.observer.observe(img);
    });
  }

  /**
   * Disconnect observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Global lazy image loader instance
const lazyImageLoader = new LazyImageLoader();

// ============================================================================
// VIRTUAL SCROLLING FOR LARGE TABLES
// ============================================================================

class VirtualScroller {
  constructor(options = {}) {
    this.enabled = featureFlags.isEnabled(PerformanceFeatures.VIRTUAL_SCROLLING);
    this.container = options.container;
    this.items = options.items || [];
    this.rowHeight = options.rowHeight || 50;
    this.bufferSize = options.bufferSize || 5;
    this.renderRow = options.renderRow;
    this.onScroll = options.onScroll;

    this.scrollTop = 0;
    this.viewportHeight = 0;
    this.totalHeight = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;

    this.viewport = null;
    this.content = null;
    this.spacerTop = null;
    this.spacerBottom = null;
  }

  init() {
    if (!this.enabled || !this.container) {
      return this.renderAllRows();
    }

    this.setupDOM();
    this.calculateDimensions();
    this.attachScrollListener();
    this.render();
  }

  setupDOM() {
    // Create viewport structure
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    this.container.style.height = '100%';

    // Spacer top
    this.spacerTop = document.createElement('div');
    this.spacerTop.style.height = '0px';
    this.container.appendChild(this.spacerTop);

    // Content container
    this.content = document.createElement('div');
    this.content.style.position = 'relative';
    this.container.appendChild(this.content);

    // Spacer bottom
    this.spacerBottom = document.createElement('div');
    this.spacerBottom.style.height = '0px';
    this.container.appendChild(this.spacerBottom);
  }

  calculateDimensions() {
    this.totalHeight = this.items.length * this.rowHeight;
    this.viewportHeight = this.container.clientHeight;
  }

  attachScrollListener() {
    const handleScroll = throttle(() => {
      this.scrollTop = this.container.scrollTop;
      this.render();
      if (this.onScroll) {
        this.onScroll(this.scrollTop);
      }
    }, 16); // ~60fps

    this.container.addEventListener('scroll', handleScroll, { passive: true });
  }

  render() {
    if (!this.enabled) {
      return this.renderAllRows();
    }

    this.calculateVisibleRange();
    this.updateSpacers();
    this.renderVisibleRows();
  }

  calculateVisibleRange() {
    const start = Math.floor(this.scrollTop / this.rowHeight);
    const end = Math.ceil((this.scrollTop + this.viewportHeight) / this.rowHeight);

    this.visibleStart = Math.max(0, start - this.bufferSize);
    this.visibleEnd = Math.min(this.items.length, end + this.bufferSize);
  }

  updateSpacers() {
    const topHeight = this.visibleStart * this.rowHeight;
    const bottomHeight = (this.items.length - this.visibleEnd) * this.rowHeight;

    this.spacerTop.style.height = `${topHeight}px`;
    this.spacerBottom.style.height = `${bottomHeight}px`;
  }

  renderVisibleRows() {
    const fragment = document.createDocumentFragment();

    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const item = this.items[i];
      const row = this.renderRow(item, i);
      fragment.appendChild(row);
    }

    this.content.innerHTML = '';
    this.content.appendChild(fragment);
  }

  renderAllRows() {
    // Fallback: render all rows without virtualization
    if (!this.container || !this.renderRow) return;

    const fragment = document.createDocumentFragment();
    this.items.forEach((item, index) => {
      fragment.appendChild(this.renderRow(item, index));
    });

    this.container.innerHTML = '';
    this.container.appendChild(fragment);
  }

  updateItems(newItems) {
    this.items = newItems;
    this.calculateDimensions();
    this.render();
  }

  scrollToIndex(index) {
    const scrollTop = index * this.rowHeight;
    this.container.scrollTop = scrollTop;
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  mark(name) {
    if (!performance || !performance.mark) return;
    this.marks.set(name, performance.now());
    performance.mark(name);
  }

  measure(name, startMark, endMark = null) {
    if (!performance || !performance.measure) return null;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0) {
        const duration = entries[entries.length - 1].duration;
        this.measures.push({ name, duration, timestamp: Date.now() });
        return duration;
      }
    } catch (e) {
      console.warn('Performance measurement failed:', e);
    }
    return null;
  }

  getMetrics() {
    return {
      marks: Array.from(this.marks.entries()),
      measures: [...this.measures],
      navigation: performance.timing ? {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        responseTime: performance.timing.responseEnd - performance.timing.requestStart
      } : null
    };
  }

  clear() {
    this.marks.clear();
    this.measures = [];
    if (performance.clearMarks) performance.clearMarks();
    if (performance.clearMeasures) performance.clearMeasures();
  }
}

// Global performance monitor
const perfMonitor = new PerformanceMonitor();

// ============================================================================
// EXPORTS
// ============================================================================

// Export for global use
window.PerformanceOptimization = {
  // Feature flags
  featureFlags,
  PerformanceFeatures,

  // Utilities
  debounce,
  throttle,

  // Cache
  cache,
  CacheManager,

  // Lazy loading
  lazyLoader,
  LazyLoader,

  // Lazy images
  lazyImageLoader,
  LazyImageLoader,

  // Virtual scrolling
  VirtualScroller,

  // Performance monitoring
  perfMonitor,
  PerformanceMonitor,

  // Helper methods
  isFeatureEnabled: (feature) => featureFlags.isEnabled(feature),
  enableFeature: (feature) => featureFlags.enable(feature),
  disableFeature: (feature) => featureFlags.disable(feature),
  toggleFeature: (feature) => featureFlags.toggle(feature)
};

console.log('✅ Performance Optimization Module loaded (feat_perf_opt)');
console.log('📊 Feature flags:', featureFlags.getAll());
