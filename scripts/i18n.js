(function initI18n(root, factory) {
	const api = factory();
	if (typeof module === 'object' && module.exports) module.exports = api;
	if (root) root.I18n = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createI18n() {
	'use strict';

	const STORAGE_KEY = 'vpps-language';
	const DEFAULT_LANGUAGE = 'en';
	const dictionaries = {
		en: {
			'app.name': 'VPPS Timetable',
			'app.school': 'Veer Patta Public School, Amet',
			'nav.home': 'Home',
			'nav.today': 'Today',
			'nav.substitutions': 'Substitutions',
			'nav.class': 'Classes',
			'nav.teacher': 'Teachers',
			'nav.theme': 'Theme',
			'nav.language': 'Language',
			'action.autoAssign': 'Auto Assign',
			'action.browseTeachers': 'Browse Teachers',
			'action.clear': 'Clear',
			'action.change': 'Change',
			'action.choose': 'Choose',
			'action.approve': 'Approve',
			'action.cancel': 'Cancel',
			'action.reset': 'Reset Plan',
			'action.shareImage': 'Share Image',
			'action.shareText': 'Share Table',
			'action.print': 'Print',
			'action.viewToday': 'View Today',
			'action.planSubstitutions': 'Plan Substitutions',
			'action.fullTable': 'Full Table',
			'action.mobileList': 'Mobile List',
			'dashboard.now': 'Now',
			'dashboard.glance': 'Today at a glance',
			'dashboard.statusLive': 'Live school day',
			'dashboard.statusBreak': 'Short break',
			'dashboard.statusUpcoming': 'Before school',
			'dashboard.statusComplete': 'School day complete',
			'dashboard.liveHeadline': '{day} is in {period}',
			'dashboard.breakHeadline': 'Break before {period}',
			'dashboard.upcomingHeadline': '{day} starts with {period}',
			'dashboard.completeHeadline': 'Classes are complete for {day}',
			'dashboard.liveMessage': '{time} is active now.',
			'dashboard.breakMessage': '{period} begins at {time}.',
			'dashboard.upcomingMessage': 'School starts with {period} at {time}.',
			'dashboard.completeMessage': 'Use the timetable or plan the next school day.',
			'dashboard.classesScheduled': '{count} classes scheduled',
			'dashboard.currentSlot': 'Current period',
			'dashboard.nextSlot': 'Next period',
			'dashboard.bestAvailable': 'Best available',
			'dashboard.freeTeachers': 'Free teachers',
			'dashboard.teacherOne': '1 teacher',
			'dashboard.teacherMany': '{count} teachers',
			'dashboard.available': '{count} teachers free',
			'dashboard.closed': 'School is closed today',
			'dashboard.nextSchoolDay': 'Next school day: {day}',
			'day.heading': '{day} timetable',
			'day.choosePeriod': 'Choose a period',
			'day.classesCount': '{count} classes',
			'sub.title': 'Plan substitutions',
			'sub.planFor': 'Plan substitutions for {day}',
			'sub.statusSetup': 'Setup needed',
			'sub.statusNothing': 'Nothing to cover',
			'sub.statusReady': 'Plan ready',
			'sub.statusReview': 'Needs review',
			'sub.statusGenerate': 'Ready to generate',
			'sub.noClasses': '{day} has no classes to cover',
			'sub.coveredCount': '{count} substitution periods covered',
			'sub.partialCount': '{covered} covered, {open} still open',
			'sub.slotsNeed': '{count} periods need coverage',
			'sub.setupHelp': 'Select absent teachers, preview affected classes, then generate the qualified coverage plan.',
			'sub.reviewHelp': 'Review every warning before sharing the plan.',
			'sub.shareHelp': 'All qualified assignments are ready to share.',
			'sub.date': 'School date',
			'sub.absentTeachers': 'Absent teachers',
			'sub.searchTeacher': 'Search teacher name',
			'sub.selected': '{count} selected',
			'sub.affected': '{count} affected periods',
			'sub.coveragePlan': 'Coverage plan',
			'sub.saved': 'Saved on this device',
			'sub.noAbsent': 'Select absent teachers to begin.',
			'sub.noAffected': 'These teachers have no scheduled classes on this date.',
			'sub.ready': 'Qualified assignments are ready for review.',
			'sub.needsReview': '{count} periods need coordinator review.',
			'sub.open': '{count} periods are still open.',
			'sub.openLabel': 'Open',
			'sub.coveredLabel': 'Covered',
			'sub.assigned': 'Assigned',
			'sub.reviewRequired': 'Review required',
			'sub.unassigned': 'Open',
			'sub.exact': 'Exact subject match',
			'sub.approved': 'Approved subject cover',
			'sub.related': 'Related subject only',
			'sub.general': 'General availability only',
			'sub.load': '{regular} regular + {substitutions} substitutions',
			'sub.sameGrade': 'Grade {grade} experience',
			'sub.otherGrade': 'Different grade experience',
			'sub.fallbackNotice': 'This teacher is not verified for the subject. Review before assigning.',
			'sub.overrideNotice': 'This assignment exceeds the recommended workload. Continue only after review.',
			'sub.invalidDate': 'Choose a Monday–Saturday school date.',
			'sub.planExpired': 'The saved plan used an older timetable and was cleared.',
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
			'home.yourDay': 'Your day',
			'home.setupTitle': 'Set up this phone',
			'home.setupSub': 'Teachers get their own schedule on the home screen. You can change this anytime.',
			'home.iTeach': 'I am a teacher',
			'home.justBrowse': 'Admin / just browsing',
			'home.freePeriod': 'Free period',
			'home.shareDay': 'Share this day',
			'home.periodsLoad': '{count}/{total} periods',
			'home.copied': 'Copied to clipboard',
			'home.shareFailed': 'Unable to share right now',
			'language.english': 'English',
			'language.hindi': 'हिंदी'
		},
		hi: {
			'app.name': 'वीपीपीएस समय-सारणी',
			'app.school': 'वीर पट्टा पब्लिक स्कूल, आमेट',
			'nav.home': 'होम',
			'nav.today': 'आज',
			'nav.substitutions': 'प्रतिस्थापन',
			'nav.class': 'कक्षाएं',
			'nav.teacher': 'शिक्षक',
			'nav.theme': 'थीम',
			'nav.language': 'भाषा',
			'action.autoAssign': 'स्वतः नियुक्त करें',
			'action.browseTeachers': 'शिक्षक चुनें',
			'action.clear': 'साफ़ करें',
			'action.change': 'बदलें',
			'action.choose': 'चुनें',
			'action.approve': 'स्वीकृत करें',
			'action.cancel': 'रद्द करें',
			'action.reset': 'योजना रीसेट करें',
			'action.shareImage': 'चित्र साझा करें',
			'action.shareText': 'तालिका साझा करें',
			'action.print': 'प्रिंट करें',
			'action.viewToday': 'आज देखें',
			'action.planSubstitutions': 'प्रतिस्थापन बनाएं',
			'action.fullTable': 'पूरी तालिका',
			'action.mobileList': 'मोबाइल सूची',
			'dashboard.now': 'अभी',
			'dashboard.glance': 'आज की जानकारी',
			'dashboard.statusLive': 'विद्यालय चल रहा है',
			'dashboard.statusBreak': 'अल्पावकाश',
			'dashboard.statusUpcoming': 'विद्यालय शुरू होने से पहले',
			'dashboard.statusComplete': 'विद्यालय दिवस पूरा',
			'dashboard.liveHeadline': '{day} में अभी {period}',
			'dashboard.breakHeadline': '{period} से पहले अवकाश',
			'dashboard.upcomingHeadline': '{day} की शुरुआत {period} से',
			'dashboard.completeHeadline': '{day} की कक्षाएं पूरी हुईं',
			'dashboard.liveMessage': '{time} का पीरियड अभी चल रहा है।',
			'dashboard.breakMessage': '{period} {time} पर शुरू होगा।',
			'dashboard.upcomingMessage': 'विद्यालय {time} पर {period} से शुरू होगा।',
			'dashboard.completeMessage': 'समय-सारणी देखें या अगले विद्यालय दिवस की योजना बनाएं।',
			'dashboard.classesScheduled': '{count} कक्षाएं निर्धारित',
			'dashboard.currentSlot': 'वर्तमान पीरियड',
			'dashboard.nextSlot': 'अगला पीरियड',
			'dashboard.bestAvailable': 'सर्वोत्तम उपलब्ध',
			'dashboard.freeTeachers': 'उपलब्ध शिक्षक',
			'dashboard.teacherOne': '1 शिक्षक',
			'dashboard.teacherMany': '{count} शिक्षक',
			'dashboard.available': '{count} शिक्षक उपलब्ध',
			'dashboard.closed': 'आज विद्यालय बंद है',
			'dashboard.nextSchoolDay': 'अगला विद्यालय दिवस: {day}',
			'day.heading': '{day} की समय-सारणी',
			'day.choosePeriod': 'पीरियड चुनें',
			'day.classesCount': '{count} कक्षाएं',
			'sub.title': 'प्रतिस्थापन योजना',
			'sub.planFor': '{day} के लिए प्रतिस्थापन योजना',
			'sub.statusSetup': 'सेटअप आवश्यक',
			'sub.statusNothing': 'कोई कवरेज आवश्यक नहीं',
			'sub.statusReady': 'योजना तैयार',
			'sub.statusReview': 'समीक्षा आवश्यक',
			'sub.statusGenerate': 'योजना बनाने के लिए तैयार',
			'sub.noClasses': '{day} के लिए कोई कक्षा कवर नहीं करनी है',
			'sub.coveredCount': '{count} प्रतिस्थापन पीरियड कवर',
			'sub.partialCount': '{covered} कवर, {open} अभी खुले',
			'sub.slotsNeed': '{count} पीरियड को कवरेज चाहिए',
			'sub.setupHelp': 'अनुपस्थित शिक्षक चुनें, प्रभावित कक्षाएं देखें और योग्य कवरेज योजना बनाएं।',
			'sub.reviewHelp': 'योजना साझा करने से पहले हर चेतावनी की समीक्षा करें।',
			'sub.shareHelp': 'सभी योग्य नियुक्तियां साझा करने के लिए तैयार हैं।',
			'sub.date': 'विद्यालय की तारीख',
			'sub.absentTeachers': 'अनुपस्थित शिक्षक',
			'sub.searchTeacher': 'शिक्षक का नाम खोजें',
			'sub.selected': '{count} चयनित',
			'sub.affected': '{count} प्रभावित पीरियड',
			'sub.coveragePlan': 'कवरेज योजना',
			'sub.saved': 'इस डिवाइस पर सहेजा गया',
			'sub.noAbsent': 'शुरू करने के लिए अनुपस्थित शिक्षक चुनें।',
			'sub.noAffected': 'इस तारीख को इन शिक्षकों की कोई कक्षा नहीं है।',
			'sub.ready': 'योग्य नियुक्तियां समीक्षा के लिए तैयार हैं।',
			'sub.needsReview': '{count} पीरियड की समीक्षा आवश्यक है।',
			'sub.open': '{count} पीरियड अभी खुले हैं।',
			'sub.openLabel': 'खुले',
			'sub.coveredLabel': 'कवर',
			'sub.assigned': 'नियुक्त',
			'sub.reviewRequired': 'समीक्षा आवश्यक',
			'sub.unassigned': 'खुला',
			'sub.exact': 'विषय का सटीक मिलान',
			'sub.approved': 'स्वीकृत विषय कवरेज',
			'sub.related': 'केवल संबंधित विषय',
			'sub.general': 'केवल सामान्य उपलब्धता',
			'sub.load': '{regular} नियमित + {substitutions} प्रतिस्थापन',
			'sub.sameGrade': 'कक्षा {grade} का अनुभव',
			'sub.otherGrade': 'अन्य कक्षाओं का अनुभव',
			'sub.fallbackNotice': 'इस शिक्षक की विषय योग्यता सत्यापित नहीं है। नियुक्ति से पहले समीक्षा करें।',
			'sub.overrideNotice': 'यह नियुक्ति अनुशंसित कार्यभार से अधिक है। समीक्षा के बाद ही जारी रखें।',
			'sub.invalidDate': 'सोमवार से शनिवार के बीच विद्यालय की तारीख चुनें।',
			'sub.planExpired': 'पुरानी समय-सारणी वाली सहेजी योजना हटा दी गई है।',
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
			'home.yourDay': 'आपका दिन',
			'home.setupTitle': 'यह फ़ोन सेट करें',
			'home.setupSub': 'शिक्षकों को होम स्क्रीन पर अपनी समय-सारणी मिलती है। इसे कभी भी बदल सकते हैं।',
			'home.iTeach': 'मैं शिक्षक हूँ',
			'home.justBrowse': 'एडमिन / केवल देखना',
			'home.freePeriod': 'खाली पीरियड',
			'home.shareDay': 'यह दिन साझा करें',
			'home.periodsLoad': '{count}/{total} पीरियड',
			'home.copied': 'क्लिपबोर्ड पर कॉपी हुआ',
			'home.shareFailed': 'अभी साझा नहीं किया जा सका',
			'language.english': 'English',
			'language.hindi': 'हिंदी'
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

	return { STORAGE_KEY, DEFAULT_LANGUAGE, dictionaries, t, init, setLanguage, getLanguage, getDictionaries };
});
