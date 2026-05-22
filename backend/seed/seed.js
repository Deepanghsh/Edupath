// seed/seed.js — Run with: node seed/seed.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose      = require('mongoose');
const bcrypt        = require('bcryptjs');
const Student       = require('../models/Student');
const Admin         = require('../models/Admin');
const CompanyDrive  = require('../models/CompanyDrive');
const Application   = require('../models/Application');
const Notification  = require('../models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edupath';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── Clear existing data ──────────────────────────────────────────────────
  await Promise.all([
    Student.deleteMany({}),
    Admin.deleteMany({}),
    CompanyDrive.deleteMany({}),
    Application.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑  Cleared existing data');

  // ── Seed Admin ───────────────────────────────────────────────────────────
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await Admin.create({
    name:  'TPO Admin',
    email: 'admin@college.edu',
    password: adminPass,
    role: 'admin',
  });
  console.log('👤 Admin created: admin@college.edu / admin123');

  // ── Seed Students ────────────────────────────────────────────────────────
  const pass = await bcrypt.hash('student123', 10);
  const studentsData = [
    { roll_no: '24B-CO-027', full_name: 'Raj Upaskar',      email: 'raj@gce.edu',      branch: 'CSE', year: '3rd Year', cgpa: 8.5, active_backlogs: 0, dsa_marks: 88, oops_marks: 90, skills: ['Node.js','React','MongoDB','DSA'],     verification_status: 'Approved' },
    { roll_no: '24B-CO-013', full_name: 'Priya Velkar',      email: 'priya@gce.edu',    branch: 'CSE', year: '3rd Year', cgpa: 8.1, active_backlogs: 0, dsa_marks: 85, oops_marks: 86, skills: ['Java','Spring','DSA'],                 verification_status: 'Pending'  },
    { roll_no: '24B-CO-003', full_name: 'Abdullah Mukadam', email: 'abdullah@gce.edu', branch: 'CSE', year: '3rd Year', cgpa: 7.8, active_backlogs: 0, dsa_marks: 79, oops_marks: 81, skills: ['PHP','MySQL','JavaScript','React'],    verification_status: 'Approved' },
    { roll_no: '24B-CO-019', full_name: 'Deepangsh Naik',    email: 'deepangsh@gce.edu',branch: 'CSE', year: '3rd Year', cgpa: 7.0, active_backlogs: 0, dsa_marks: 70, oops_marks: 72, skills: ['React','CSS','Figma','UI/UX'],         verification_status: 'Approved' },
    { roll_no: '24B-CO-007', full_name: 'Ayush Sharma',      email: 'ayush@gce.edu',    branch: 'ECE', year: '3rd Year', cgpa: 6.8, active_backlogs: 1, dsa_marks: 58, oops_marks: 62, skills: ['DSA','C++'],                           verification_status: 'Pending'  },
    { roll_no: '24B-CO-015', full_name: 'Akshay Pillai',     email: 'akshay@gce.edu',   branch: 'ME',  year: '3rd Year', cgpa: 6.4, active_backlogs: 0, dsa_marks: 50, oops_marks: 55, skills: ['AutoCAD'],                             verification_status: 'Approved' },
    { roll_no: '24B-CO-001', full_name: 'Kanak Waradkar',    email: 'kanak@gce.edu',    branch: 'CSE', year: '3rd Year', cgpa: 5.8, active_backlogs: 1, dsa_marks: 45, oops_marks: 48, skills: ['PHP','HTML'],                          verification_status: 'Rejected' },
    { roll_no: '24B-CO-025', full_name: 'Rohan Gaonkar',     email: 'rohan@gce.edu',    branch: 'CSE', year: '3rd Year', cgpa: 5.9, active_backlogs: 2, dsa_marks: 44, oops_marks: 47, skills: ['PHP'],                                 verification_status: 'Pending'  },
    { roll_no: '24B-CO-022', full_name: 'Sahil Sawant',      email: 'sahil@gce.edu',    branch: 'IT',  year: '3rd Year', cgpa: 5.5, active_backlogs: 1, dsa_marks: 40, oops_marks: 42, skills: ['HTML','CSS'],                          verification_status: 'Rejected' },
    // Demo student — easy login
    { roll_no: 'CSE2024001', full_name: 'Arjun Das',         email: 'arjun.das@college.edu', branch: 'CSE', year: '3rd Year', cgpa: 8.85, active_backlogs: 0, dsa_marks: 78, oops_marks: 82, skills: ['React','Python','SQL','Java'], verification_status: 'Approved' },
  ];

  const students = await Promise.all(
    studentsData.map(s => Student.create({ ...s, password: pass }))
  );
  console.log(`👥 ${students.length} students created (password: student123)`);

  // ── Seed Drives ──────────────────────────────────────────────────────────
  const drivesData = [
    { company_name: 'Tata Consultancy Services', job_role: 'System Analyst',       min_cgpa_required: 6.0, max_backlogs_allowed: 0, required_skills: ['Java','DSA'],          visit_date: new Date('2026-05-20'), avg_package: '7.5 LPA', status: 'Active' },
    { company_name: 'Infosys Limited',           job_role: 'Software Engineer',    min_cgpa_required: 6.5, max_backlogs_allowed: 0, required_skills: ['PHP','MySQL'],         visit_date: new Date('2026-06-02'), avg_package: '6.5 LPA', status: 'Active' },
    { company_name: 'Wipro Technologies',        job_role: 'UI/UX Designer',       min_cgpa_required: 6.0, max_backlogs_allowed: 1, required_skills: ['UI/UX','CSS'],        visit_date: new Date('2026-06-10'), avg_package: '5.5 LPA', status: 'Upcoming' },
    { company_name: 'Mphasis',                   job_role: 'PHP Developer',        min_cgpa_required: 5.5, max_backlogs_allowed: 2, required_skills: ['PHP','MySQL'],         visit_date: new Date('2026-06-18'), avg_package: '5.0 LPA', status: 'Upcoming' },
    { company_name: 'Cognizant Technology',      job_role: 'Full Stack Developer', min_cgpa_required: 7.0, max_backlogs_allowed: 0, required_skills: ['React','Node.js'],     visit_date: new Date('2026-06-25'), avg_package: '8.0 LPA', status: 'Upcoming' },
    { company_name: 'Google',                    job_role: 'SWE Intern',           min_cgpa_required: 9.0, max_backlogs_allowed: 0, required_skills: ['DSA','React'],         visit_date: new Date('2026-07-01'), avg_package: '25 LPA',  status: 'Upcoming' },
  ];

  const drives = await Promise.all(
    drivesData.map(d => CompanyDrive.create({ ...d, admin_id: admin._id }))
  );
  console.log(`🏢 ${drives.length} drives created`);

  // ── Seed Applications ────────────────────────────────────────────────────
  const appsData = [
    { student_id: students[0]._id, drive_id: drives[4]._id, status: 'Selected',    application_date: new Date('2026-05-07') },
    { student_id: students[2]._id, drive_id: drives[0]._id, status: 'Applied',     application_date: new Date('2026-05-08') },
    { student_id: students[3]._id, drive_id: drives[2]._id, status: 'Shortlisted', application_date: new Date('2026-05-10') },
    { student_id: students[4]._id, drive_id: drives[0]._id, status: 'Rejected',    application_date: new Date('2026-05-06'), feedback: 'DSA score below benchmark' },
    { student_id: students[9]._id, drive_id: drives[0]._id, status: 'Shortlisted', application_date: new Date('2026-03-01') }, // Arjun Das - TCS
    { student_id: students[9]._id, drive_id: drives[1]._id, status: 'Applied',     application_date: new Date('2026-03-05') }, // Arjun Das - Infosys
    { student_id: students[9]._id, drive_id: drives[2]._id, status: 'Rejected',    application_date: new Date('2026-02-20'), feedback: 'Did not meet DSA benchmark' },
  ];

  await Promise.all(appsData.map(a => Application.create(a)));
  console.log(`📋 ${appsData.length} applications created`);

  // ── Seed Notifications ───────────────────────────────────────────────────
  const arjun = students[9]._id;
  const notifsData = [
    { recipient_id: arjun, recipient_role: 'student', title: 'Shortlisted for TCS Drive!',      message: 'Congratulations! You have been shortlisted for TCS System Analyst drive. Round 2 on May 30th.',             type: 'drive',  is_read: false, createdAt: new Date('2026-03-12T10:30:00') },
    { recipient_id: arjun, recipient_role: 'student', title: 'New Drive: Cognizant Full Stack',  message: 'Cognizant is visiting campus on Jun 25th. Check eligibility and apply now!',                                type: 'drive',  is_read: false, createdAt: new Date('2026-03-11T14:00:00') },
    { recipient_id: arjun, recipient_role: 'student', title: 'Profile Verified ✅',              message: 'Your mark sheet has been verified and approved by the TPO office.',                                          type: 'system', is_read: true,  createdAt: new Date('2026-03-10T09:15:00') },
    { recipient_id: arjun, recipient_role: 'student', title: 'DSA Practice Reminder',            message: 'Your DSA marks are 78/100. Improve your score to maintain Tier 1 standing.',                                type: 'mentor', is_read: true,  createdAt: new Date('2026-03-09T16:00:00') },
    { recipient_id: arjun, recipient_role: 'student', title: 'Infosys Drive Update',             message: 'Registration deadline for Infosys drive extended to June 10th.',                                            type: 'drive',  is_read: true,  createdAt: new Date('2026-03-08T11:00:00') },
  ];
  await Notification.insertMany(notifsData);
  console.log(`🔔 ${notifsData.length} notifications created`);

  console.log('\n✅ Seed complete!');
  console.log('──────────────────────────────────────────');
  console.log('   Admin: admin@college.edu / admin123');
  console.log('   Student Demo: arjun.das@college.edu / student123');
  console.log('   Other students: <email> / student123');
  console.log('──────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
