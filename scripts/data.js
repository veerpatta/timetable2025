// VPPS timetable source data - Timetable 2026-27 (v11).
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
Class 1,Maths (Bindu),CCS (Maya),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Anjana),EVS (Ravina),EVS (Ravina)
Class 2,Maths (Ravina),EVS (Bindu),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Bindu),Hindi (Bindu),Sports (Anjana)
Class 3,EVS (Rashmita),Maths (Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Sports (SP),Hindi (Kusum),Hindi (Kusum)
Class 4,Hindi (Kusum),Hindi (Kusum),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Maths (Anita),EVS (Rashmita),EVS (Rashmita)
Class 5,Maths (Nidhika),Maths (Nidhika),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Kusum),CCS (Maya),EVS (Anita)
Class 6,Biology (Hemlata),Hindi (Jainendra),Robotics (Maya),CCS (Maya),SST (Roshan),SST (Roshan),Maths (Nidhika),Maths (Nidhika)
Class 7,Maths (Anita),Maths (Anita),Hindi (Jainendra),Physics (Prateek),Sanskrit (Antima),Chemistry (Hemlata),SST (Roshan),SST (Roshan)
Class 8,Sanskrit (Antima),Biology (Hemlata),SST (Roshan),English (Mumal),English (Mumal),Physics (Prateek),Maths (Prakash),Hindi (Jainendra)
Class 9,Hindi (Jainendra),SST (Roshan),Maths (Nathulal),Maths (Nathulal),Science (Toshit),Science (Toshit),English (Nishant),English (Nishant)
Class 10,SST (Roshan),Physics (Prateek),Sanskrit (Antima),Sports (SP),Maths (Nathulal),Hindi (Antima),Science (Toshit),CCS (Maya)
Class 11 Science,Physics (Prateek),Sports (SP),Chemistry (Toshit),Chemistry (Toshit),Hindi (Jainendra),English (Mumal),Biology / Maths (Hemlata / Prateek),Biology / Maths (Hemlata / Prateek)
Class 11 Commerce,Self Study (Maya),Economics (Prakash),Economics (Prakash),Business Studies (Nidhika),Hindi (Jainendra),English (Mumal),Accountancy (Nathulal),Accountancy (Nathulal)
Class 11 Arts,Political Science (Mumal),Economics / Eng Lit (Prakash / Nishant),Economics / Eng Lit (Prakash / Nishant),Hindi (Antima),Hindi (Jainendra),English (Mumal),NoteBook Checking (Antima),Geography (Prakash)
Class 12 Science,Chemistry (Toshit),Chemistry (Toshit),Physics (Prateek),Biology (Hemlata),Biology (Hemlata),CCS (Maya),Hindi (Jainendra),English (Mumal)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),Sports (SP),Economics (Prakash),Economics (Prakash),Business Studies (Nidhika),Hindi (Jainendra),English (Mumal)
Class 12 Arts,Geography (Prakash),Political Science (Mumal),Political Science (Mumal),Economics / Eng Lit (Prakash / Nishant),Economics / Eng Lit (Prakash / Nishant),Hindi (Jainendra),Hindi (Jainendra),English (Mumal)

