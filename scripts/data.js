// VPPS timetable source data - Timetable 2026-27 (v4).
// rawData is the single source of truth for the schedule. Keep it in sync with
// the official class-wise / day-wise / teacher-wise PDFs under docs/sources/.
(function (root, factory) {
	const api = factory();
	if (typeof module === "object" && module.exports) module.exports = api;
	if (root) root.VPPSData = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createData() {
	"use strict";

	const rawData = `Monday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),Sports (Rakesh),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Anjana),EVS (Ravina),EVS (Ravina)
Class 2,Maths (Ravina),EVS (Bindu),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Bindu),Hindi (Bindu),EVS (Bindu)
Class 3,EVS (Rashmita),EVS (Rashmita),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Maths (Ravina),Hindi (Kusum),Hindi (Kusum)
Class 4,Hindi (Kusum),Hindi (Kusum),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Maths (Anita),EVS (Rashmita),EVS (Rashmita)
Class 5,Maths (Nidhika),Maths (Nidhika),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Kusum),CCS (Maya),EVS (Anita)
Class 6,English compulsory (Hemlata),CCS (Maya),Robotics (Maya),Sports (Rakesh),NoteBook Checking (Antima),SST (Rashmita),Maths (Nidhika),Maths (Nidhika)
Class 7,Maths (Anita),Maths (Anita),Sanskrit (Antima),Physics (Prateek),SST (Nidhika),English compulsory (Harshita),Biology (Hemlata),NoteBook Checking (Antima)
Class 8,Sanskrit (Antima),Biology (Hemlata),English compulsory (Pradhyuman),SST (Harshita),SST (Harshita),CCS (Maya),Maths (Prakash),Maths (Prakash)
Class 9,Hindi (Jainendra),Sanskrit (Antima),Science (Toshit),Science (Toshit),SST (Pradhyuman),SST (Pradhyuman),English compulsory (Harshita),Maths (Nathulal)
Class 10,SST (Pradhyuman),English compulsory (Harshita),English compulsory (Harshita),Sanskrit (Antima),Maths (Nathulal),Hindi (Antima),Science (Toshit),Science (Toshit)
Class 11 Science,Physics (Prateek),Chemistry (Toshit),Biology (Hemlata),English compulsory (Pradhyuman),Hindi (Jainendra),Chemistry (Toshit),Maths (Prateek),Biology (Hemlata)
Class 11 Commerce,Self Study (Maya),Economics (Prakash),Economics (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Business Studies (Nidhika),Accountancy (Nathulal),Free
Class 11 Arts,English Literature (Harshita),Economics (Prakash),Economics (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Geography (Prakash),NoteBook Checking (Antima),Political Science (Pradhyuman)
Class 12 Science,Chemistry (Toshit),Physics (Prateek),Physics (Prateek),Biology (Hemlata),Biology (Hemlata),Hindi (Jainendra),English compulsory (Pradhyuman),Maths (Prateek)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),Business Studies (Nidhika),Economics (Prakash),Sports (Rakesh),Hindi (Jainendra),English compulsory (Pradhyuman),Free
Class 12 Arts,Geography (Prakash),Political Science (Pradhyuman),Sports (Rakesh),Economics (Prakash),Geography (Prakash),Hindi (Jainendra),English compulsory (Pradhyuman),English Literature (Harshita)

Tuesday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),Maths (Bindu),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Anjana),Hindi (Anjana),EVS (Ravina)
Class 2,Maths (Ravina),Maths (Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Bindu),EVS (Bindu),EVS (Bindu)
Class 3,EVS (Rashmita),Hindi (Kusum),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Maths (Ravina),Maths (Ravina),CCS (Maya)
Class 4,Hindi (Kusum),Sports (Rakesh),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),EVS (Rashmita),Maths (Anita),Maths (Anita)
Class 5,Maths (Nidhika),Maths (Nidhika),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),EVS (Anita),Hindi (Kusum),Hindi (Kusum)
Class 6,English compulsory (Hemlata),Chemistry (Hemlata),Physics (Hemlata),Sanskrit (Jainendra),Sports (Rakesh),Maths (Nidhika),Maths (Nidhika),SST (Rashmita)
Class 7,Maths (Anita),Maths (Anita),Sanskrit (Antima),Physics (Prateek),SST (Nidhika),Robotics (Maya),CCS (Maya),English compulsory (Harshita)
Class 8,Sanskrit (Antima),Hindi (Jainendra),Maths (Prakash),Maths (Prakash),English compulsory (Pradhyuman),SST (Harshita),Chemistry (Toshit),Biology (Hemlata)
Class 9,Hindi (Jainendra),CCS (Maya),Maths (Nathulal),Sanskrit (Antima),English compulsory (Harshita),NoteBook Checking (Antima),SST (Pradhyuman),Science (Toshit)
Class 10,SST (Pradhyuman),SST (Pradhyuman),Science (Toshit),English compulsory (Harshita),Sanskrit (Antima),Maths (Nathulal),Maths (Nathulal),Hindi (Antima)
Class 11 Science,Physics (Prateek),Physics (Prateek),Sports (Rakesh),Biology (Hemlata),Maths (Prateek),Chemistry (Toshit),Hindi (Jainendra),English compulsory (Pradhyuman)
Class 11 Commerce,CCS (Maya),NoteBook Checking (Antima),Business Studies (Nidhika),Accountancy (Nathulal),Accountancy (Nathulal),Economics (Prakash),Hindi (Jainendra),English compulsory (Pradhyuman)
Class 11 Arts,English Literature (Harshita),Geography (Prakash),English Literature (Harshita),Political Science (Pradhyuman),Geography (Prakash),Economics (Prakash),Hindi (Jainendra),English compulsory (Pradhyuman)
Class 12 Science,Chemistry (Toshit),Chemistry (Toshit),Physics (Prateek),Sports (Rakesh),Hindi (Jainendra),English compulsory (Pradhyuman),Biology (Hemlata),Maths (Prateek)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),CCS (Maya),Business Studies (Nidhika),Hindi (Jainendra),English compulsory (Pradhyuman),Sports (Rakesh),Economics (Prakash)
Class 12 Arts,Geography (Prakash),English Literature (Harshita),Political Science (Pradhyuman),CCS (Maya),Hindi (Jainendra),English compulsory (Pradhyuman),English Literature (Harshita),Economics (Prakash)

Wednesday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),EVS (Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Anjana),Hindi (Anjana),NoteBook Checking (Antima)
Class 2,Maths (Ravina),Sports (Rakesh),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),EVS (Bindu),EVS (Bindu),Hindi (Bindu)
Class 3,EVS (Rashmita),EVS (Rashmita),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Kusum),Maths (Ravina),Maths (Ravina)
Class 4,Hindi (Kusum),Hindi (Kusum),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Maths (Anita),Maths (Anita),EVS (Rashmita)
Class 5,Maths (Nidhika),EVS (Anita),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),CCS (Maya),Robotics (Maya),Hindi (Kusum)
Class 6,Biology (Hemlata),Sanskrit (Jainendra),Chemistry (Hemlata),Maths (Nidhika),Maths (Nidhika),English compulsory (Hemlata),SST (Rashmita),Hindi (Jainendra)
Class 7,Maths (Anita),English compulsory (Harshita),Sports (Rakesh),Physics (Prateek),Hindi (Jainendra),Sanskrit (Antima),SST (Nidhika),Sports (Rakesh)
Class 8,Sanskrit (Antima),Biology (Hemlata),English compulsory (Pradhyuman),Hindi (Jainendra),Chemistry (Toshit),Maths (Prakash),SST (Harshita),Physics (Prateek)
Class 9,Hindi (Jainendra),Sanskrit (Antima),Hindi (Jainendra),English compulsory (Harshita),Maths (Nathulal),Science (Toshit),Sports (Rakesh),SST (Pradhyuman)
Class 10,SST (Pradhyuman),CCS (Maya),Sanskrit (Antima),Hindi (Antima),English compulsory (Harshita),English compulsory (Harshita),Physics (Prateek),Maths (Nathulal)
Class 11 Science,Physics (Prateek),Physics (Prateek),Chemistry (Toshit),Sports (Rakesh),English compulsory (Pradhyuman),Hindi (Jainendra),Biology (Hemlata),Biology (Hemlata)
Class 11 Commerce,Self Study (Maya),Business Studies (Nidhika),Accountancy (Nathulal),Accountancy (Nathulal),English compulsory (Pradhyuman),Hindi (Jainendra),Economics (Prakash),Free
Class 11 Arts,Geography (Prakash),Geography (Prakash),CCS (Maya),Political Science (Pradhyuman),English compulsory (Pradhyuman),Hindi (Jainendra),Economics (Prakash),English Literature (Harshita)
Class 12 Science,Chemistry (Toshit),Chemistry (Toshit),Physics (Prateek),Biology (Hemlata),Biology (Hemlata),English compulsory (Pradhyuman),Hindi (Jainendra),Free
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),Economics (Prakash),CCS (Maya),Economics (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Business Studies (Nidhika)
Class 12 Arts,English Literature (Harshita),Political Science (Pradhyuman),Economics (Prakash),Geography (Prakash),Economics (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Geography (Prakash)

Thursday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),Maths (Bindu),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Anjana),EVS (Ravina),EVS (Ravina)
Class 2,Maths (Ravina),Maths (Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),EVS (Bindu),Hindi (Bindu),Hindi (Bindu)
Class 3,EVS (Rashmita),Hindi (Kusum),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Maths (Ravina),Hindi (Kusum),Sports (Rakesh)
Class 4,Hindi (Kusum),Maths (Anita),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Maths (Anita),EVS (Rashmita),EVS (Rashmita)
Class 5,Maths (Nidhika),Maths (Nidhika),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Kusum),EVS (Anita),EVS (Anita)
Class 6,English compulsory (Hemlata),SST (Rashmita),Maths (Nidhika),CCS (Maya),Hindi (Jainendra),Chemistry (Hemlata),Biology (Hemlata),Hindi (Jainendra)
Class 7,Maths (Anita),Hindi (Jainendra),Hindi (Jainendra),SST (Nidhika),Biology (Hemlata),Sanskrit (Antima),English compulsory (Harshita),Chemistry (Hemlata)
Class 8,NoteBook Checking (Antima),Robotics (Maya),CCS (Maya),English compulsory (Pradhyuman),Physics (Prateek),SST (Harshita),Maths (Prakash),Maths (Prakash)
Class 9,Hindi (Jainendra),Sanskrit (Antima),SST (Pradhyuman),English compulsory (Harshita),CCS (Maya),Science (Toshit),Maths (Nathulal),Maths (Nathulal)
Class 10,SST (Pradhyuman),SST (Pradhyuman),English compulsory (Harshita),Hindi (Antima),Sanskrit (Antima),Maths (Nathulal),Sports (Rakesh),Science (Toshit)
Class 11 Science,Physics (Prateek),Physics (Prateek),Biology (Hemlata),Chemistry (Toshit),Chemistry (Toshit),English compulsory (Pradhyuman),Hindi (Jainendra),Free
Class 11 Commerce,CCS (Maya),Sports (Rakesh),Accountancy (Nathulal),Accountancy (Nathulal),Economics (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Business Studies (Nidhika)
Class 11 Arts,English Literature (Harshita),English Literature (Harshita),Geography (Prakash),Sports (Rakesh),Economics (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Political Science (Pradhyuman)
Class 12 Science,Chemistry (Toshit),Chemistry (Toshit),Physics (Prateek),Biology (Hemlata),English compulsory (Pradhyuman),Hindi (Jainendra),NoteBook Checking (Antima),Maths (Prateek)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),NoteBook Checking (Antima),Economics (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Business Studies (Nidhika),Free
Class 12 Arts,Geography (Prakash),Geography (Prakash),Sports (Rakesh),Economics (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Political Science (Pradhyuman),English Literature (Harshita)

Friday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),Maths (Bindu),CCS (Maya),EVS (Ravina),Sports (Rakesh),Hindi (Anjana),EVS (Ravina),Hindi (Anjana)
Class 2,Maths (Ravina),Maths (Ravina),EVS (Bindu),CCS (Maya),Robotics (Maya),Hindi (Bindu),Hindi (Bindu),CCS (Maya)
Class 3,EVS (Rashmita),EVS (Rashmita),NoteBook Checking (Antima),Hindi (Kusum),Maths (Ravina),Maths (Ravina),Hindi (Kusum),Sports (Rakesh)
Class 4,Hindi (Kusum),Hindi (Kusum),EVS (Rashmita),EVS (Rashmita),Maths (Anita),CCS (Maya),Robotics (Maya),NoteBook Checking (Antima)
Class 5,Maths (Nidhika),EVS (Anita),EVS (Anita),NoteBook Checking (Antima),Hindi (Kusum),Hindi (Kusum),Sports (Rakesh),English compulsory (Ravina)
Class 6,Physics (Hemlata),Sanskrit (Jainendra),English compulsory (Hemlata),Hindi (Jainendra),SST (Rashmita),SST (Rashmita),Biology (Hemlata),Maths (Nidhika)
Class 7,Maths (Anita),CCS (Maya),SST (Nidhika),SST (Nidhika),Chemistry (Hemlata),English compulsory (Harshita),Hindi (Jainendra),Biology (Hemlata)
Class 8,Sanskrit (Antima),Sports (Rakesh),English compulsory (Pradhyuman),Physics (Prateek),SST (Harshita),Hindi (Jainendra),Maths (Prakash),Hindi (Jainendra)
Class 9,Hindi (Jainendra),Science (Toshit),Sports (Rakesh),English compulsory (Harshita),Sanskrit (Antima),Maths (Nathulal),SST (Pradhyuman),SST (Pradhyuman)
Class 10,SST (Pradhyuman),Sanskrit (Antima),English compulsory (Harshita),Maths (Nathulal),Maths (Nathulal),Hindi (Antima),Physics (Prateek),Science (Toshit)
Class 11 Science,Physics (Prateek),English compulsory (Pradhyuman),Hindi (Jainendra),Biology (Hemlata),Maths (Prateek),Chemistry (Toshit),Chemistry (Toshit),Free
Class 11 Commerce,Self Study (Maya),English compulsory (Pradhyuman),Hindi (Jainendra),Sports (Rakesh),Business Studies (Nidhika),Economics (Prakash),Accountancy (Nathulal),Accountancy (Nathulal)
Class 11 Arts,Geography (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Geography (Prakash),Political Science (Pradhyuman),Economics (Prakash),English Literature (Harshita),English Literature (Harshita)
Class 12 Science,Chemistry (Toshit),Physics (Prateek),Physics (Prateek),English compulsory (Pradhyuman),Hindi (Jainendra),Biology (Hemlata),Free,Maths (Prateek)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),Economics (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Business Studies (Nidhika),Business Studies (Nidhika),Free
Class 12 Arts,English Literature (Harshita),English Literature (Harshita),Economics (Prakash),English compulsory (Pradhyuman),Hindi (Jainendra),Political Science (Pradhyuman),NoteBook Checking (Antima),Geography (Prakash)

Saturday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),Maths (Bindu),EVS (Ravina),CCS (Maya),Robotics (Maya),Hindi (Anjana),EVS (Ravina),Hindi (Anjana)
Class 2,Maths (Ravina),Maths (Ravina),NoteBook Checking (Antima),Hindi (Bindu),Hindi (Bindu),Sports (Rakesh),EVS (Bindu),EVS (Bindu)
Class 3,EVS (Rashmita),EVS (Rashmita),Hindi (Kusum),Hindi (Kusum),Maths (Ravina),Maths (Ravina),Robotics (Maya),CCS (Maya)
Class 4,Hindi (Kusum),Hindi (Kusum),EVS (Rashmita),EVS (Rashmita),Sports (Rakesh),CCS (Maya),Maths (Anita),Maths (Anita)
Class 5,Maths (Nidhika),Maths (Nidhika),Sports (Rakesh),EVS (Anita),EVS (Anita),Hindi (Kusum),Hindi (Kusum),English compulsory (Ravina)
Class 6,English compulsory (Hemlata),English compulsory (Hemlata),Maths (Nidhika),Sanskrit (Jainendra),SST (Rashmita),SST (Rashmita),Hindi (Jainendra),Physics (Hemlata)
Class 7,Maths (Anita),Maths (Anita),Chemistry (Hemlata),Sanskrit (Antima),English compulsory (Harshita),Hindi (Jainendra),SST (Nidhika),SST (Nidhika)
Class 8,Sanskrit (Antima),Sports (Rakesh),SST (Harshita),SST (Harshita),Hindi (Jainendra),English compulsory (Pradhyuman),Maths (Prakash),Chemistry (Toshit)
Class 9,Hindi (Jainendra),SST (Pradhyuman),Science (Toshit),Science (Toshit),Maths (Nathulal),Maths (Nathulal),Sanskrit (Antima),English compulsory (Harshita)
Class 10,SST (Pradhyuman),CCS (Maya),Maths (Nathulal),Maths (Nathulal),Physics (Prateek),Sanskrit (Antima),English compulsory (Harshita),Hindi (Antima)
Class 11 Science,Physics (Prateek),Hindi (Jainendra),English compulsory (Pradhyuman),Biology (Hemlata),NoteBook Checking (Antima),Chemistry (Toshit),Biology (Hemlata),Maths (Prateek)
Class 11 Commerce,Self Study (Maya),Hindi (Jainendra),English compulsory (Pradhyuman),Business Studies (Nidhika),Economics (Prakash),Economics (Prakash),Accountancy (Nathulal),Accountancy (Nathulal)
Class 11 Arts,English Literature (Harshita),Hindi (Jainendra),English compulsory (Pradhyuman),Political Science (Pradhyuman),Economics (Prakash),Economics (Prakash),Sports (Rakesh),Geography (Prakash)
Class 12 Science,Chemistry (Toshit),Physics (Prateek),Physics (Prateek),Sports (Rakesh),Biology (Hemlata),Biology (Hemlata),English compulsory (Pradhyuman),Hindi (Jainendra)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),Economics (Prakash),Economics (Prakash),Business Studies (Nidhika),Business Studies (Nidhika),English compulsory (Pradhyuman),Hindi (Jainendra)
Class 12 Arts,Geography (Prakash),English Literature (Harshita),Economics (Prakash),Economics (Prakash),Political Science (Pradhyuman),English Literature (Harshita),English compulsory (Pradhyuman),Hindi (Jainendra)
`;

	/*
	 * Bell schedules. Times are minutes past midnight.
	 *
	 * Two sets of bells exist. Which one applies is decided by the date, so
	 * neither has to be edited by hand when the changeover comes:
	 *
	 *   practice - in force up to and including 15 August 2026. Eight shorter
	 *              periods, lunch pulled forward to 11:00, teaching finished by
	 *              1:00 PM, and 1:00 - 2:10 PM held as a zero period for
	 *              preparation. The period *content* is unchanged: Period 1-8
	 *              still map to the same rows in `rawData`.
	 *   regular  - Timetable 2026-27 (v4). Resumes automatically from
	 *              16 August 2026.
	 */
	const SCHEDULES = {
		practice: {
			id: "practice",
			periods: [
				{ n: 1, s: 510, e: 540, label: "8:30 - 9:00 AM" },
				{ n: 2, s: 540, e: 570, label: "9:00 - 9:30 AM" },
				{ n: 3, s: 570, e: 600, label: "9:30 - 10:00 AM" },
				{ n: 4, s: 600, e: 630, label: "10:00 - 10:30 AM" },
				{ n: 5, s: 630, e: 660, label: "10:30 - 11:00 AM" },
				{ n: 6, s: 680, e: 720, label: "11:20 AM - 12:00 noon" },
				{ n: 7, s: 720, e: 750, label: "12:00 - 12:30 PM" },
				{ n: 8, s: 750, e: 780, label: "12:30 - 1:00 PM" }
			],
			break: { s: 660, e: 680, kind: "lunch", label: "11:00 - 11:20 AM" },
			zero: { s: 780, e: 850, label: "1:00 - 2:10 PM" },
			reporting: 480, // 8:00 AM reporting
			close: 850      // 2:10 PM dispersal
		},
		regular: {
			id: "regular",
			periods: [
				{ n: 1, s: 510, e: 550, label: "8:30 - 9:10 AM" },
				{ n: 2, s: 550, e: 590, label: "9:10 - 9:50 AM" },
				{ n: 3, s: 590, e: 630, label: "9:50 - 10:30 AM" },
				{ n: 4, s: 630, e: 670, label: "10:30 - 11:10 AM" },
				{ n: 5, s: 690, e: 730, label: "11:30 AM - 12:10 PM" },
				{ n: 6, s: 730, e: 770, label: "12:10 - 12:50 PM" },
				{ n: 7, s: 770, e: 810, label: "12:50 - 1:30 PM" },
				{ n: 8, s: 810, e: 850, label: "1:30 - 2:10 PM" }
			],
			break: { s: 670, e: 690, kind: "break", label: "11:10 - 11:30 AM" },
			zero: null,
			reporting: 480,
			close: 850
		}
	};

	// Last calendar day the practice bells apply, as YYYYMMDD so the comparison
	// stays free of timezone and DST surprises.
	const PRACTICE_LAST_DAY = 20260815;

	function stampOf(date) {
		return (date.getFullYear() * 10000) + ((date.getMonth() + 1) * 100) + date.getDate();
	}

	/** The bell schedule in force on `date` (defaults to today). */
	function scheduleFor(date) {
		return stampOf(date || new Date()) <= PRACTICE_LAST_DAY
			? SCHEDULES.practice
			: SCHEDULES.regular;
	}

	// Resolved once at load. The app is reopened daily, so a device left running
	// across the 15/16 August changeover simply picks the new bells up on its
	// next reload.
	const SCHEDULE = scheduleFor();
	const PERIODS = SCHEDULE.periods;
	const BREAK = SCHEDULE.break;
	const ZERO_PERIOD = SCHEDULE.zero;
	const REPORTING_MIN = SCHEDULE.reporting;
	const CLOSE_MIN = SCHEDULE.close;

	// Subject -> colour category. First matching keyword wins, so longer, more
	// specific phrases must come before their shorter substrings.
	const SUBJECT_CATEGORIES = {
		languages: ["english literature", "hindi boards", "english", "hindi", "sanskrit", "elga", "language", "grammar", "literature"],
		sciences: ["environmental", "practical", "robotics", "science", "physics", "chemistry", "biology", "evs", "lab"],
		math: ["mathematics", "statistics", "calculus", "geometry", "algebra", "maths", "math"],
		social: ["political science", "accountancy", "geography", "economics", "business", "commerce", "history", "civics", "social", "sst"],
		sports: ["physical", "exercise", "activity", "sports", "games", "yoga", "pt", "pe"]
	};

	// Long subject names shortened for the dense week/day grids.
	const SHORT_SUBJECTS = {
		"English compulsory": "English",
		"English Literature": "Eng Lit",
		"NoteBook Checking": "Notebook",
		"Business Studies": "Bus Study",
		"Political Science": "Pol Sci"
	};

	function categoryOf(subject) {
		const value = String(subject || "").toLowerCase();
		const entries = Object.keys(SUBJECT_CATEGORIES);
		for (let i = 0; i < entries.length; i++) {
			if (SUBJECT_CATEGORIES[entries[i]].some(keyword => value.includes(keyword))) return entries[i];
		}
		return "default";
	}

	function shortSubject(subject) {
		return SHORT_SUBJECTS[subject] || subject;
	}

	/**
	 * Parse the CSV-ish rawData block into { days, timetable, classNames, teacherNames }.
	 * timetable[day][className] is an array of 8 cells:
	 *   { subject, teachers: string[], free?: true }
	 */
	function parseTimetable(raw) {
		const days = [];
		const timetable = {};
		const classNames = [];
		const teacherSet = new Set();
		let currentDay = null;

		String(raw).split("\n").forEach(line => {
			const text = line.trim();
			if (!text) return;
			if (!text.includes(",")) {
				currentDay = text;
				days.push(text);
				timetable[text] = {};
				return;
			}
			if (text.startsWith("Class,")) return;
			const cols = text.split(",");
			const className = cols[0];
			if (!classNames.includes(className)) classNames.push(className);
			timetable[currentDay][className] = cols.slice(1, PERIODS.length + 1).map(rawCell => {
				const cell = rawCell.trim();
				if (!cell || cell === "Free") return { free: true, subject: "Free", teachers: [] };
				const match = cell.match(/^(.*)\(([^)]*)\)\s*$/);
				if (match) {
					return {
						subject: match[1].trim(),
						teachers: match[2].split("/").map(name => name.trim()).filter(Boolean)
					};
				}
				return { subject: cell, teachers: [] };
			});
		});

		Object.keys(timetable).forEach(day =>
			Object.keys(timetable[day]).forEach(className =>
				timetable[day][className].forEach(cell =>
					cell.teachers.forEach(teacher => teacherSet.add(teacher)))));

		return { days, timetable, classNames, teacherNames: Array.from(teacherSet).sort() };
	}

	/**
	 * teacherMap[teacher][day][periodIndex] = { className, subject, shared } | null
	 * "shared" marks periods co-taught with other staff (ELGA blocks), which can be
	 * covered by the remaining team rather than needing a substitute.
	 */
	function buildTeacherMap(db) {
		const map = {};
		db.teacherNames.forEach(teacher => {
			map[teacher] = {};
			db.days.forEach(day => { map[teacher][day] = new Array(PERIODS.length).fill(null); });
		});
		db.days.forEach(day => db.classNames.forEach(className =>
			db.timetable[day][className].forEach((cell, index) => {
				cell.teachers.forEach(teacher => {
					if (!map[teacher]) return;
					if (!map[teacher][day][index]) {
						map[teacher][day][index] = {
							className,
							subject: cell.subject,
							shared: cell.teachers.length > 1
						};
					}
				});
			})));
		return map;
	}

	/*
	 * Staff who can take a period but do not appear in the timetable.
	 *
	 * The teaching roster is derived from timetable cells, so anyone with no
	 * periods simply does not exist to the app - which is why these three
	 * could not be chosen at all. They are declared here instead.
	 *
	 * They are never chosen automatically. The planner will not volunteer the
	 * Director; a coordinator asks her, and records it.
	 */
	const RESERVE_STAFF = ['Director Mam', 'Raj Sir', 'Gyan Sir'];

	function load() {
		const db = parseTimetable(rawData);
		db.teacherMap = buildTeacherMap(db);
		// `teacherNames` stays the teaching staff and nothing else: the
		// Teachers view, the free-teacher lists, the shift editor, the absence
		// chips and the fairness ledger all read it, and none of them should
		// show someone who has no timetable.
		db.reserveStaff = RESERVE_STAFF.slice();
		// Everyone who could stand in front of a class, for the planner only.
		db.coverPool = db.teacherNames.concat(db.reserveStaff);
		return db;
	}

	return {
		rawData, PERIODS, BREAK, ZERO_PERIOD, REPORTING_MIN, CLOSE_MIN,
		SCHEDULES, SCHEDULE, PRACTICE_LAST_DAY, scheduleFor,
		SUBJECT_CATEGORIES, SHORT_SUBJECTS, RESERVE_STAFF,
		categoryOf, shortSubject, parseTimetable, buildTeacherMap, load
	};
});
