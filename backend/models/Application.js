const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  student_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  drive_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyDrive', required: true },
  application_date: { type: Date, default: Date.now },
  status:           { type: String, enum: ['Applied', 'Shortlisted', 'Selected', 'Rejected'], default: 'Applied' },
  rejection_round:  { type: String, default: '' }, // e.g. 'Coding Round', 'HR Interview'
  feedback:         { type: String, default: '' },  // optional admin note
}, { timestamps: true });

// Prevent duplicate applications
ApplicationSchema.index({ student_id: 1, drive_id: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