Tuesday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),Maths (Bindu),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Anjana),Hindi (Anjana),EVS (Ravina)
Class 2,Maths (Ravina),Maths (Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Bindu),EVS (Bindu),EVS (Bindu)
Class 3,EVS (Rashmita),Hindi (Kusum),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Maths (Ravina),Maths (Ravina),NoteBook Checking (Rashmita)
Class 4,Hindi (Kusum),Sports (SP),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),EVS (Rashmita),Maths (Anita),Maths (Anita)
Class 5,Maths (Nidhika),EVS (Anita),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Sports (SP),Hindi (Kusum),Hindi (Kusum)
Class 6,Chemistry (Hemlata),Chemistry (Hemlata),Physics (Hemlata),Sanskrit (Jainendra),Sports (SP),Maths (Nidhika),Maths (Nidhika),SST (Roshan)
Class 7,Maths (Anita),Sanskrit (Antima),English (Nishant),English (Nishant),SST (Roshan),Robotics (Maya),CCS (Maya),Hindi (Jainendra)
Class 8,Sanskrit (Antima),Hindi (Jainendra),Hindi (Jainendra),Maths (Prakash),English (Mumal),SST (Roshan),Chemistry (Toshit),CCS (Maya)
Class 9,Hindi (Jainendra),CCS (Maya),SST (Roshan),SST (Roshan),Maths (Nathulal),Sanskrit (Antima),Sanskrit (Antima),Science (Toshit)
Class 10,SST (Roshan),English (Nishant),Sanskrit (Antima),CCS (Maya),Science (Toshit),Maths (Nathulal),Maths (Nathulal),Hindi (Antima)
Class 11 Science,Physics (Prateek),Physics (Prateek),Chemistry (Toshit),Chemistry (Toshit),Hindi (Jainendra),English (Mumal),Biology / Maths (Hemlata / Prateek),Biology / Maths (Hemlata / Prateek)
Class 11 Commerce,CCS (Maya),Business Studies (Nidhika),Business Studies (Nidhika),Accountancy (Nathulal),Hindi (Jainendra),English (Mumal),Economics (Prakash),Economics (Prakash)
Class 11 Arts,Political Science (Mumal),Political Science (Mumal),Geography (Prakash),Hindi (Antima),Hindi (Jainendra),English (Mumal),Economics / Eng Lit (Prakash / Nishant),Economics / Eng Lit (Prakash / Nishant)
Class 12 Science,Chemistry (Toshit),Chemistry (Toshit),Physics (Prateek),Sports (SP),Biology / Maths (Hemlata / Prateek),Biology / Maths (Hemlata / Prateek),Hindi (Jainendra),English (Mumal)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),CCS (Maya),Business Studies (Nidhika),Economics (Prakash),Economics (Prakash),Hindi (Jainendra),English (Mumal)
Class 12 Arts,Geography (Prakash),General Studies (Roshan),Political Science (Mumal),Political Science (Mumal),Economics / Eng Lit (Prakash / Nishant),Economics / Eng Lit (Prakash / Nishant),Hindi (Jainendra),English (Mumal)

Wednesday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),EVS (Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Anjana),Hindi (Anjana),Sports (Anjana)
Class 2,Maths (Ravina),CCS (Maya),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),EVS (Bindu),EVS (Bindu),Hindi (Bindu)
Class 3,EVS (Rashmita),EVS (Rashmita),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Kusum),Maths (Ravina),Maths (Ravina)
Class 4,Hindi (Kusum),Hindi (Kusum),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),EVS (Rashmita),Maths (Anita),Maths (Anita)
Class 5,Maths (Nidhika),EVS (Anita),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),CCS (Maya),Robotics (Maya),Hindi (Kusum)
Class 6,Biology (Hemlata),English (Nishant),English (Nishant),SST (Roshan),SST (Roshan),Maths (Nidhika),Maths (Nidhika),Hindi (Jainendra)
Class 7,Maths (Anita),Hindi (Jainendra),Hindi (Jainendra),Sports (SP),English (Nishant),Sanskrit (Antima),Sanskrit (Antima),CCS (Maya)
Class 8,Sanskrit (Antima),Biology (Hemlata),Biology (Hemlata),English (Mumal),English (Mumal),Maths (Prakash),SST (Roshan),SST (Roshan)
Class 9,Hindi (Jainendra),Sanskrit (Antima),SST (Roshan),English (Nishant),Maths (Nathulal),Science (Toshit),Science (Toshit),NoteBook Checking (Antima)
Class 10,SST (Roshan),SST (Roshan),Sanskrit (Antima),Hindi (Antima),Science (Toshit),English (Nishant),Maths (Nathulal),Maths (Nathulal)
Class 11 Science,Physics (Prateek),Physics (Prateek),Chemistry (Toshit),Chemistry (Toshit),Hindi (Jainendra),English (Mumal),Biology / Maths (Hemlata / Prateek),Biology / Maths (Hemlata / Prateek)
Class 11 Commerce,Self Study (Maya),Business Studies (Nidhika),Accountancy (Nathulal),Accountancy (Nathulal),Hindi (Jainendra),English (Mumal),Economics (Prakash),Economics (Prakash)
Class 11 Arts,Political Science (Mumal),Political Science (Mumal),Geography (Prakash),Geography (Prakash),Hindi (Jainendra),English (Mumal),Economics / Eng Lit (Prakash / Nishant),Economics / Eng Lit (Prakash / Nishant)
Class 12 Science,Chemistry (Toshit),Chemistry (Toshit),Physics (Prateek),Physics (Prateek),Biology / Maths (Hemlata / Prateek),Biology / Maths (Hemlata / Prateek),Hindi (Jainendra),English (Mumal)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),CCS (Maya),Business Studies (Nidhika),Business Studies (Nidhika),Sports (SP),Hindi (Jainendra),English (Mumal)
Class 12 Arts,Geography (Prakash),Geography (Prakash),Political Science (Mumal),CCS (Maya),Sports (SP),Hindi (Jainendra),Hindi (Jainendra),English (Mumal)

