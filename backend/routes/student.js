const router = require('express').Router();
const verify = require('../middleware/verifyToken');
const role   = require('../middleware/checkRole');
const upload = require('../middleware/upload');

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
