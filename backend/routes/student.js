const router = require('express').Router();
const verify = require('../middleware/verifyToken');
const role   = require('../middleware/checkRole');
const upload = require('../middleware/upload');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── Resume-specific multer (PDF, DOCX, TXT — up to 10 MB) ────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename:    (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `resume-${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const allowedExt = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT are allowed.'), false);
    }
  },
});

const student = require('../controllers/studentController');
const drive   = require('../controllers/driveController');
const notif   = require('../controllers/notificationController');

// All student routes require a valid JWT + student role
router.use(verify, role('student'));

// Profile
router.get('/profile',         student.getProfile);
router.patch('/profile',       student.updateProfile);
router.put('/change-password', student.changePassword);
router.get('/readiness-score', student.getReadinessScore);

// Mark sheet upload
router.post('/upload-marksheet', upload.single('marksheet'), student.uploadMarksheet);
router.delete('/marksheet', student.deleteMarksheet);

// Resume upload (PDF/DOCX/TXT) — extracts skills automatically
router.post('/upload-resume', resumeUpload.single('resume'), student.uploadResume);
router.delete('/resume', student.deleteResume);

// Drives
router.get('/drives',          drive.getAllDrives);
router.get('/eligible-drives', drive.getEligibleDrives);
router.post('/apply',          drive.applyToDrive);

// Applications
router.get('/applications', drive.getMyApplications);

// Notifications
router.get('/notifications',                    notif.getStudentNotifications);
router.patch('/notifications/:id/read',         notif.markAsRead);
router.patch('/notifications/read-all',         notif.markAllRead);

module.exports = router;
