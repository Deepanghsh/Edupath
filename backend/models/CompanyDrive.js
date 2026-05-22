const mongoose = require('mongoose');

const CompanyDriveSchema = new mongoose.Schema({
  admin_id:             { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  company_name:         { type: String, required: true, trim: true },
  job_role:             { type: String, required: true, trim: true },
  min_cgpa_required:    { type: Number, required: true, min: 0, max: 10 },
  max_backlogs_allowed: { type: Number, default: 0, min: 0 },
  required_skills:      [{ type: String, trim: true }],
  visit_date:           { type: Date, required: true },
  avg_package:          { type: String, default: '' },
  location:             { type: String, default: '' },
  status:               { type: String, enum: ['Upcoming', 'Active', 'Completed', 'Cancelled'], default: 'Active' },
  applications_count:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('CompanyDrive', CompanyDriveSchema);
