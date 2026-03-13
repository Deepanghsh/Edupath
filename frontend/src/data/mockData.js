export const MOCK_STUDENT = {
  student_id: "STU2024001",
  roll_no: "CSE2024001",
  full_name: "Arjun Das",
  email: "arjun.das@college.edu",
  branch: "CSE",
  year: "3rd Year",
  cgpa: 8.85,
  active_backlogs: 0,
  dsa_marks: 78,
  oops_marks: 82,
  skills: ["React", "Python", "SQL", "Java"],
  readiness_score: 87,
  tier: "Tier 1",
  verification_status: "Approved",
  mark_sheet_url: null,
  avatar: "AD",
};

export const MOCK_DRIVES = [
  { drive_id: 1, company_name: "TCS", job_role: "Software Developer", min_cgpa_required: 7.0, max_backlogs_allowed: 2, required_skills: ["Java", "SQL"], visit_date: "2026-04-15", avg_package: "7.5 LPA", applications: 320 },
  { drive_id: 2, company_name: "Infosys", job_role: "Systems Engineer", min_cgpa_required: 6.5, max_backlogs_allowed: 2, required_skills: ["Python", "SQL"], visit_date: "2026-04-22", avg_package: "6.5 LPA", applications: 280 },
  { drive_id: 3, company_name: "Google", job_role: "SWE Intern", min_cgpa_required: 9.0, max_backlogs_allowed: 0, required_skills: ["React", "Python", "DSA"], visit_date: "2026-05-01", avg_package: "25 LPA", applications: 45 },
  { drive_id: 4, company_name: "Microsoft", job_role: "Software Engineer", min_cgpa_required: 8.5, max_backlogs_allowed: 0, required_skills: ["Java", "React", "DSA"], visit_date: "2026-05-10", avg_package: "22 LPA", applications: 62 },
  { drive_id: 5, company_name: "Wipro", job_role: "Project Engineer", min_cgpa_required: 6.0, max_backlogs_allowed: 3, required_skills: ["SQL", "Python"], visit_date: "2026-04-28", avg_package: "5.5 LPA", applications: 410 },
  { drive_id: 6, company_name: "Accenture", job_role: "Associate SE", min_cgpa_required: 6.5, max_backlogs_allowed: 2, required_skills: ["Java", "SQL"], visit_date: "2026-05-05", avg_package: "6.0 LPA", applications: 380 },
];

export const MOCK_APPLICATIONS = [
  { app_id: 1, company_name: "TCS", job_role: "Software Developer", applied_date: "2026-03-01", status: "Shortlisted", drive_id: 1 },
  { app_id: 2, company_name: "Infosys", job_role: "Systems Engineer", applied_date: "2026-03-05", status: "Applied", drive_id: 2 },
  { app_id: 3, company_name: "Wipro", job_role: "Project Engineer", applied_date: "2026-02-20", status: "Rejected", drive_id: 5, feedback: "Did not meet DSA benchmark" },
];

export const MOCK_NOTIFICATIONS = [
  { id: 1, title: "Shortlisted for TCS Drive!", message: "Congratulations! You have been shortlisted for TCS Software Developer drive. Round 2 on April 20th.", timestamp: "2026-03-12 10:30", read: false, type: "drive" },
  { id: 2, title: "New Drive: Microsoft SWE", message: "Microsoft is visiting campus on May 10th. Check eligibility and apply now!", timestamp: "2026-03-11 14:00", read: false, type: "drive" },
  { id: 3, title: "Profile Verified", message: "Your mark sheet has been verified and approved by the TPO office.", timestamp: "2026-03-10 09:15", read: true, type: "system" },
  { id: 4, title: "DSA Practice Reminder", message: "Your DSA marks are 78/100. Practice more to improve your Tier 1 standing.", timestamp: "2026-03-09 16:00", read: true, type: "mentor" },
  { id: 5, title: "Infosys Drive Update", message: "Registration deadline for Infosys drive extended to March 25th.", timestamp: "2026-03-08 11:00", read: true, type: "drive" },
];
