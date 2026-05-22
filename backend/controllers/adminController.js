const Student      = require('../models/Student');
const Application  = require('../models/Application');
const CompanyDrive = require('../models/CompanyDrive');
const Notification = require('../models/Notification');

// ── GET /api/admin/stats/students ────────────────────────────────────────────
exports.getStudentStats = async (req, res) => {
  try {
    const total   = await Student.countDocuments();
    const pending = await Student.countDocuments({ verification_status: 'Pending' });
    const approved= await Student.countDocuments({ verification_status: 'Approved' });
    const rejected= await Student.countDocuments({ verification_status: 'Rejected' });
    res.json({ total, pending, approved, rejected });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── GET /api/admin/stats/drives ──────────────────────────────────────────────
exports.getDriveStats = async (req, res) => {
  try {
    const active = await CompanyDrive.countDocuments({ status: { $in: ['Active', 'Upcoming'] } });
    const total  = await CompanyDrive.countDocuments();
    const next   = await CompanyDrive.findOne({ status: { $in: ['Active', 'Upcoming'] } }).sort({ visit_date: 1 }).select('company_name visit_date');
    res.json({ active, total, next_drive: next });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── GET /api/admin/stats/placements ──────────────────────────────────────────
exports.getPlacementStats = async (req, res) => {
  try {
    const selected    = await Application.countDocuments({ status: 'Selected' });
    const shortlisted = await Application.countDocuments({ status: 'Shortlisted' });
    const total       = await Application.countDocuments();
    res.json({ selected, shortlisted, total });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── GET /api/admin/stats/pending ──────────────────────────────────────────────
exports.getPendingStats = async (req, res) => {
  try {
    const pending = await Student.countDocuments({ verification_status: 'Pending' });
    res.json({ pending });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── GET /api/admin/students ───────────────────────────────────────────────────
exports.getAllStudents = async (req, res) => {
  try {
    const { search, branch, tier, status, cgpa_min } = req.query;
    const query = {};
    if (branch)   query.branch = branch;
    if (tier)     query.tier   = tier;
    if (status)   query.verification_status = status;
    if (cgpa_min) query.cgpa = { $gte: parseFloat(cgpa_min) };
    if (search)   query.$or = [
      { full_name: new RegExp(search, 'i') },
      { roll_no:   new RegExp(search, 'i') },
      { email:     new RegExp(search, 'i') },
    ];
    const students = await Student.find(query).select('-password -__v').sort({ readiness_score: -1 });
    res.json(students);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── GET /api/admin/students/:id ───────────────────────────────────────────────
exports.getStudentById = async (req, res) => {
  try {
    const s = await Student.findById(req.params.id).select('-password -__v');
    if (!s) return res.status(404).json({ message: 'Student not found.' });
    res.json(s);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── PATCH /api/admin/verify/:id ───────────────────────────────────────────────
// FR-02: Maker-Checker verification
exports.verifyStudent = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved, Rejected, or Pending.' });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { verification_status: status },
      { new: true }
    ).select('-password -__v');

    if (!student) return res.status(404).json({ message: 'Student not found.' });

    // Notify the student
    await Notification.create({
      recipient_id:   student._id,
      recipient_role: 'student',
      title:          status === 'Approved' ? 'Profile Verified ✅' : status === 'Rejected' ? 'Verification Rejected ❌' : 'Verification Pending ⏳',
      message:        status === 'Approved'
        ? 'Your mark sheet has been verified and approved by the TPO office. You are now eligible to apply for placement drives.'
        : status === 'Rejected'
        ? `Your documents were rejected by the TPO office${feedback ? ': ' + feedback : '. Please re-upload the correct documents.'}`
        : 'Your verification status has been reset to Pending.',
      type: 'system',
    });

    res.json({ message: `Student ${status.toLowerCase()} successfully.`, student });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── GET /api/admin/flagged-students ───────────────────────────────────────────
exports.getFlaggedStudents = async (req, res) => {
  try {
    const flagged = await Student.find({ rejection_count: { $gte: 3 } })
      .select('-password -__v')
      .sort({ rejection_count: -1 });
    res.json(flagged);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── GET /api/admin/analytics/placements ──────────────────────────────────────
exports.getPlacementAnalytics = async (req, res) => {
  try {
    const students      = await Student.find().select('cgpa readiness_score tier verification_status branch');
    const applications  = await Application.countDocuments();
    const selected      = await Application.countDocuments({ status: 'Selected' });
    const shortlisted   = await Application.countDocuments({ status: 'Shortlisted' });
    const rejected      = await Application.countDocuments({ status: 'Rejected' });
    const avgCgpa       = students.length ? (students.reduce((a, s) => a + s.cgpa, 0) / students.length).toFixed(2) : 0;
    const avgScore      = students.length ? Math.round(students.reduce((a, s) => a + s.readiness_score, 0) / students.length) : 0;
    const tier1 = students.filter(s => s.tier === 'Tier1').length;
    const tier2 = students.filter(s => s.tier === 'Tier2').length;
    const tier3 = students.filter(s => s.tier === 'Tier3').length;

    res.json({ total_students: students.length, applications, selected, shortlisted, rejected, avgCgpa, avgScore, tier1, tier2, tier3 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── GET /api/admin/dashboard ──────────────────────────────────────────────────
exports.getDashboardData = async (req, res) => {
  try {
    const [totalStudents, pendingVerif, activeDrives, atRisk, recentApps, upcomingDrives] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ verification_status: 'Pending' }),
      CompanyDrive.countDocuments({ status: { $in: ['Active', 'Upcoming'] } }),
      Student.countDocuments({ readiness_score: { $lt: 60 } }),
      Application.find().populate('student_id','full_name').populate('drive_id','company_name').sort({ createdAt: -1 }).limit(5),
      CompanyDrive.find({ status: { $in: ['Active', 'Upcoming'] } }).sort({ visit_date: 1 }).limit(5),
    ]);

    const verificationBreakdown = {
      approved: await Student.countDocuments({ verification_status: 'Approved' }),
      pending:  pendingVerif,
      rejected: await Student.countDocuments({ verification_status: 'Rejected' }),
    };

    res.json({
      kpis: { totalStudents, pendingVerif, activeDrives, atRisk },
      recentActivity: recentApps,
      upcomingDrives,
      verificationBreakdown,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
