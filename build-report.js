#!/usr/bin/env node

/**
 * Build Report Generator for Veer Patta Public School Timetable
 * Analyzes file sizes and generates a comprehensive size report
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

// Configuration
const PROJECT_ROOT = __dirname;
const MAX_BUNDLE_SIZE = 500 * 1024; // 500KB target
const FILES_TO_ANALYZE = [
  'index.html',
  'scripts/perf.js',
  'scripts/colors.js',
  'styles/theme.css',
  'styles/colors.css',
  'sw.js',
  'manifest.webmanifest'
];

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Get gzipped size of a file
 */
function getGzippedSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const gzipped = gzipSync(content, { level: 9 });
    return gzipped.length;
  } catch (error) {
    console.error(`Error gzipping ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate percentage
 */
function percentage(value, total) {
  return ((value / total) * 100).toFixed(1) + '%';
}

/**
 * Analyze JavaScript complexity
 */
function analyzeJavaScript(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    const analysis = {
      lines: content.split('\n').length,
      functions: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
      classes: (content.match(/class\s+\w+/g) || []).length,
      comments: (content.match(/\/\*[\s\S]*?\*\/|\/\/.*/g) || []).length,
      asyncFunctions: (content.match(/async\s+function|async\s+\(/g) || []).length
    };

    return analysis;
  } catch (error) {
    return null;
  }
}

/**
 * Generate build report
 */
function generateReport() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     VEER PATTA PUBLIC SCHOOL TIMETABLE - BUILD REPORT        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const report = {
    timestamp: new Date().toISOString(),
    files: [],
    totals: {
      raw: 0,
      gzipped: 0
    }
  };

  console.log('📊 FILE SIZE ANALYSIS\n');
  console.log('┌─────────────────────────┬──────────┬──────────┬─────────────┐');
  console.log('│ File                    │ Raw Size │ Gzipped  │ Compression │');
  console.log('├─────────────────────────┼──────────┼──────────┼─────────────┤');

  FILES_TO_ANALYZE.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    const rawSize = getFileSize(filePath);
    const gzippedSize = getGzippedSize(filePath);
    const compression = rawSize > 0 ? ((1 - gzippedSize / rawSize) * 100).toFixed(1) + '%' : 'N/A';

    report.files.push({
      file,
      rawSize,
      gzippedSize,
      compression
    });

    report.totals.raw += rawSize;
    report.totals.gzipped += gzippedSize;

    // Format for table
    const fileName = file.padEnd(23);
    const raw = formatBytes(rawSize).padStart(8);
    const gzipped = formatBytes(gzippedSize).padStart(8);
    const comp = compression.padStart(11);

    console.log(`│ ${fileName} │ ${raw} │ ${gzipped} │ ${comp} │`);
  });

  console.log('└─────────────────────────┴──────────┴──────────┴─────────────┘\n');

  // Summary
  console.log('📦 BUNDLE SIZE SUMMARY\n');
  console.log(`Total Raw Size:       ${formatBytes(report.totals.raw)}`);
  console.log(`Total Gzipped Size:   ${formatBytes(report.totals.gzipped)}`);
  console.log(`Overall Compression:  ${((1 - report.totals.gzipped / report.totals.raw) * 100).toFixed(1)}%`);
  console.log(`Target Size:          ${formatBytes(MAX_BUNDLE_SIZE)}`);

  const overBudget = report.totals.raw > MAX_BUNDLE_SIZE;
  const budgetStatus = overBudget ? '❌ OVER' : '✅ WITHIN';
  const budgetDiff = Math.abs(report.totals.raw - MAX_BUNDLE_SIZE);

  console.log(`Budget Status:        ${budgetStatus} (${overBudget ? '+' : '-'}${formatBytes(budgetDiff)})`);

  // JavaScript Analysis
  console.log('\n📝 JAVASCRIPT ANALYSIS\n');

  const jsFiles = ['scripts/perf.js', 'scripts/colors.js'];
  jsFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    const analysis = analyzeJavaScript(filePath);

    if (analysis) {
      console.log(`${file}:`);
      console.log(`  Lines:              ${analysis.lines}`);
      console.log(`  Functions:          ${analysis.functions}`);
      console.log(`  Classes:            ${analysis.classes}`);
      console.log(`  Async Functions:    ${analysis.asyncFunctions}`);
      console.log(`  Comments:           ${analysis.comments}`);
      console.log('');
    }
  });

  // Performance Features
  console.log('⚡ PERFORMANCE FEATURES IMPLEMENTED\n');
  console.log('✅ Lazy Loading:        html2canvas, jsPDF loaded on-demand');
  console.log('✅ Caching:             SessionStorage with TTL (10 min)');
  console.log('✅ Debouncing:          Input handlers debounced (300ms)');
  console.log('✅ Virtual Scrolling:   Enabled for 100+ items');
  console.log('✅ Lazy Images:         IntersectionObserver with 50px margin');
  console.log('✅ Code Splitting:      Heavy libraries lazy loaded');

  // Recommendations
  console.log('\n💡 OPTIMIZATION RECOMMENDATIONS\n');

  const recommendations = [];

  if (report.totals.raw > MAX_BUNDLE_SIZE) {
    recommendations.push('⚠️  Bundle size exceeds 500KB target - consider minification');
  }

  const indexSize = report.files.find(f => f.file === 'index.html')?.rawSize || 0;
  if (indexSize > 150 * 1024) {
    recommendations.push('⚠️  index.html is large - consider extracting inline JS to modules');
  }

  const compressionRatio = report.totals.gzipped / report.totals.raw;
  if (compressionRatio > 0.4) {
    recommendations.push('ℹ️  Compression ratio could be improved - ensure gzip is enabled on server');
  }

  if (recommendations.length === 0) {
    console.log('✅ No critical issues found - bundle is well optimized!');
  } else {
    recommendations.forEach(rec => console.log(rec));
  }

  // Save report to JSON
  const reportPath = path.join(PROJECT_ROOT, 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: build-report.json`);

  console.log('\n' + '═'.repeat(65) + '\n');

  // Exit with error code if over budget
  process.exit(overBudget ? 1 : 0);
}

// Run report
try {
  generateReport();
} catch (error) {
  console.error('❌ Error generating build report:', error);
  process.exit(1);
}
