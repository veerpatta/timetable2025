(function initI18n(root, factory) {
	const api = factory();
	if (typeof module === 'object' && module.exports) module.exports = api;
	if (root) root.I18n = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createI18n() {
	'use strict';

	const STORAGE_KEY = 'vpps-language';
	const DEFAULT_LANGUAGE = 'en';

	// English and Hindi must expose exactly the same keys - the substitution
	// engine test asserts parity, and a missing key silently falls back to English.
	const dictionaries = {
		en: {
			'app.name': 'VPPS Timetable',
			'app.school': 'Veer Patta Public School, Amet',

			'nav.home': 'Home',
			'nav.today': 'Today',
			'nav.class': 'Classes',
			'nav.teacher': 'Teachers',
			'nav.subs': 'Substitutes',

			'ui.now': 'NOW',
			'ui.live': 'LIVE',
			'ui.free': 'Free period',
			'ui.freeShort': 'Free',
			'ui.periods': 'periods',
			'ui.noFree': 'No one free',
			'ui.team': 'Team covers',
			'ui.copied': 'Copied to clipboard',
			'ui.list': 'List',
			'ui.table': 'Table',
			'ui.day': 'Day',
			'ui.week': 'Week',
			'ui.classCol': 'Class',
			'ui.periodShort': 'P',

			'setup.title': 'Set up this phone',
			'setup.sub': 'Teachers get their own schedule on the home screen. You can change this anytime.',
			'setup.teacher': 'I am a teacher',
			'setup.admin': 'Admin / just browsing',
			'setup.back': 'Back',
			'setup.change': 'Change',

			'status.closed': 'Sunday · School closed',
			'status.before': 'Opens 8:00 AM · Period 1 at 8:30 AM',
			'status.complete': 'School day complete · Closes 2:10 PM',
			'status.break': 'Short break · {time}',
			'status.lunch': 'Lunch · {time}',
			'status.zero': 'Zero period · {time}',
			'status.closedTitle': 'School is closed today',
			'status.beforeTitle': 'School opens soon',
			'status.completeTitle': 'Classes are complete',
			'status.breakTitle': 'Short break',
			'status.lunchTitle': 'Lunch',
			'status.zeroTitle': 'Zero period',

			'schedule.practiceNote': 'Practice bells · until 15 Aug',
			'schedule.practiceSub': 'Shorter periods, lunch 11:00 AM, classes end 1:00 PM',

			'hero.yourDay': 'Your day',
			'hero.next': 'Next',
			'hero.periodLive': 'Period {n} is live',
			'hero.nextMonday': 'Next: {day} · P1 8:30 AM',
			'hero.nextAfterBreak': 'Next: {period} · {time}',
			'hero.zeroSub': '{time} · kept free for preparation',

			'home.freeRightNow': 'Free right now',
			'home.shareDay': 'Share this day',

			'board.title': 'Who is teaching?',
			'board.freeThisPeriod': 'Free this period',

			'class.title': 'Class timetable',
			'teacher.title': 'Teacher timetable',

			'subs.title': 'Substitution planner',
			'subs.sub': 'Pick a day, mark absent teachers, and get free-teacher suggestions for every affected period.',
			'subs.markAbsent': 'Mark absent teachers',
			'subs.share': 'Share this plan',
			'subs.clear': 'Clear selection',
			'subs.empty': 'No teachers marked absent yet. Tap names above to build a coverage plan.',

			'sub.selected': '{count} selected',
			'sub.assigned': 'Assigned',
			'sub.reviewRequired': 'Review required',
			'sub.unassigned': 'Open',
			'sub.exact': 'Exact subject match',
			'sub.approved': 'Approved subject cover',
			'sub.related': 'Related subject only',
			'sub.general': 'General availability only',
			'sub.noCandidates': 'No available teacher found.',

			'warning.subject_mismatch': 'Subject qualification is not verified',
			'warning.related_subject': 'Related subject only',
			'warning.over_substitution_limit': 'Daily substitution limit exceeded',
			'warning.full_day': 'Teacher would have no free period',
			'warning.excessive_consecutive': 'Creates a long consecutive teaching run',

			'error.absent': 'Teacher is marked absent',
			'error.regular_class': 'Teacher already has a regular class',
			'error.double_booked': 'Teacher is already covering another class',
			'error.unavailable': 'Teacher is unavailable in this period',
			'error.loadFailed': 'The timetable could not be loaded.',

			'a11y.language': 'Switch language',
			'a11y.theme': 'Toggle dark mode',
			'a11y.nav': 'Primary navigation',

			'language.english': 'English',
			'language.hindi': 'हिंदी'
		},
		hi: {
			'app.name': 'वीपीपीएस समय-सारणी',
			'app.school': 'वीर पट्टा पब्लिक स्कूल, आमेट',

			'nav.home': 'होम',
			'nav.today': 'आज',
			'nav.class': 'कक्षा',
			'nav.teacher': 'शिक्षक',
			'nav.subs': 'प्रतिस्थापन',

			'ui.now': 'अभी',
			'ui.live': 'लाइव',
			'ui.free': 'खाली पीरियड',
			'ui.freeShort': 'खाली',
			'ui.periods': 'पीरियड',
			'ui.noFree': 'कोई खाली नहीं',
			'ui.team': 'टीम संभालेगी',
			'ui.copied': 'क्लिपबोर्ड पर कॉपी हुआ',
			'ui.list': 'सूची',
			'ui.table': 'तालिका',
			'ui.day': 'दिन',
			'ui.week': 'सप्ताह',
			'ui.classCol': 'कक्षा',
			'ui.periodShort': 'पी',

			'setup.title': 'यह फ़ोन सेट करें',
			'setup.sub': 'शिक्षकों को होम स्क्रीन पर अपनी समय-सारणी मिलती है। इसे कभी भी बदल सकते हैं।',
			'setup.teacher': 'मैं शिक्षक हूँ',
			'setup.admin': 'एडमिन / केवल देखना',
			'setup.back': 'वापस',
			'setup.change': 'बदलें',

			'status.closed': 'रविवार · स्कूल बंद',
			'status.before': 'स्कूल 8:00 AM · पीरियड 1 — 8:30 AM',
			'status.complete': 'स्कूल का दिन पूरा · छुट्टी 2:10 PM',
			'status.break': 'छोटा अवकाश · {time}',
			'status.lunch': 'भोजन अवकाश · {time}',
			'status.zero': 'शून्य कालांश · {time}',
			'status.closedTitle': 'आज स्कूल बंद है',
			'status.beforeTitle': 'स्कूल जल्द खुलेगा',
			'status.completeTitle': 'आज की कक्षाएँ पूरी हुईं',
			'status.breakTitle': 'छोटा अवकाश',
			'status.lunchTitle': 'भोजन अवकाश',
			'status.zeroTitle': 'शून्य कालांश',

			'schedule.practiceNote': 'अभ्यास समय-सारणी · 15 अगस्त तक',
			'schedule.practiceSub': 'छोटे पीरियड, भोजन 11:00 AM, कक्षाएँ 1:00 PM पर समाप्त',

			'hero.yourDay': 'आपका दिन',
			'hero.next': 'आगे',
			'hero.periodLive': 'पीरियड {n} चल रहा है',
			'hero.nextMonday': 'आगे: {day} · पी1 8:30 AM',
			'hero.nextAfterBreak': 'आगे: {period} · {time}',
			'hero.zeroSub': '{time} · तैयारी के लिए खाली',

			'home.freeRightNow': 'अभी खाली',
			'home.shareDay': 'यह दिन साझा करें',

			'board.title': 'कौन पढ़ा रहा है?',
			'board.freeThisPeriod': 'इस पीरियड में खाली',

			'class.title': 'कक्षा समय-सारणी',
			'teacher.title': 'शिक्षक समय-सारणी',

			'subs.title': 'प्रतिस्थापन योजना',
			'subs.sub': 'दिन चुनें, अनुपस्थित शिक्षकों को चिह्नित करें, और हर प्रभावित पीरियड के लिए खाली शिक्षक के सुझाव पाएँ।',
			'subs.markAbsent': 'अनुपस्थित शिक्षक चुनें',
			'subs.share': 'योजना साझा करें',
			'subs.clear': 'चयन हटाएँ',
			'subs.empty': 'अभी कोई शिक्षक अनुपस्थित नहीं चुना गया। ऊपर नाम पर टैप करें।',

			'sub.selected': '{count} चयनित',
			'sub.assigned': 'नियुक्त',
			'sub.reviewRequired': 'समीक्षा आवश्यक',
			'sub.unassigned': 'खुला',
			'sub.exact': 'विषय का सटीक मिलान',
			'sub.approved': 'स्वीकृत विषय कवरेज',
			'sub.related': 'केवल संबंधित विषय',
			'sub.general': 'केवल सामान्य उपलब्धता',
			'sub.noCandidates': 'कोई उपलब्ध शिक्षक नहीं मिला।',

			'warning.subject_mismatch': 'विषय योग्यता सत्यापित नहीं है',
			'warning.related_subject': 'केवल संबंधित विषय',
			'warning.over_substitution_limit': 'दैनिक प्रतिस्थापन सीमा पार',
			'warning.full_day': 'शिक्षक का कोई खाली पीरियड नहीं बचेगा',
			'warning.excessive_consecutive': 'लगातार बहुत अधिक पीरियड बनेंगे',

			'error.absent': 'शिक्षक अनुपस्थित चिह्नित हैं',
			'error.regular_class': 'शिक्षक की नियमित कक्षा पहले से है',
			'error.double_booked': 'शिक्षक दूसरी कक्षा कवर कर रहे हैं',
			'error.unavailable': 'इस पीरियड में शिक्षक उपलब्ध नहीं हैं',
			'error.loadFailed': 'समय-सारणी लोड नहीं हो सकी।',

			'a11y.language': 'भाषा बदलें',
			'a11y.theme': 'डार्क मोड बदलें',
			'a11y.nav': 'मुख्य नेविगेशन',

			'language.english': 'English',
			'language.hindi': 'हिंदी'
		}
	};

	// Day and class names are data values, not UI copy, so they are translated
	// by lookup rather than by dictionary key.
	const DAY_NAMES = {
		hi: {
			Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार',
			Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार'
		}
	};
	const DAY_NAMES_SHORT = {
		hi: {
			Monday: 'सोम', Tuesday: 'मंगल', Wednesday: 'बुध',
			Thursday: 'गुरु', Friday: 'शुक्र', Saturday: 'शनि'
		}
	};

	let currentLanguage = DEFAULT_LANGUAGE;

	function interpolate(template, params) {
		return String(template).replace(/\{(\w+)\}/g, (match, key) => (
			Object.prototype.hasOwnProperty.call(params || {}, key) ? String(params[key]) : match
		));
	}

	function t(key, params, language) {
		const lang = dictionaries[language] ? language : currentLanguage;
		const fallback = dictionaries[DEFAULT_LANGUAGE][key] || key;
		return interpolate(dictionaries[lang][key] || fallback, params || {});
	}

	function dayLabel(day, short, language) {
		const lang = dictionaries[language] ? language : currentLanguage;
		if (lang !== 'hi') return short ? String(day).slice(0, 3) : day;
		const table = short ? DAY_NAMES_SHORT.hi : DAY_NAMES.hi;
		return table[day] || day;
	}

	function classLabel(className, short, language) {
		const lang = dictionaries[language] ? language : currentLanguage;
		if (lang === 'hi') {
			const translated = String(className)
				.replace('Class ', 'कक्षा ')
				.replace('Science', 'विज्ञान')
				.replace('Commerce', 'वाणिज्य')
				.replace('Arts', 'कला');
			return short ? translated.replace('कक्षा ', '') : translated;
		}
		if (!short) return className;
		return String(className)
			.replace('Class ', '')
			.replace('Science', 'Sci')
			.replace('Commerce', 'Com');
	}

	function locale(language) {
		const lang = dictionaries[language] ? language : currentLanguage;
		return lang === 'hi' ? 'hi-IN' : 'en-IN';
	}

	function setLanguage(language, options) {
		if (!dictionaries[language]) return currentLanguage;
		currentLanguage = language;
		if (!options || options.persist !== false) {
			try { localStorage.setItem(STORAGE_KEY, language); } catch (error) { /* storage is optional */ }
		}
		if (typeof document !== 'undefined') {
			document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
		}
		if (typeof window !== 'undefined' && (!options || options.emit !== false)) {
			window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
		}
		return currentLanguage;
	}

	function init(storage) {
		let saved = DEFAULT_LANGUAGE;
		try { saved = (storage || localStorage).getItem(STORAGE_KEY) || DEFAULT_LANGUAGE; } catch (error) { /* use default */ }
		return setLanguage(dictionaries[saved] ? saved : DEFAULT_LANGUAGE, { persist: false, emit: false });
	}

	function getLanguage() { return currentLanguage; }
	function getDictionaries() { return dictionaries; }

	return {
		STORAGE_KEY, DEFAULT_LANGUAGE, dictionaries,
		t, init, setLanguage, getLanguage, getDictionaries,
		dayLabel, classLabel, locale
	};
});
