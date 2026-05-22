const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient_id:   { type: mongoose.Schema.Types.ObjectId, required: true },
  recipient_role: { type: String, enum: ['student', 'admin'], required: true },
  title:          { type: String, required: true },
  message:        { type: String, required: true },
  is_read:        { type: Boolean, default: false },
  type:           { type: String, enum: ['drive', 'system', 'mentor'], default: 'system' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
