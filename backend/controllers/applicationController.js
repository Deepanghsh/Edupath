const Application  = require('../models/Application');
const Student      = require('../models/Student');
const Notification = require('../models/Notification');

// ── GET /api/admin/applications ───────────────────────────────────────────────
exports.adminGetAllApplications = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status && status !== 'All') query.status = status;

    let apps = await Application.find(query)
      .populate('student_id', 'full_name roll_no email branch cgpa')
      .populate('drive_id',   'company_name job_role')
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      apps = apps.filter(a =>
        a.student_id?.full_name?.toLowerCase().includes(s) ||
        a.drive_id?.company_name?.toLowerCase().includes(s)
      );
    }

    const formatted = apps.map(a => ({
      _id:          a._id,
      app_id:       `AP-${a._id.toString().slice(-6).toUpperCase()}`,
      student:      a.student_id?.full_name  || 'Unknown',
      roll:         a.student_id?.roll_no    || '',
      email:        a.student_id?.email      || '',
      student_id:   a.student_id?._id,
      company:      a.drive_id?.company_name || 'Unknown',
      role:         a.drive_id?.job_role     || '',
      drive_id:     a.drive_id?._id,
      date:         a.application_date ? a.application_date.toISOString().split('T')[0] : '',
      status:       a.status,
      feedback:     a.feedback,
      rejection_round: a.rejection_round,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/admin/applications/:id/status ──────────────────────────────────
// FR-05: Early Warning System triggered here
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, feedback, rejection_round } = req.body;
    const validStatuses = ['Applied', 'Shortlisted', 'Selected', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const app = await Application.findById(req.params.id)
      .populate('student_id', 'full_name email rejection_count')
      .populate('drive_id',   'company_name');

    if (!app) return res.status(404).json({ message: 'Application not found.' });

    app.status = status;
    if (feedback)        app.feedback = feedback;
    if (rejection_round) app.rejection_round = rejection_round;
    await app.save();

    // ── FR-05: Early Warning System ─────────────────────────────────────────
    if (status === 'Rejected') {
      const student = await Student.findByIdAndUpdate(
        app.student_id._id,
        { $inc: { rejection_count: 1 } },
        { new: true }
      );

      if (student && student.rejection_count >= 3) {
        // Notify student
        await Notification.create({
          recipient_id:   student._id,
          recipient_role: 'student',
          title:          'Mentor Support Assigned',
          message:        `You have been rejected ${student.rejection_count} times. A faculty mentor has been assigned to assist you with targeted preparation.`,
          type:           'mentor',
        });

        // Notify admin
        await Notification.create({
          recipient_id:   req.user.id,
          recipient_role: 'admin',
          title:          `Student ${student.full_name} Flagged`,
          message:        `${student.full_name} has been rejected ${student.rejection_count} times. Consider assigning mentorship or targeted training.`,
          type:           'mentor',
        });
      }
    }

    // Notify student when shortlisted
    if (status === 'Shortlisted') {
      await Notification.create({
        recipient_id:   app.student_id._id,
        recipient_role: 'student',
        title:          `Shortlisted for ${app.drive_id?.company_name || 'drive'}!`,
        message:        `Congratulations! You have been shortlisted for the ${app.drive_id?.company_name} drive. Check your application for next steps.`,
        type:           'drive',
      });
    }

    if (status === 'Selected') {
      await Notification.create({
        recipient_id:   app.student_id._id,
        recipient_role: 'student',
        title:          `🎉 Selected by ${app.drive_id?.company_name}!`,
        message:        `Congratulations! You have been selected by ${app.drive_id?.company_name}. The TPO office will contact you with further details.`,
        type:           'drive',
      });
    }

    res.json({ message: 'Application status updated.', status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/admin/drives/:drive_id/applications ──────────────────────────────
exports.getDriveApplications = async (req, res) => {
  try {
    const apps = await Application.find({ drive_id: req.params.drive_id })
      .populate('student_id', 'full_name roll_no email cgpa active_backlogs tier verification_status skills')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
