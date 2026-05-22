const Notification = require('../models/Notification');

// ── GET /api/student/notifications ───────────────────────────────────────────
exports.getStudentNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({
      recipient_id:   req.user.id,
      recipient_role: 'student',
    }).sort({ createdAt: -1 });

    // Shape to match frontend expectations
    const formatted = notifs.map(n => ({
      id:        n._id,
      _id:       n._id,
      title:     n.title,
      message:   n.message,
      timestamp: n.createdAt ? n.createdAt.toISOString().replace('T', ' ').slice(0, 16) : '',
      read:      n.is_read,
      type:      n.type,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/student/notifications/:id/read ─────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient_id: req.user.id },
      { is_read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/student/notifications/read-all ─────────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient_id: req.user.id, recipient_role: 'student', is_read: false },
      { is_read: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: GET /api/admin/notifications ──────────────────────────────────────
exports.getAdminNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ recipient_id: req.user.id, recipient_role: 'admin' })
      .sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: POST /api/admin/notify/:drive_id ───────────────────────────────────
exports.sendDriveNotification = async (req, res) => {
  try {
    const { student_ids, title, message, type } = req.body;
    if (!student_ids?.length || !title || !message) {
      return res.status(400).json({ message: 'student_ids, title and message are required.' });
    }
    const docs = student_ids.map(sid => ({
      recipient_id:   sid,
      recipient_role: 'student',
      title,
      message,
      type:           type || 'drive',
    }));
    await Notification.insertMany(docs);
    res.json({ message: `Notifications sent to ${student_ids.length} students.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
