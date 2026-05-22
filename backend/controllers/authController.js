const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const Student = require('../models/Student');
const Admin   = require('../models/Admin');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helper: Sign JWT ─────────────────────────────────────────────────────────
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Helper: Safe student payload ─────────────────────────────────────────────
const safeStudent = (s) => ({
  _id: s._id, student_id: s._id, roll_no: s.roll_no, full_name: s.full_name,
  email: s.email, branch: s.branch, year: s.year, cgpa: s.cgpa,
  active_backlogs: s.active_backlogs, dsa_marks: s.dsa_marks, oops_marks: s.oops_marks,
  skills: s.skills, readiness_score: s.readiness_score, tier: s.tier,
  verification_status: s.verification_status, mark_sheet_url: s.mark_sheet_url,
  avatar: s.avatar, rejection_count: s.rejection_count,
  role: 'student', createdAt: s.createdAt,
});

// ── POST /api/auth/student/register ─────────────────────────────────────────
exports.registerStudent = async (req, res) => {
  try {
    const { roll_no, full_name, email, password, branch, year } = req.body;

    if (!roll_no || !full_name || !email || !password) {
      return res.status(400).json({ message: 'Roll No, Name, Email, and Password are required.' });
    }

    const existingEmail = await Student.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(409).json({ message: 'Email already registered.' });

    const existingRoll = await Student.findOne({ roll_no });
    if (existingRoll) return res.status(409).json({ message: 'Roll number already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const student = await Student.create({
      roll_no, full_name, email: email.toLowerCase(), password: hashed, branch, year,
    });

    const token = signToken(student._id, 'student');
    return res.status(201).json({ token, user: safeStudent(student) });
  } catch (err) {
    console.error('registerStudent error:', err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// ── POST /api/auth/student/login ─────────────────────────────────────────────
exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) return res.status(401).json({ message: 'Invalid credentials.' });

    if (!student.password) {
      return res.status(401).json({ message: 'This account uses Google Sign-In. Please use the Google login button.' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = signToken(student._id, 'student');
    return res.status(200).json({ token, user: safeStudent(student) });
  } catch (err) {
    console.error('loginStudent error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// ── POST /api/auth/admin/login ────────────────────────────────────────────────
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(401).json({ message: 'Invalid admin credentials.' });

    if (!admin.password) {
      return res.status(401).json({ message: 'This account uses Google Sign-In.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid admin credentials.' });

    const token = signToken(admin._id, 'admin');
    return res.status(200).json({
      token,
      user: { _id: admin._id, name: admin.name, email: admin.email, role: 'admin' },
    });
  } catch (err) {
    console.error('loginAdmin error:', err);
    return res.status(500).json({ message: 'Server error during admin login.' });
  }
};

// ── POST /api/auth/google ─────────────────────────────────────────────────────
// Works for both students and admins
// Frontend sends: { credential: <Google ID Token>, intended_role: 'student' | 'admin' }
exports.googleAuth = async (req, res) => {
  try {
    const { credential, intended_role } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential token is required.' });

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken:  credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      return res.status(401).json({ message: 'Invalid Google token. Please try again.' });
    }

    const { sub: google_id, email, name, picture } = payload;
    const role = intended_role || 'student';

    // ── ADMIN Google login ──────────────────────────────────────────────────
    if (role === 'admin') {
      let admin = await Admin.findOne({ $or: [{ google_id }, { email: email.toLowerCase() }] });
      if (!admin) {
        return res.status(403).json({
          message: 'No admin account found for this Google account. Please contact the TPO office.',
        });
      }
      if (!admin.google_id) {
        admin.google_id = google_id;
        await admin.save();
      }
      const token = signToken(admin._id, 'admin');
      return res.status(200).json({
        token,
        user: { _id: admin._id, name: admin.name, email: admin.email, role: 'admin' },
      });
    }

    // ── STUDENT Google login / auto-register ────────────────────────────────
    let student = await Student.findOne({ $or: [{ google_id }, { email: email.toLowerCase() }] });

    if (!student) {
      // Auto-register student with Google data, pending verification
      const nameParts = name.split(' ');
      const roll_no_placeholder = `GOOGLE-${Date.now()}`; // student must update their roll_no in settings
      student = await Student.create({
        roll_no: roll_no_placeholder,
        full_name: name,
        email: email.toLowerCase(),
        google_id,
        verification_status: 'Pending',
        branch: 'CSE',
        year: '1st Year',
      });
    } else if (!student.google_id) {
      student.google_id = google_id;
      await student.save();
    }

    const token = signToken(student._id, 'student');
    return res.status(200).json({ token, user: safeStudent(student) });
  } catch (err) {
    console.error('googleAuth error:', err);
    return res.status(500).json({ message: 'Server error during Google authentication.' });
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  // Stub — in production, send email with reset link
  return res.status(200).json({ message: 'If this email is registered, a reset link has been sent.' });
};
