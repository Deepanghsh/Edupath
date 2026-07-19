const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const calculateScore = require('../utils/scorer');
const { extractFromBuffer } = require('../utils/ocr');

// ── Cloudinary helper ─────────────────────────────────────────────────────────
let cloudinary;
function getCloudinary() {
  if (!cloudinary) {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  return cloudinary;
}

/**
 * Upload a buffer to Cloudinary and return { url, public_id }.
 * Falls back to saving locally if Cloudinary is not configured.
 */
async function uploadBufferToCloudinary(buffer, originalname, folder) {
  const ext = path.extname(originalname || '').toLowerCase() || '.pdf';
  const tmpPath = path.join(os.tmpdir(), `upload-${Date.now()}${ext}`);
  try {
    fs.writeFileSync(tmpPath, buffer);
    const cld = getCloudinary();
    // PDFs must use resource_type:'raw' → URL becomes /raw/upload/ (browser-openable)
    // Images use resource_type:'image'
    const isPdf = ext === '.pdf';
    const result = await cld.uploader.upload(tmpPath, {
      folder,
      resource_type: isPdf ? 'raw' : 'image',
      use_filename: true,
      unique_filename: true,
    });
    return { url: result.secure_url, public_id: result.public_id };
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { }
  }
}

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

    const cgpa = updates.cgpa ?? current.cgpa;
    const dsa_marks = updates.dsa_marks ?? current.dsa_marks;
    const oops_marks = updates.oops_marks ?? current.oops_marks;
    const { score, tier } = calculateScore(cgpa, dsa_marks, oops_marks);
    updates.readiness_score = score;
    updates.tier = tier;

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

    // ── Step 1: Run OCR on the buffer FIRST (before any upload) ────────────
    let ocrResult = null;
    try {
      ocrResult = await extractFromBuffer(req.file.buffer, req.file.originalname);
      if (ocrResult.success) {
        console.log(`[OCR] ✅ Results → CGPA: ${ocrResult.extracted?.cgpa}, DSA: ${ocrResult.extracted?.dsa_marks}, OOPs: ${ocrResult.extracted?.oops_marks}, Backlogs: ${ocrResult.extracted?.backlogs}`);
        // Print raw text to help debug mark extraction
        console.log('[OCR] Raw text (first 800 chars):\n' + (ocrResult.raw_text || '').substring(0, 800));
        // Print lines that contain DSA/OOPs keywords
        const lines = (ocrResult.raw_text || '').split(/\n/);
        const dsaLine = lines.find(l => /data\s*struct|dsa/i.test(l) && !/lab/i.test(l));
        const oopsLine = lines.find(l => /object\s*orient|oop/i.test(l) && !/lab/i.test(l));
        if (dsaLine) console.log('[OCR] DSA line found :', dsaLine.trim());
        else console.log('[OCR] DSA line NOT FOUND in raw text');
        if (oopsLine) console.log('[OCR] OOPs line found:', oopsLine.trim());
        else console.log('[OCR] OOPs line NOT FOUND in raw text');
      } else {
        console.warn('[OCR] ❌ Failed:', ocrResult.error);
      }
    } catch (ocrErr) {
      console.error('[OCR] Exception:', ocrErr.message);
    }

    // ── Step 2: Upload to Cloudinary ────────────────────────────────────────
    let fileUrl, publicId;
    try {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer, req.file.originalname, 'edupath_marksheets'
      );
      fileUrl = uploaded.url;
      publicId = uploaded.public_id;
    } catch (uploadErr) {
      console.error('[Marksheet] Cloudinary upload failed:', uploadErr.message);
      return res.status(500).json({ message: 'File upload failed. Please try again.' });
    }

    // ── Step 3: Persist URL + OCR extracted values ─────────────────────────
    const updates = {
      mark_sheet_url: fileUrl,
      mark_sheet_public_id: publicId,
      verification_status: 'Pending',
    };

    if (ocrResult?.success && ocrResult.extracted) {
      const ext = ocrResult.extracted;
      if (ext.cgpa != null) updates.cgpa = ext.cgpa;
      if (ext.backlogs != null) updates.active_backlogs = ext.backlogs;
      if (ext.dsa_marks != null) updates.dsa_marks = ext.dsa_marks;
      if (ext.oops_marks != null) updates.oops_marks = ext.oops_marks;
    }

    await Student.findByIdAndUpdate(req.user.id, updates);

    res.json({
      message: 'Mark sheet uploaded. OCR auto-filled your academic data.',
      mark_sheet_url: fileUrl,
      ocr: ocrResult,
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

// ── DELETE /api/student/marksheet ────────────────────────────────────────────
exports.deleteMarksheet = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('mark_sheet_public_id');
    // Delete from Cloudinary if we have a public_id
    if (student?.mark_sheet_public_id && process.env.CLOUDINARY_API_KEY) {
      try {
        const cld = getCloudinary();
        await cld.uploader.destroy(student.mark_sheet_public_id, { resource_type: 'image' });
      } catch (cldErr) {
        // Try raw resource type in case it was a PDF
        try {
          const cld = getCloudinary();
          await cld.uploader.destroy(student.mark_sheet_public_id, { resource_type: 'raw' });
        } catch { }
      }
    }
    await Student.findByIdAndUpdate(req.user.id, {
      mark_sheet_url: null,
      mark_sheet_public_id: null,
      verification_status: 'Pending',
    });
    res.json({ message: 'Mark sheet removed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/student/upload-resume ──────────────────────────────────────────
// Accepts PDF/DOCX/TXT, extracts text, detects skills, merges into profile.
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    let fileUrl, publicId;

    if (process.env.USE_CLOUDINARY === 'true') {
      fileUrl = req.file.path;
      publicId = req.file.filename;
    } else {
      fileUrl = `/uploads/${req.file.filename}`;
      publicId = req.file.filename;
    }

    // ── Parse resume for skills ─────────────────────────────────────────────
    const { parseResume } = require('../utils/resumeParser');
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(req.file.path);
    const parsed = await parseResume(fileBuffer, req.file.originalname || req.file.filename);

    // Merge detected skills with existing ones (additive, no duplicates)
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const existingSkills = student.skills || [];
    const detectedSkills = parsed.skills || [];
    const mergedSkills = [...new Set([...existingSkills, ...detectedSkills])];

    // Save resume_url + merged skills
    const updated = await Student.findByIdAndUpdate(
      req.user.id,
      { $set: { resume_url: fileUrl, resume_public_id: publicId, skills: mergedSkills } },
      { new: true, runValidators: true }
    ).select('-password -__v');

    console.log(`[Resume] Detected ${detectedSkills.length} skills: ${detectedSkills.join(', ')}`);

    res.json({
      message: 'Resume uploaded and skills extracted successfully.',
      resume_url: fileUrl,
      detected_skills: detectedSkills,
      merged_skills: mergedSkills,
      student: { ...updated.toObject(), role: 'student' },
    });
  } catch (err) {
    console.error('[uploadResume]', err);
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/student/resume ────────────────────────────────────────────────
exports.deleteResume = async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(
      req.user.id,
      { $set: { resume_url: null, resume_public_id: null } },
      { new: true }
    ).select('-password -__v');
    res.json({ message: 'Resume removed successfully.', student: { ...updated.toObject(), role: 'student' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
