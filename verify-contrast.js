/**
 * Contrast Ratio Verification Script
 * Verifies all subject color combinations meet WCAG AA standards (≥4.5:1)
 */

function getLuminance(r, g, b) {
	const [rs, gs, bs] = [r, g, b].map(c => {
		c = c / 255;
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16)
	] : null;
}

function getContrastRatio(color1, color2) {
	const l1 = getLuminance(...hexToRgb(color1));
	const l2 = getLuminance(...hexToRgb(color2));
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

// Test all color combinations
const colors = {
	'Languages (Blue)': { bg: '#dbeafe', text: '#1e3a8a' },
	'Sciences (Green)': { bg: '#d1fae5', text: '#065f46' },
	'Mathematics (Purple)': { bg: '#e9d5ff', text: '#581c87' },
	'Social Studies (Orange)': { bg: '#fed7aa', text: '#7c2d12' },
	'Sports & Activities (Red)': { bg: '#fecaca', text: '#7f1d1d' }
};

console.log('='.repeat(60));
console.log('Subject Color Coding - Contrast Ratio Verification');
console.log('WCAG AA Standard: ≥4.5:1');
console.log('='.repeat(60));

let allPass = true;

for (const [category, { bg, text }] of Object.entries(colors)) {
	const ratio = getContrastRatio(bg, text);
	const passes = ratio >= 4.5;
	const status = passes ? '✓ PASS' : '✗ FAIL';

	console.log(`\n${category}`);
	console.log(`  Background: ${bg}`);
	console.log(`  Text:       ${text}`);
	console.log(`  Ratio:      ${ratio.toFixed(2)}:1 ${status}`);

	if (!passes) allPass = false;
}

console.log('\n' + '='.repeat(60));
console.log(allPass ? '✓ All colors meet WCAG AA standards!' : '✗ Some colors do not meet standards');
console.log('='.repeat(60));
