const Student     = require('../models/Student');
const CompanyDrive = require('../models/CompanyDrive');

// ── POST /api/admin/shortlist ─────────────────────────────────────────────────
// FR-03: Eligibility Engine
// Body: { drive_id, criteria: { min_cgpa, max_backlogs, required_skills[] } }
exports.runEligibilityEngine = async (req, res) => {
  try {
    const { drive_id, criteria } = req.body;

    let min_cgpa = 0, max_backlogs = 99, required_skills = [];

    if (drive_id) {
      const drive = await CompanyDrive.findById(drive_id);
      if (!drive) return res.status(404).json({ message: 'Drive not found.' });
      min_cgpa        = drive.min_cgpa_required;
      max_backlogs    = drive.max_backlogs_allowed;
      required_skills = drive.required_skills;
    }

    // Override with explicit criteria if provided
    if (criteria) {
      if (criteria.min_cgpa       !== undefined) min_cgpa     = criteria.min_cgpa;
      if (criteria.max_backlogs   !== undefined) max_backlogs = criteria.max_backlogs;
      if (criteria.required_skills?.length)      required_skills = criteria.required_skills;
    }

    // Build the MongoDB compound query
    const query = {
      cgpa:                { $gte: min_cgpa },
      active_backlogs:     { $lte: max_backlogs },
      verification_status: 'Approved',
    };

    // FR-03: skills.$all — only students possessing every required skill
    if (required_skills && required_skills.length > 0) {
      query.skills = { $all: required_skills };
    }

    const eligible = await Student.find(query)
      .select('full_name roll_no cgpa skills tier readiness_score verification_status active_backlogs email branch')
      .sort({ readiness_score: -1 });

    res.json({ count: eligible.length, students: eligible, criteria: { min_cgpa, max_backlogs, required_skills } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