Thursday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),Maths (Bindu),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Anjana),EVS (Ravina),EVS (Ravina)
Class 2,Maths (Ravina),Maths (Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),EVS (Bindu),Hindi (Bindu),Hindi (Bindu)
Class 3,EVS (Rashmita),EVS (Rashmita),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Maths (Ravina),Hindi (Kusum),Hindi (Kusum)
Class 4,Hindi (Kusum),Maths (Anita),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Sports (SP),EVS (Rashmita),EVS (Rashmita)
Class 5,Maths (Nidhika),Maths (Nidhika),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),ELGA (Bindu / Anita / Rashmita / Kusum / Ravina),Hindi (Kusum),EVS (Anita),EVS (Anita)
Class 6,Physics (Hemlata),English (Nishant),NoteBook Checking (Antima),Biology (Hemlata),Maths (Nidhika),CCS (Maya),SST (Roshan),Hindi (Jainendra)
Class 7,Maths (Anita),Hindi (Jainendra),Hindi (Jainendra),SST (Roshan),Biology (Hemlata),Sanskrit (Antima),English (Nishant),NoteBook Checking (Antima)
Class 8,NoteBook Checking (Antima),Robotics (Maya),CCS (Maya),Hindi (Jainendra),English (Mumal),SST (Roshan),Maths (Prakash),Maths (Prakash)
Class 9,Hindi (Jainendra),Sanskrit (Antima),SST (Roshan),English (Nishant),Sports (SP),Science (Toshit),Maths (Nathulal),CCS (Maya)
Class 10,SST (Roshan),SST (Roshan),English (Nishant),Hindi (Antima),Sanskrit (Antima),Maths (Nathulal),Science (Toshit),Science (Toshit)
Class 11 Science,Physics (Prateek),Physics (Prateek),Chemistry (Toshit),Chemistry (Toshit),Hindi (Jainendra),English (Mumal),Biology / Maths (Hemlata / Prateek),Biology / Maths (Hemlata / Prateek)
Class 11 Commerce,CCS (Maya),Sports (SP),Accountancy (Nathulal),Accountancy (Nathulal),Hindi (Jainendra),English (Mumal),Business Studies (Nidhika),Business Studies (Nidhika)
Class 11 Arts,Political Science (Mumal),Political Science (Mumal),Geography (Prakash),Sports (SP),Hindi (Jainendra),English (Mumal),CCS (Maya),General Studies (Roshan)
Class 12 Science,Chemistry (Toshit),Chemistry (Toshit),Biology / Maths (Hemlata / Prateek),CCS (Maya),Physics (Prateek),Physics (Prateek),Hindi (Jainendra),English (Mumal)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),Business Studies (Nidhika),Business Studies (Nidhika),Economics (Prakash),Economics (Prakash),Hindi (Jainendra),English (Mumal)
Class 12 Arts,Geography (Prakash),Geography (Prakash),Political Science (Mumal),Political Science (Mumal),Economics / Eng Lit (Prakash / Nishant),Economics / Eng Lit (Prakash / Nishant),Hindi (Jainendra),English (Mumal)

