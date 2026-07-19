const CompanyDrive = require('../models/CompanyDrive');
const Student      = require('../models/Student');
const Application  = require('../models/Application');

// Format drive for frontend (match existing MOCK_DRIVES shape)
const formatDrive = (d) => ({
  _id:                  d._id,
  drive_id:             d._id,
  company_name:         d.company_name,
  job_role:             d.job_role,
  min_cgpa_required:    d.min_cgpa_required,
  max_backlogs_allowed: d.max_backlogs_allowed,
  required_skills:      d.required_skills,
  visit_date:           d.visit_date ? d.visit_date.toISOString().split('T')[0] : '',
  avg_package:          d.avg_package,
  location:             d.location,
  status:               d.status,
  applications:         d.applications_count,
  createdAt:            d.createdAt,
});

// ── GET /api/student/drives ───────────────────────────────────────────────────
exports.getAllDrives = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};
    if (status)  query.status = status;
    else         query.status = { $in: ['Active', 'Upcoming'] };
    if (search)  query.$or = [
      { company_name: new RegExp(search, 'i') },
      { job_role:     new RegExp(search, 'i') },
    ];
    const drives = await CompanyDrive.find(query).sort({ visit_date: 1 });
    res.json(drives.map(formatDrive));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/student/eligible-drives ─────────────────────────────────────────
exports.getEligibleDrives = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const drives = await CompanyDrive.find({ status: { $in: ['Active', 'Upcoming'] } }).sort({ visit_date: 1 });
    const eligible = drives.filter(d =>
      student.cgpa >= d.min_cgpa_required &&
      student.active_backlogs <= d.max_backlogs_allowed
    );
    res.json(eligible.map(formatDrive));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/student/apply ───────────────────────────────────────────────────
exports.applyToDrive = async (req, res) => {
  try {
    const { drive_id } = req.body;
    if (!drive_id) return res.status(400).json({ message: 'drive_id is required.' });

    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const drive = await CompanyDrive.findById(drive_id);
    if (!drive) return res.status(404).json({ message: 'Drive not found.' });

    // Eligibility check (FR-03)
    if (student.cgpa < drive.min_cgpa_required) {
      return res.status(403).json({ message: `Your CGPA (${student.cgpa}) is below the required ${drive.min_cgpa_required}.` });
    }
    if (student.active_backlogs > drive.max_backlogs_allowed) {
      return res.status(403).json({ message: `You have ${student.active_backlogs} backlogs; drive allows max ${drive.max_backlogs_allowed}.` });
    }

    // Duplicate check
    const existing = await Application.findOne({ student_id: student._id, drive_id });
    if (existing) return res.status(409).json({ message: 'You have already applied to this drive.' });

    const application = await Application.create({ student_id: student._id, drive_id });

    // Update drive application count
    await CompanyDrive.findByIdAndUpdate(drive_id, { $inc: { applications_count: 1 } });

    res.status(201).json({ message: `Successfully applied to ${drive.company_name}!`, application_id: application._id });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You have already applied to this drive.' });
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/student/applications ────────────────────────────────────────────
exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ student_id: req.user.id })
      .populate('drive_id', 'company_name job_role visit_date avg_package')
      .sort({ createdAt: -1 });

    const formatted = apps.map(a => ({
      _id:          a._id,
      app_id:       a._id,
      company_name: a.drive_id?.company_name || 'N/A',
      job_role:     a.drive_id?.job_role     || 'N/A',
      drive_id:     a.drive_id?._id,
      applied_date: a.application_date ? a.application_date.toISOString().split('T')[0] : '',
      status:       a.status,
      feedback:     a.feedback,
      rejection_round: a.rejection_round,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: GET /api/admin/drives ──────────────────────────────────────────────
exports.adminGetAllDrives = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { company_name: new RegExp(search, 'i') },
      { job_role:     new RegExp(search, 'i') },
    ];
    const drives = await CompanyDrive.find(query).sort({ visit_date: 1 });
    res.json(drives.map(formatDrive));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: POST /api/admin/drives ─────────────────────────────────────────────
exports.adminCreateDrive = async (req, res) => {
  try {
    const { company_name, job_role, visit_date, min_cgpa_required, max_backlogs_allowed, required_skills, avg_package, location } = req.body;
    if (!company_name || !job_role || !visit_date || min_cgpa_required === undefined) {
      return res.status(400).json({ message: 'Company, role, visit date and min CGPA are required.' });
    }
    const drive = await CompanyDrive.create({
      admin_id: req.user.id,
      company_name, job_role,
      visit_date: new Date(visit_date),
      min_cgpa_required: parseFloat(min_cgpa_required),
      max_backlogs_allowed: parseInt(max_backlogs_allowed) || 0,
      required_skills: Array.isArray(required_skills) ? required_skills : (required_skills || '').split(',').map(s => s.trim()).filter(Boolean),
      avg_package: avg_package || '',
      location: location || '',
    });

    // ── Auto-notify all eligible students ──────────────────────────────────
    try {
      const Notification = require('../models/Notification');
      const eligibleStudents = await Student.find({
        cgpa:            { $gte: drive.min_cgpa_required },
        active_backlogs: { $lte: drive.max_backlogs_allowed },
      }, '_id').lean();

      if (eligibleStudents.length > 0) {
        const notifications = eligibleStudents.map(s => ({
          recipient_id:   s._id,
          recipient_role: 'student',
          title:          `🆕 New Drive: ${company_name}`,
          message:        `${company_name} is hiring for ${job_role}. Visit date: ${new Date(visit_date).toDateString()}. Package: ${avg_package || 'N/A'}. Check the Drive Browser to apply!`,
          type:           'drive',
          is_read:        false,
        }));
        await Notification.insertMany(notifications);
        console.log(`[Drive] Notified ${eligibleStudents.length} eligible students for ${company_name}`);
      }
    } catch (notifErr) {
      // Don't fail drive creation if notifications error
      console.error('[Drive] Notification error:', notifErr.message);
    }

    res.status(201).json(formatDrive(drive));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: PUT /api/admin/drives/:drive_id ────────────────────────────────────
exports.adminEditDrive = async (req, res) => {
  try {
    const { company_name, job_role, visit_date, min_cgpa_required, max_backlogs_allowed, required_skills, avg_package, location, status } = req.body;
    const updates = {};
    if (company_name)         updates.company_name         = company_name;
    if (job_role)             updates.job_role             = job_role;
    if (visit_date)           updates.visit_date           = new Date(visit_date);
    if (min_cgpa_required !== undefined) updates.min_cgpa_required = parseFloat(min_cgpa_required);
    if (max_backlogs_allowed !== undefined) updates.max_backlogs_allowed = parseInt(max_backlogs_allowed);
    if (required_skills)      updates.required_skills      = Array.isArray(required_skills) ? required_skills : required_skills.split(',').map(s => s.trim()).filter(Boolean);
    if (avg_package !== undefined) updates.avg_package     = avg_package;
    if (location !== undefined)    updates.location        = location;
    if (status)               updates.status               = status;

    const drive = await CompanyDrive.findByIdAndUpdate(req.params.drive_id, { $set: updates }, { new: true });
    if (!drive) return res.status(404).json({ message: 'Drive not found.' });
    res.json(formatDrive(drive));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: DELETE /api/admin/drives/:drive_id ─────────────────────────────────
exports.adminDeleteDrive = async (req, res) => {
  try {
    const drive = await CompanyDrive.findByIdAndUpdate(req.params.drive_id, { status: 'Cancelled' }, { new: true });
    if (!drive) return res.status(404).json({ message: 'Drive not found.' });
    res.json({ message: 'Drive cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
