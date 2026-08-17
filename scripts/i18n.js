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
			'ui.offShift': 'Off shift',
			'ui.break': 'Break',
			'ui.selfStudy': 'Self Study',

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
			'subs.whatsapp': 'Send on WhatsApp',
			'subs.clear': 'Clear selection',
			'subs.empty': 'No teachers marked absent yet. Tap names above to build a coverage plan.',
			'subs.summary': '{covered} covered · {review} to check · {selfStudy} self study',
			'subs.pinned': '{count} changed by hand',

			'shift.title': 'Shift timings',
			'shift.sub': 'For staff who are not in school the whole day. Turn off the periods they are away, so the planner never gives them cover then.',
			'shift.allDay': 'Full day',
			'shift.none': 'Everyone is in school all day.',
			'shift.window': 'In school {periods}',
			'shift.pick': 'Choose a teacher',

			'sync.ok': 'Saved to the school database',
			'sync.offline': 'Saved on this device only',
			'sync.off': 'Database not connected',

			'msg.title': 'Substitution Plan',
			'msg.absent': 'absent',
			'msg.noCover': 'NO TEACHER FREE — please arrange',
			'msg.heldOpen': 'being arranged by the office',
			'msg.team': 'covered by the co-teacher',
			'msg.selfStudy': '*SELF STUDY* — no teacher was free',
			'msg.check': 'please confirm',
			'msg.summary': '{total} periods · {covered} covered · {review} to check · {selfStudy} self study',
			'msg.allClear': '{total} periods · all covered',
			'msg.footer': 'Sent from the VPPS Timetable app',

			'sub.selected': '{count} selected',
			'sub.assigned': 'Assigned',
			'sub.reviewRequired': 'Review required',
			'sub.unassigned': 'Open',
			'sub.class_subject': 'Teaches this class and subject',
			'sub.class': 'Teaches this class',
			'sub.exact': 'Exact subject match',
			'sub.approved': 'Approved subject cover',
			'sub.related': 'Related subject only',
			'sub.general': 'General availability only',
			'sub.noCandidates': 'No available teacher found.',
			'sub.selfStudyWhy': 'No teacher free · the class sits self study',
			'sub.pinned': 'Chosen by the coordinator',
			'sub.heldOpen': 'Left open on purpose',
			'sub.openShort': 'Left open',

			'edit.close': 'Close',
			'edit.auto': 'Best available',
			'edit.autoWhy': 'Let the planner choose, and re-choose if anything changes',
			'edit.leaveOpen': 'Leave open',
			'edit.leaveOpenWhy': 'Arrange this one yourself; the planner will not fill it',
			'edit.classPeriods': '{n} periods a week with this class',
			'edit.recent': 'covered {n} recently',
			'edit.readyWhy': 'Free and available',
			'edit.none': 'No other teacher is available for this period.',
			'edit.clearPins': 'Undo my changes',

			'ledger.title': 'Cover load · last {days} days',
			'ledger.none': 'No cover recorded yet.',

			'warning.subject_mismatch': 'Subject qualification is not verified',
			'warning.class_not_subject': 'Knows the class, but not this subject',
			'warning.related_subject': 'Related subject only',
			'warning.over_substitution_limit': 'Daily substitution limit exceeded',
			'warning.full_day': 'Teacher would have no free period',
			'warning.excessive_consecutive': 'Creates a long consecutive teaching run',

			'error.absent': 'Teacher is marked absent',
			'error.regular_class': 'Teacher already has a regular class',
			'error.double_booked': 'Teacher is already covering another class',
			'error.unavailable': 'Outside this teacher\'s shift',
			'error.loadFailed': 'The timetable could not be loaded.',

			'a11y.language': 'Switch language',
			'a11y.theme': 'Toggle dark mode',
			'a11y.nav': 'Primary navigation',
			'a11y.grid': 'Timetable table. Scroll sideways for more periods.',

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
			'ui.offShift': 'ड्यूटी से बाहर',
			'ui.break': 'अवकाश',
			'ui.selfStudy': 'स्वयं अध्ययन',

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
			'subs.whatsapp': 'व्हाट्सऐप पर भेजें',
			'subs.clear': 'चयन हटाएँ',
			'subs.empty': 'अभी कोई शिक्षक अनुपस्थित नहीं चुना गया। ऊपर नाम पर टैप करें।',
			'subs.summary': '{covered} कवर · {review} जाँचें · {selfStudy} स्वयं अध्ययन',
			'subs.pinned': '{count} स्वयं बदले गए',

			'shift.title': 'ड्यूटी समय',
			'shift.sub': 'जो शिक्षक पूरे दिन विद्यालय में नहीं रहते, उनके अनुपस्थित पीरियड बंद करें, ताकि उस समय उन्हें प्रतिस्थापन न दिया जाए।',
			'shift.allDay': 'पूरा दिन',
			'shift.none': 'सभी शिक्षक पूरे दिन विद्यालय में हैं।',
			'shift.window': 'विद्यालय में {periods}',
			'shift.pick': 'शिक्षक चुनें',

			'sync.ok': 'विद्यालय डेटाबेस में सहेजा गया',
			'sync.offline': 'केवल इस डिवाइस पर सहेजा गया',
			'sync.off': 'डेटाबेस जुड़ा नहीं है',

			'msg.title': 'प्रतिस्थापन योजना',
			'msg.absent': 'अनुपस्थित',
			'msg.noCover': 'कोई शिक्षक खाली नहीं — कृपया व्यवस्था करें',
			'msg.heldOpen': 'कार्यालय द्वारा व्यवस्था की जा रही है',
			'msg.team': 'सह-शिक्षक द्वारा कवर',
			'msg.selfStudy': '*स्वयं अध्ययन* — कोई शिक्षक खाली नहीं था',
			'msg.check': 'कृपया पुष्टि करें',
			'msg.summary': '{total} पीरियड · {covered} कवर · {review} जाँचें · {selfStudy} स्वयं अध्ययन',
			'msg.allClear': '{total} पीरियड · सभी कवर',
			'msg.footer': 'वीपीपीएस समय-सारणी ऐप से भेजा गया',

			'sub.selected': '{count} चयनित',
			'sub.assigned': 'नियुक्त',
			'sub.reviewRequired': 'समीक्षा आवश्यक',
			'sub.unassigned': 'खुला',
			'sub.class_subject': 'यही कक्षा और यही विषय पढ़ाते हैं',
			'sub.class': 'यही कक्षा पढ़ाते हैं',
			'sub.exact': 'विषय का सटीक मिलान',
			'sub.approved': 'स्वीकृत विषय कवरेज',
			'sub.related': 'केवल संबंधित विषय',
			'sub.general': 'केवल सामान्य उपलब्धता',
			'sub.noCandidates': 'कोई उपलब्ध शिक्षक नहीं मिला।',
			'sub.selfStudyWhy': 'कोई शिक्षक खाली नहीं · कक्षा स्वयं अध्ययन करेगी',
			'sub.pinned': 'प्रभारी द्वारा चुना गया',
			'sub.heldOpen': 'जानबूझकर खुला रखा गया',
			'sub.openShort': 'खुला रखा',

			'edit.close': 'बंद करें',
			'edit.auto': 'सर्वोत्तम उपलब्ध',
			'edit.autoWhy': 'योजनाकार स्वयं चुने, और बदलाव होने पर फिर से चुने',
			'edit.leaveOpen': 'खुला छोड़ें',
			'edit.leaveOpenWhy': 'यह व्यवस्था स्वयं करें; योजनाकार इसे नहीं भरेगा',
			'edit.classPeriods': 'इस कक्षा के साथ सप्ताह में {n} पीरियड',
			'edit.recent': 'हाल में {n} बार कवर किया',
			'edit.readyWhy': 'खाली और उपलब्ध',
			'edit.none': 'इस पीरियड के लिए कोई अन्य शिक्षक उपलब्ध नहीं है।',
			'edit.clearPins': 'मेरे बदलाव हटाएँ',

			'ledger.title': 'कवर भार · पिछले {days} दिन',
			'ledger.none': 'अभी कोई कवर दर्ज नहीं है।',

			'warning.subject_mismatch': 'विषय योग्यता सत्यापित नहीं है',
			'warning.class_not_subject': 'कक्षा से परिचित हैं, पर यह विषय नहीं पढ़ाते',
			'warning.related_subject': 'केवल संबंधित विषय',
			'warning.over_substitution_limit': 'दैनिक प्रतिस्थापन सीमा पार',
			'warning.full_day': 'शिक्षक का कोई खाली पीरियड नहीं बचेगा',
			'warning.excessive_consecutive': 'लगातार बहुत अधिक पीरियड बनेंगे',

			'error.absent': 'शिक्षक अनुपस्थित चिह्नित हैं',
			'error.regular_class': 'शिक्षक की नियमित कक्षा पहले से है',
			'error.double_booked': 'शिक्षक दूसरी कक्षा कवर कर रहे हैं',
			'error.unavailable': 'शिक्षक के ड्यूटी समय से बाहर',
			'error.loadFailed': 'समय-सारणी लोड नहीं हो सकी।',

			'a11y.language': 'भाषा बदलें',
			'a11y.theme': 'डार्क मोड बदलें',
			'a11y.nav': 'मुख्य नेविगेशन',
			'a11y.grid': 'समय-सारणी तालिका। और पीरियड देखने के लिए बगल में स्क्रॉल करें।',

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
