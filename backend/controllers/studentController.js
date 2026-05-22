const bcrypt       = require('bcryptjs');
const path         = require('path');
const Student      = require('../models/Student');
const Notification = require('../models/Notification');
const calculateScore = require('../utils/scorer');

// Safe payload helper (no password)
const safeStudent = (s) => {
  const obj = s.toObject ? s.toObject() : s;
  delete obj.password;
  delete obj.__v;
  return { ...obj, role: 'student' };
};

// ── GET /api/student/profile ──────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password -__v');
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json({ ...student.toObject(), role: 'student' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/student/profile ────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['full_name', 'branch', 'year', 'cgpa', 'active_backlogs', 'dsa_marks', 'oops_marks', 'skills', 'roll_no'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Recalculate score with merged values
    const current = await Student.findById(req.user.id);
    if (!current) return res.status(404).json({ message: 'Student not found.' });

    const cgpa      = updates.cgpa      ?? current.cgpa;
    const dsa_marks = updates.dsa_marks ?? current.dsa_marks;
    const oops_marks= updates.oops_marks?? current.oops_marks;
    const { score, tier } = calculateScore(cgpa, dsa_marks, oops_marks);
    updates.readiness_score = score;
    updates.tier            = tier;

    if (updates.full_name) {
      updates.avatar = updates.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    }

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.json({ ...student.toObject(), role: 'student' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/student/upload-marksheet ───────────────────────────────────────
exports.uploadMarksheet = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    let fileUrl, publicId;

    if (process.env.USE_CLOUDINARY === 'true') {
      fileUrl  = req.file.path;   // Cloudinary returns path as URL
      publicId = req.file.filename;
    } else {
      // Local storage — return a relative URL
      fileUrl  = `/uploads/${req.file.filename}`;
      publicId = req.file.filename;
    }

    await Student.findByIdAndUpdate(req.user.id, {
      mark_sheet_url:       fileUrl,
      mark_sheet_public_id: publicId,
      verification_status:  'Pending', // reset to pending after new upload
    });

    res.json({
      message:       'Mark sheet uploaded successfully. Awaiting admin verification.',
      mark_sheet_url: fileUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/student/change-password ─────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { current, newPass, confirm } = req.body;
    if (!current || !newPass || !confirm) return res.status(400).json({ message: 'All password fields required.' });
    if (newPass !== confirm) return res.status(400).json({ message: 'New passwords do not match.' });
    if (newPass.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const student = await Student.findById(req.user.id);
    if (!student.password) {
      return res.status(400).json({ message: 'Cannot set password for Google accounts from here.' });
    }

    const isMatch = await bcrypt.compare(current, student.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });

    student.password = await bcrypt.hash(newPass, 10);
    await student.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/student/readiness-score ─────────────────────────────────────────
exports.getReadinessScore = async (req, res) => {
  try {
    const s = await Student.findById(req.user.id).select('readiness_score tier cgpa dsa_marks oops_marks');
    if (!s) return res.status(404).json({ message: 'Not found.' });
    res.json({ readiness_score: s.readiness_score, tier: s.tier });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
