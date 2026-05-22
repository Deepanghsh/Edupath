const router = require('express').Router();
const verify = require('../middleware/verifyToken');
const role   = require('../middleware/checkRole');

const admin   = require('../controllers/adminController');
const drive   = require('../controllers/driveController');
const app     = require('../controllers/applicationController');
const notif   = require('../controllers/notificationController');
const short   = require('../controllers/shortlistController');

// All admin routes require valid JWT + admin role
router.use(verify, role('admin'));

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', admin.getDashboardData);

// ── Stats KPIs ─────────────────────────────────────────────────────────────
router.get('/stats/students',   admin.getStudentStats);
router.get('/stats/drives',     admin.getDriveStats);
router.get('/stats/placements', admin.getPlacementStats);
router.get('/stats/pending',    admin.getPendingStats);

// ── Analytics ──────────────────────────────────────────────────────────────
router.get('/analytics/placements', admin.getPlacementAnalytics);

// ── Students ───────────────────────────────────────────────────────────────
router.get('/students',           admin.getAllStudents);
router.get('/students/:id',       admin.getStudentById);
router.patch('/verify/:id',       admin.verifyStudent);
router.get('/flagged-students',   admin.getFlaggedStudents);

// ── Drives ─────────────────────────────────────────────────────────────────
router.get('/drives',                       drive.adminGetAllDrives);
router.post('/drives',                      drive.adminCreateDrive);
router.put('/drives/:drive_id',             drive.adminEditDrive);
router.delete('/drives/:drive_id',          drive.adminDeleteDrive);
router.get('/drives/:drive_id/applications',app.getDriveApplications);

// ── Applications ───────────────────────────────────────────────────────────
router.get('/applications',                  app.adminGetAllApplications);
router.patch('/applications/:id/status',     app.updateApplicationStatus);

// ── Eligibility Engine ─────────────────────────────────────────────────────
router.post('/shortlist', short.runEligibilityEngine);

// ── Notifications ──────────────────────────────────────────────────────────
router.get('/notifications',          notif.getAdminNotifications);
router.post('/notify/:drive_id',      notif.sendDriveNotification);

module.exports = router;