Friday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),Maths (Bindu),EVS (Ravina),EVS (Ravina),NoteBook Checking (Rashmita),Hindi (Anjana),Hindi (Anjana),Sports (Anjana)
Class 2,Maths (Ravina),Maths (Ravina),EVS (Bindu),EVS (Bindu),Robotics (Maya),CCS (Maya),Hindi (Bindu),Hindi (Bindu)
Class 3,EVS (Rashmita),EVS (Rashmita),Hindi (Kusum),Hindi (Kusum),Maths (Ravina),Maths (Ravina),Robotics (Maya),CCS (Maya)
Class 4,Hindi (Kusum),Hindi (Kusum),CCS (Maya),NoteBook Checking (Rashmita),Maths (Anita),Maths (Anita),EVS (Rashmita),EVS (Rashmita)
Class 5,Maths (Nidhika),Maths (Nidhika),EVS (Anita),EVS (Anita),Sports (SP),Hindi (Kusum),Hindi (Kusum),English (Ravina)
Class 6,Physics (Hemlata),Sanskrit (Jainendra),Hindi (Jainendra),Hindi (Jainendra),SST (Roshan),Maths (Nidhika),English (Nishant),English (Nishant)
Class 7,Maths (Anita),Maths (Anita),SST (Roshan),SST (Roshan),Chemistry (Hemlata),Physics (Prateek),Physics (Prateek),Biology (Hemlata)
Class 8,Sanskrit (Antima),Maths (Prakash),Maths (Prakash),Physics (Prateek),Chemistry (Toshit),SST (Roshan),English (Mumal),Hindi (Jainendra)
Class 9,Hindi (Jainendra),Maths (Prateek),Maths (Prateek),English (Nishant),Sanskrit (Antima),Science (Toshit),SST (Roshan),SST (Roshan)
Class 10,SST (Roshan),English (Nishant),English (Nishant),Science (Toshit),Maths (Nathulal),Maths (Nathulal),Hindi (Antima),Sanskrit (Antima)
Class 11 Science,Physics (Prateek),CCS (Maya),Biology (Hemlata),Biology (Hemlata),Hindi (Jainendra),English (Mumal),Chemistry (Toshit),Chemistry (Toshit)
Class 11 Commerce,Self Study (Maya),NoteBook Checking (Antima),Accountancy (Nathulal),Accountancy (Nathulal),Hindi (Jainendra),English (Mumal),Business Studies (Nidhika),Business Studies (Nidhika)
Class 11 Arts,Political Science (Mumal),Political Science (Mumal),Sports (SP),Hindi (Antima),Hindi (Jainendra),English (Mumal),Geography (Prakash),Geography (Prakash)
Class 12 Science,Chemistry (Toshit),Chemistry (Toshit),NoteBook Checking (Antima),Sports (SP),Physics (Prateek),Biology (Hemlata),Hindi (Jainendra),English (Mumal)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),Business Studies (Nidhika),Business Studies (Nidhika),Economics (Prakash),Economics (Prakash),Hindi (Jainendra),English (Mumal)
Class 12 Arts,Geography (Prakash),Sports (SP),Political Science (Mumal),Political Science (Mumal),Economics / Eng Lit (Prakash / Nishant),Economics / Eng Lit (Prakash / Nishant),Hindi (Jainendra),English (Mumal)

