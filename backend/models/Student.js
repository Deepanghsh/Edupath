const mongoose = require('mongoose');
const calculateScore = require('../utils/scorer');

const StudentSchema = new mongoose.Schema({
  roll_no:             { type: String, required: true, unique: true, trim: true },
  full_name:           { type: String, required: true, trim: true },
  email:               { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:            { type: String }, // optional — null if signed up via Google
  google_id:           { type: String, default: null },
  branch:              { type: String, default: 'CSE', trim: true },
  year:                { type: String, default: '1st Year' },
  cgpa:                { type: Number, min: 0, max: 10, default: 0 },
  active_backlogs:     { type: Number, min: 0, default: 0 },
  dsa_marks:           { type: Number, min: 0, max: 100, default: 0 },
  oops_marks:          { type: Number, min: 0, max: 100, default: 0 },
  readiness_score:     { type: Number, default: 0 },
  tier:                { type: String, enum: ['Tier1', 'Tier2', 'Tier3'], default: 'Tier3' },
  mark_sheet_url:      { type: String, default: '' },
  mark_sheet_public_id: { type: String, default: '' },
  verification_status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  skills:              [{ type: String, trim: true }],
  rejection_count:     { type: Number, default: 0 },
  avatar:              { type: String, default: '' },
}, { timestamps: true });

// FR-04: Pre-save hook — recalculate Employability Score on every save
// Using async pattern (Mongoose 6+) — no `next` parameter needed
StudentSchema.pre('save', async function () {
  const { score, tier } = calculateScore(this.cgpa, this.dsa_marks, this.oops_marks);
  this.readiness_score = score;
  this.tier = tier;

  // Auto-generate avatar initials from full name
  if (this.full_name) {
    this.avatar = this.full_name
      .split(' ')
      .filter(w => w.length > 0)
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
});

module.exports = mongoose.model('Student', StudentSchema);
