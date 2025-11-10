/**
 * Dashboard Analytics Module
 * Veer Patta Public School Timetable Command Center
 *
 * Features:
 * - Lazy-loaded Chart.js for performance
 * - Teacher workload donut chart
 * - Substitution trends bar chart
 * - Animated stat counters
 * - Rule-based insights
 *
 * Feature Flag: feat_dashboard_analytics
 */

(function() {
	'use strict';

	// Feature flag configuration
	const FEATURE_FLAGS = {
		feat_dashboard_analytics: true // Set to false to disable analytics dashboard
	};

	// Chart.js lazy loading
	let chartJsLoaded = false;
	let chartJsLoadPromise = null;

	/**
	 * Lazy load Chart.js library from CDN
	 * @returns {Promise} Resolves when Chart.js is loaded
	 */
	function loadChartJs() {
		if (chartJsLoaded && window.Chart) {
			return Promise.resolve(window.Chart);
		}

		if (chartJsLoadPromise) {
			return chartJsLoadPromise;
		}

		chartJsLoadPromise = new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
			script.async = true;
			script.onload = () => {
				chartJsLoaded = true;
				console.log('✅ Chart.js loaded successfully');
				resolve(window.Chart);
			};
			script.onerror = () => {
				console.error('❌ Failed to load Chart.js');
				chartJsLoadPromise = null;
				reject(new Error('Failed to load Chart.js'));
			};
			document.head.appendChild(script);
		});

		return chartJsLoadPromise;
	}

	/**
	 * Get current theme (light or dark)
	 * @returns {string} 'light' or 'dark'
	 */
	function getCurrentTheme() {
		return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
	}

	/**
	 * Get theme-aware colors for charts
	 * @returns {Object} Color configuration for current theme
	 */
	function getThemeColors() {
		const isDark = getCurrentTheme() === 'dark';

		return {
			text: isDark ? '#e8e8e8' : '#111827',
			textSecondary: isDark ? '#b8b8b8' : '#4b5563',
			border: isDark ? '#2a3a5e' : '#e5e7eb',
			gridLines: isDark ? 'rgba(42, 58, 94, 0.5)' : 'rgba(229, 231, 235, 0.5)',
			background: isDark ? '#16213e' : '#ffffff',
			primary: isDark ? '#4a7c7e' : '#2563eb',
			success: isDark ? '#34d399' : '#10b981',
			warning: isDark ? '#fbbf24' : '#f59e0b',
			danger: isDark ? '#f87171' : '#ef4444',
			chartColors: isDark
				? ['#4a7c7e', '#34d399', '#fbbf24', '#f87171', '#8abcbe', '#6a9c9e', '#5a8c8e', '#7aacae']
				: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#1d4ed8', '#60a5fa', '#93c5fd']
		};
	}

	/**
	 * Calculate teacher workload for today
	 * @param {Object} state - Application state
	 * @returns {Array} Array of {teacher, periods} sorted by workload
	 */
	function calculateTeacherWorkload(state) {
		const today = getCurrentDay();
		const teacherDetails = state.allData?.teacherDetails || {};
		const workloadData = [];

		Object.keys(teacherDetails).forEach(teacherName => {
			const teacher = teacherDetails[teacherName];
			const periodsToday = teacher.workload?.[today] || 0;

			if (periodsToday > 0) {
				workloadData.push({
					teacher: teacherName,
					periods: periodsToday
				});
			}
		});

		// Sort by periods descending
		return workloadData.sort((a, b) => b.periods - a.periods);
	}

	/**
	 * Calculate substitution trends for past 7 days
	 * @param {Object} state - Application state
	 * @returns {Array} Array of {day, count} for past 7 days
	 */
	function calculateSubstitutionTrends(state) {
		const days = state.allData?.days || [];
		const substitutions = state.substitutions || {};
		const trends = [];

		days.forEach(day => {
			const daySubs = substitutions[day]?.plan || {};
			let count = 0;

			// Count total substitutions for this day
			Object.keys(daySubs).forEach(className => {
				count += Object.keys(daySubs[className]).length;
			});

			trends.push({
				day: day.substring(0, 3), // Mon, Tue, etc.
				fullDay: day,
				count: count
			});
		});

		return trends;
	}

	/**
	 * Generate rule-based insights
	 * @param {Object} state - Application state
	 * @returns {Array} Array of insight objects {type, message, icon}
	 */
	function generateInsights(state) {
		const insights = [];
		const today = getCurrentDay();
		const substitutions = state.substitutions || {};
		const workloadData = calculateTeacherWorkload(state);

		// Insight 1: Heavy workload teachers
		const heavyWorkload = workloadData.filter(t => t.periods > 6);
		if (heavyWorkload.length > 0) {
			insights.push({
				type: 'warning',
				icon: 'alert-triangle',
				message: `${heavyWorkload.length} teacher${heavyWorkload.length > 1 ? 's have' : ' has'} heavy workload today (>6 periods)`
			});
		}

		// Insight 2: Light workload teachers
		const lightWorkload = workloadData.filter(t => t.periods <= 3);
		if (lightWorkload.length > 0) {
			insights.push({
				type: 'info',
				icon: 'info',
				message: `${lightWorkload.length} teacher${lightWorkload.length > 1 ? 's have' : ' has'} light workload today (≤3 periods)`
			});
		}

		// Insight 3: Substitution distribution
		const todaySubs = substitutions[today]?.plan || {};
		const totalSubsToday = Object.values(todaySubs).reduce((acc, classSubstitutions) =>
			acc + Object.keys(classSubstitutions).length, 0
		);

		if (totalSubsToday > 5) {
			insights.push({
				type: 'warning',
				icon: 'users',
				message: 'High substitution demand today. Consider rotating substitutions for better distribution'
			});
		} else if (totalSubsToday > 0) {
			insights.push({
				type: 'success',
				icon: 'check-circle',
				message: `${totalSubsToday} substitution${totalSubsToday > 1 ? 's' : ''} scheduled for today`
			});
		}

		// Insight 4: Most frequent substitute teachers
		const subFrequency = {};
		Object.keys(substitutions).forEach(day => {
			const daySubs = substitutions[day]?.plan || {};
			Object.values(daySubs).forEach(classSubstitutions => {
				Object.values(classSubstitutions).forEach(teacher => {
					subFrequency[teacher] = (subFrequency[teacher] || 0) + 1;
				});
			});
		});

		const mostFrequentSub = Object.entries(subFrequency)
			.sort((a, b) => b[1] - a[1])[0];

		if (mostFrequentSub && mostFrequentSub[1] > 3) {
			insights.push({
				type: 'info',
				icon: 'user-check',
				message: `${mostFrequentSub[0]} is covering the most substitutions (${mostFrequentSub[1]} total)`
			});
		}

		// Insight 5: Balanced workload
		if (heavyWorkload.length === 0 && workloadData.length > 0) {
			insights.push({
				type: 'success',
				icon: 'thumbs-up',
				message: 'Teacher workload is well-balanced today!'
			});
		}

		// If no insights, show positive message
		if (insights.length === 0) {
			insights.push({
				type: 'success',
				icon: 'check-circle',
				message: 'All systems running smoothly!'
			});
		}

		return insights;
	}

	/**
	 * Create teacher workload donut chart
	 * @param {string} canvasId - Canvas element ID
	 * @param {Object} state - Application state
	 * @returns {Chart} Chart instance
	 */
	function createWorkloadDonutChart(canvasId, state) {
		const canvas = document.getElementById(canvasId);
		if (!canvas) return null;

		const ctx = canvas.getContext('2d');
		const workloadData = calculateTeacherWorkload(state);
		const colors = getThemeColors();

		// Take top 8 teachers, group rest as "Others"
		const topTeachers = workloadData.slice(0, 8);
		const othersCount = workloadData.slice(8).reduce((sum, t) => sum + t.periods, 0);

		const labels = topTeachers.map(t => t.teacher);
		const data = topTeachers.map(t => t.periods);

		if (othersCount > 0) {
			labels.push('Others');
			data.push(othersCount);
		}

		// Destroy existing chart if any
		if (canvas.chart) {
			canvas.chart.destroy();
		}

		const chart = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: labels,
				datasets: [{
					data: data,
					backgroundColor: colors.chartColors,
					borderColor: colors.background,
					borderWidth: 2
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							color: colors.text,
							padding: 12,
							font: {
								size: 11,
								family: 'Inter, sans-serif'
							},
							boxWidth: 12,
							boxHeight: 12
						}
					},
					tooltip: {
						backgroundColor: colors.background,
						titleColor: colors.text,
						bodyColor: colors.textSecondary,
						borderColor: colors.border,
						borderWidth: 1,
						padding: 12,
						displayColors: true,
						callbacks: {
							label: function(context) {
								const label = context.label || '';
								const value = context.parsed || 0;
								const total = context.dataset.data.reduce((a, b) => a + b, 0);
								const percentage = ((value / total) * 100).toFixed(1);
								return `${label}: ${value} period${value !== 1 ? 's' : ''} (${percentage}%)`;
							}
						}
					}
				}
			}
		});

		canvas.chart = chart;
		return chart;
	}

	/**
	 * Create substitution trends bar chart
	 * @param {string} canvasId - Canvas element ID
	 * @param {Object} state - Application state
	 * @returns {Chart} Chart instance
	 */
	function createSubstitutionBarChart(canvasId, state) {
		const canvas = document.getElementById(canvasId);
		if (!canvas) return null;

		const ctx = canvas.getContext('2d');
		const trendsData = calculateSubstitutionTrends(state);
		const colors = getThemeColors();
		const today = getCurrentDay();

		const labels = trendsData.map(t => t.day);
		const data = trendsData.map(t => t.count);
		const backgroundColors = trendsData.map(t =>
			t.fullDay === today ? colors.primary : colors.textSecondary + '80'
		);

		// Destroy existing chart if any
		if (canvas.chart) {
			canvas.chart.destroy();
		}

		const chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [{
					label: 'Substitutions',
					data: data,
					backgroundColor: backgroundColors,
					borderColor: colors.border,
					borderWidth: 1,
					borderRadius: 6
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							stepSize: 1,
							color: colors.textSecondary,
							font: {
								size: 11,
								family: 'Inter, sans-serif'
							}
						},
						grid: {
							color: colors.gridLines,
							drawBorder: false
						}
					},
					x: {
						ticks: {
							color: colors.textSecondary,
							font: {
								size: 11,
								family: 'Inter, sans-serif'
							}
						},
						grid: {
							display: false
						}
					}
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						backgroundColor: colors.background,
						titleColor: colors.text,
						bodyColor: colors.textSecondary,
						borderColor: colors.border,
						borderWidth: 1,
						padding: 12,
						displayColors: false,
						callbacks: {
							label: function(context) {
								const value = context.parsed.y || 0;
								return `${value} substitution${value !== 1 ? 's' : ''}`;
							},
							title: function(context) {
								const fullDay = trendsData[context[0].dataIndex].fullDay;
								return fullDay;
							}
						}
					}
				}
			}
		});

		canvas.chart = chart;
		return chart;
	}

	/**
	 * Animate counter from 0 to target value
	 * @param {HTMLElement} element - Counter element
	 * @param {number} target - Target value
	 * @param {number} duration - Animation duration in ms
	 */
	function animateCounter(element, target, duration = 1000) {
		if (!element || element.hasAttribute('data-animated')) return;

		element.setAttribute('data-animated', 'true');

		const start = 0;
		const startTime = performance.now();

		function update(currentTime) {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function (ease-out cubic)
			const easeOut = 1 - Math.pow(1 - progress, 3);
			const current = Math.floor(start + (target - start) * easeOut);

			element.textContent = current;

			if (progress < 1) {
				requestAnimationFrame(update);
			} else {
				element.textContent = target;
			}
		}

		requestAnimationFrame(update);
	}

	/**
	 * Calculate quick stats
	 * @param {Object} state - Application state
	 * @returns {Object} Stats object
	 */
	function calculateQuickStats(state) {
		const today = getCurrentDay();
		const substitutions = state.substitutions || {};
		const workloadData = calculateTeacherWorkload(state);

		// Total teachers teaching today
		const teachersToday = workloadData.length;

		// Total periods today
		const totalPeriods = workloadData.reduce((sum, t) => sum + t.periods, 0);

		// Total substitutions today
		const todaySubs = substitutions[today]?.plan || {};
		const totalSubsToday = Object.values(todaySubs).reduce((acc, classSubstitutions) =>
			acc + Object.keys(classSubstitutions).length, 0
		);

		// Average workload
		const avgWorkload = teachersToday > 0 ? (totalPeriods / teachersToday).toFixed(1) : 0;

		return {
			teachersToday,
			totalPeriods,
			totalSubsToday,
			avgWorkload
		};
	}

	/**
	 * Render analytics dashboard
	 * @param {Object} state - Application state
	 * @returns {Promise<string>} HTML string
	 */
	async function renderAnalyticsDashboard(state) {
		// Check feature flag
		if (!FEATURE_FLAGS.feat_dashboard_analytics) {
			return null; // Fallback to old dashboard
		}

		try {
			// Load Chart.js if not already loaded
			await loadChartJs();

			const stats = calculateQuickStats(state);
			const insights = generateInsights(state);
			const today = getCurrentDay();

			const html = `
				<div class="analytics-grid">
					<!-- Quick Stats Cards -->
					<div class="stats-row">
						<div class="stat-card-animated">
							<div class="stat-icon" style="background: linear-gradient(135deg, var(--primary-600), var(--primary-700));">
								<i data-lucide="users" style="width: 24px; height: 24px; color: white;"></i>
							</div>
							<div class="stat-content">
								<div class="stat-value" data-counter="${stats.teachersToday}">0</div>
								<div class="stat-label">Teachers Today</div>
							</div>
						</div>

						<div class="stat-card-animated">
							<div class="stat-icon" style="background: linear-gradient(135deg, var(--green-500), #059669);">
								<i data-lucide="calendar-days" style="width: 24px; height: 24px; color: white;"></i>
							</div>
							<div class="stat-content">
								<div class="stat-value" data-counter="${stats.totalPeriods}">0</div>
								<div class="stat-label">Total Periods</div>
							</div>
						</div>

						<div class="stat-card-animated">
							<div class="stat-icon" style="background: linear-gradient(135deg, var(--yellow-500), #d97706);">
								<i data-lucide="user-cog" style="width: 24px; height: 24px; color: white;"></i>
							</div>
							<div class="stat-content">
								<div class="stat-value" data-counter="${stats.totalSubsToday}">0</div>
								<div class="stat-label">Substitutions</div>
							</div>
						</div>

						<div class="stat-card-animated">
							<div class="stat-icon" style="background: linear-gradient(135deg, var(--red-500), var(--red-600));">
								<i data-lucide="trending-up" style="width: 24px; height: 24px; color: white;"></i>
							</div>
							<div class="stat-content">
								<div class="stat-value">${stats.avgWorkload}</div>
								<div class="stat-label">Avg. Workload</div>
							</div>
						</div>
					</div>

					<!-- Charts Row -->
					<div class="charts-row">
						<div class="chart-card">
							<h3 class="chart-title">
								<i data-lucide="pie-chart"></i>
								Teacher Workload Distribution (${today})
							</h3>
							<div class="chart-container">
								<canvas id="workload-donut-chart"></canvas>
							</div>
						</div>

						<div class="chart-card">
							<h3 class="chart-title">
								<i data-lucide="bar-chart-3"></i>
								Substitution Trends (This Week)
							</h3>
							<div class="chart-container">
								<canvas id="substitution-bar-chart"></canvas>
							</div>
						</div>
					</div>

					<!-- Insights Card -->
					<div class="insights-card">
						<h3 class="insights-title">
							<i data-lucide="lightbulb"></i>
							Daily Insights
						</h3>
						<div class="insights-list">
							${insights.map(insight => `
								<div class="insight-item insight-${insight.type}">
									<i data-lucide="${insight.icon}" class="insight-icon"></i>
									<span class="insight-message">${insight.message}</span>
								</div>
							`).join('')}
						</div>
					</div>
				</div>
			`;

			return html;
		} catch (error) {
			console.error('Error rendering analytics dashboard:', error);
			return null; // Fallback to old dashboard
		}
	}

	/**
	 * Initialize charts after DOM is ready
	 * @param {Object} state - Application state
	 */
	function initializeCharts(state) {
		// Animate counters
		document.querySelectorAll('.stat-value[data-counter]').forEach(element => {
			const target = parseInt(element.getAttribute('data-counter'));
			animateCounter(element, target, 1200);
		});

		// Create charts
		setTimeout(() => {
			createWorkloadDonutChart('workload-donut-chart', state);
			createSubstitutionBarChart('substitution-bar-chart', state);

			// Reinitialize lucide icons
			if (window.lucide) {
				lucide.createIcons();
			}
		}, 100);
	}

	/**
	 * Update charts on theme change
	 */
	function updateChartsForTheme(state) {
		const workloadCanvas = document.getElementById('workload-donut-chart');
		const substitutionCanvas = document.getElementById('substitution-bar-chart');

		if (workloadCanvas && workloadCanvas.chart) {
			createWorkloadDonutChart('workload-donut-chart', state);
		}

		if (substitutionCanvas && substitutionCanvas.chart) {
			createSubstitutionBarChart('substitution-bar-chart', state);
		}
	}

	/**
	 * Get current day of week
	 * @returns {string} Day name
	 */
	function getCurrentDay() {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const today = new Date().getDay();
		return days[today];
	}

	// Listen for theme changes to update charts
	window.addEventListener('themechange', function(event) {
		console.log('📊 Updating charts for theme:', event.detail.theme);

		// Get current state from global scope
		if (window.state && window.DashboardAnalytics) {
			setTimeout(() => {
				window.DashboardAnalytics.updateChartsForTheme(window.state);
			}, 100);
		}
	});

	// Export to global scope
	window.DashboardAnalytics = {
		renderAnalyticsDashboard,
		initializeCharts,
		updateChartsForTheme,
		loadChartJs,
		FEATURE_FLAGS
	};

	console.log('✅ Dashboard Analytics module loaded');
})();