Saturday
Class,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7,Period 8
Class 1,Maths (Bindu),Maths (Bindu),EVS (Ravina),EVS (Ravina),Robotics (Maya),CCS (Maya),Hindi (Anjana),Hindi (Anjana)
Class 2,Maths (Ravina),Maths (Ravina),NoteBook Checking (Rashmita),Hindi (Bindu),Hindi (Bindu),Sports (Anjana),EVS (Bindu),EVS (Bindu)
Class 3,EVS (Rashmita),EVS (Rashmita),Hindi (Kusum),Hindi (Kusum),Maths (Ravina),Maths (Ravina),Sports (SP),CCS (Maya)
Class 4,Hindi (Kusum),Hindi (Kusum),CCS (Maya),Robotics (Maya),EVS (Rashmita),EVS (Rashmita),Maths (Anita),Maths (Anita)
Class 5,Maths (Nidhika),Maths (Nidhika),EVS (Anita),EVS (Anita),Hindi (Kusum),Hindi (Kusum),NoteBook Checking (Rashmita),English (Ravina)
Class 6,Chemistry (Hemlata),English (Nishant),Sanskrit (Jainendra),Sanskrit (Jainendra),SST (Roshan),Maths (Nidhika),Maths (Nidhika),Hindi (Jainendra)
Class 7,Maths (Anita),Maths (Anita),Chemistry (Hemlata),Biology (Hemlata),English (Nishant),English (Nishant),SST (Roshan),SST (Roshan)
Class 8,Sanskrit (Antima),Physics (Prateek),SST (Roshan),SST (Roshan),Sports (SP),Maths (Prakash),English (Mumal),Chemistry (Toshit)
Class 9,Hindi (Jainendra),SST (Roshan),Sanskrit (Antima),Science (Toshit),Science (Toshit),Maths (Prateek),Maths (Prateek),English (Nishant)
Class 10,SST (Roshan),Sanskrit (Antima),Maths (Nathulal),Maths (Nathulal),Physics (Prateek),Science (Toshit),English (Nishant),Hindi (Antima)
Class 11 Science,Physics (Prateek),CCS (Maya),Chemistry (Toshit),Sports (SP),Hindi (Jainendra),English (Mumal),NoteBook Checking (Antima),Biology / Maths (Hemlata / Prateek)
Class 11 Commerce,Self Study (Maya),Sports (SP),Economics (Prakash),Economics (Prakash),Hindi (Jainendra),English (Mumal),Accountancy (Nathulal),Accountancy (Nathulal)
Class 11 Arts,Political Science (Mumal),Political Science (Mumal),Economics / Eng Lit (Prakash / Nishant),Economics / Eng Lit (Prakash / Nishant),Hindi (Jainendra),English (Mumal),Geography (Prakash),Geography (Prakash)
Class 12 Science,Chemistry (Toshit),Chemistry (Toshit),Physics (Prateek),Physics (Prateek),Biology (Hemlata),Biology (Hemlata),Hindi (Jainendra),English (Mumal)
Class 12 Commerce,Accountancy (Nathulal),Accountancy (Nathulal),Sports (SP),Business Studies (Nidhika),Business Studies (Nidhika),NoteBook Checking (Antima),Hindi (Jainendra),English (Mumal)
Class 12 Arts,Geography (Prakash),Geography (Prakash),Political Science (Mumal),Political Science (Mumal),NoteBook Checking (Antima),Hindi (Jainendra),Hindi (Jainendra),English (Mumal)
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
		languages: ["english literature", "eng lit", "hindi boards", "english", "hindi", "sanskrit", "elga", "language", "grammar", "literature"],
		sciences: ["environmental", "practical", "robotics", "science", "physics", "chemistry", "biology", "evs", "lab"],
		math: ["mathematics", "statistics", "calculus", "geometry", "algebra", "maths", "math"],
		social: ["political science", "general studies", "accountancy", "geography", "economics", "business", "commerce", "history", "civics", "social", "sst"],
		sports: ["physical", "exercise", "activity", "sports", "games", "yoga", "pt", "pe"]
	};

	// Long subject names shortened for the dense week/day grids.
	// The v4 spellings stay so a `rawData` block restored from git history still
	// renders; v11 already writes "English" and "Eng Lit" in full.
	const SHORT_SUBJECTS = {
		"English compulsory": "English",
		"English Literature": "Eng Lit",
		"NoteBook Checking": "Notebook",
		"Business Studies": "Bus Study",
		"Political Science": "Pol Sci",
		"General Studies": "Gen Studies",
		"Economics / Eng Lit": "Eco / Eng Lit"
	};

	function categoryOf(subject) {
		// "Economics / Eng Lit" is two subjects in one cell and can only take
		// one colour, so the one that reads first wins.
		const value = String(subject || "").split(" / ")[0].toLowerCase();
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
	 *   { subject, teachers: string[], free?: true, parallel?: true, subjects?: string[] }
	 *
	 * Two different things wear the same `A / B` costume, and the difference
	 * decides whether an absence needs a substitute:
	 *
	 *   ELGA (Bindu / Anita / Rashmita / Kusum / Ravina)
	 *       one lesson, five teachers - the rest absorb it if one is away.
	 *   Biology / Maths (Hemlata / Prateek)
	 *       two lessons side by side, one cohort each - if Hemlata is away her
	 *       Biology group needs cover, because Prateek is teaching Maths.
	 *
	 * A cell is the second kind when the subject splits into exactly as many
	 * parts as it has teachers, and `parallel` records that so the rest of the
	 * app never has to guess.
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
					const subject = match[1].trim();
					const teachers = match[2].split("/").map(name => name.trim()).filter(Boolean);
					const subjects = subject.split(" / ").map(name => name.trim()).filter(Boolean);
					if (subjects.length > 1 && subjects.length === teachers.length) {
						return { subject, subjects, teachers, parallel: true };
					}
					return { subject, teachers };
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
	 * teacherMap[teacher][day][periodIndex] =
	 *   { className, subject, shared, alsoClassNames: string[] } | null
	 *
	 * "shared" marks periods co-taught with other staff (ELGA blocks), which can be
	 * covered by the remaining team rather than needing a substitute. A parallel
	 * elective is not shared in that sense - each teacher there has their own
	 * cohort and their own subject, so `subject` is theirs, not the whole cell's.
	 *
	 * "alsoClassNames" holds the other sections of a combined period. The senior
	 * school sits 11 Science, Commerce and Arts together for Hindi and English,
	 * and 11/12 Commerce with Arts for Economics. That is one room and one cover
	 * teacher, so it stays one slot - but every one of those class timetables has
	 * to name the cover, which is what this list is for.
	 */
	function buildTeacherMap(db) {
		const map = {};
		db.teacherNames.forEach(teacher => {
			map[teacher] = {};
			db.days.forEach(day => { map[teacher][day] = new Array(PERIODS.length).fill(null); });
		});
		db.days.forEach(day => db.classNames.forEach(className =>
			db.timetable[day][className].forEach((cell, index) => {
				cell.teachers.forEach((teacher, teacherIndex) => {
					if (!map[teacher]) return;
					const subject = cell.parallel ? cell.subjects[teacherIndex] : cell.subject;
					const shared = !cell.parallel && cell.teachers.length > 1;
					const slot = map[teacher][day][index];
					if (!slot) {
						map[teacher][day][index] = { className, subject, shared, alsoClassNames: [] };
						return;
					}
					// Same teacher, same subject, same period, another section.
					// Shared blocks are excluded: the five ELGA teachers are
					// running one primary-wide activity, not teaching Class 1
					// and four more at once.
					if (!shared && !slot.shared && slot.subject === subject &&
						slot.className !== className &&
						slot.alsoClassNames.indexOf(className) === -1) {
						slot.alsoClassNames.push(className);
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

	/*
	 * Duty-holders: coordinators and exam in-charges.
	 *
	 * The v11 free-teacher chart stars these four and says in its header to
	 * "use them for cover only if no one else is free" - their free periods
	 * are the coordinator and exam work, not spare capacity. They are full
	 * teaching staff with real timetables, so unlike RESERVE_STAFF they are
	 * still suggested; they simply rank below everyone else and never get
	 * assigned without a coordinator confirming.
	 *
	 * The chart writes Nathulal as "NLK" in its header and "Nathulal*" in the
	 * body; this is the timetable's spelling.
	 */
	const DUTY_STAFF = ['Hemlata', 'Rashmita', 'Nidhika', 'Nathulal'];

	function load() {
		const db = parseTimetable(rawData);
		db.teacherMap = buildTeacherMap(db);
		// `teacherNames` stays the teaching staff and nothing else: the
		// Teachers view, the free-teacher lists, the shift editor, the absence
		// chips and the fairness ledger all read it, and none of them should
		// show someone who has no timetable.
		db.reserveStaff = RESERVE_STAFF.slice();
		// Duty-holders are ordinary teaching staff everywhere except the
		// planner's ranking, so they stay in `teacherNames` and are named
		// separately rather than being split out of the roster.
		db.dutyStaff = DUTY_STAFF.filter(name => db.teacherNames.indexOf(name) !== -1);
		// Everyone who could stand in front of a class, for the planner only.
		db.coverPool = db.teacherNames.concat(db.reserveStaff);
		return db;
	}

	return {
		rawData, PERIODS, BREAK, ZERO_PERIOD, REPORTING_MIN, CLOSE_MIN,
		SCHEDULES, SCHEDULE, PRACTICE_LAST_DAY, scheduleFor,
		SUBJECT_CATEGORIES, SHORT_SUBJECTS, RESERVE_STAFF, DUTY_STAFF,
		categoryOf, shortSubject, parseTimetable, buildTeacherMap, load
	};
});
