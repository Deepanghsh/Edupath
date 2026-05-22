const router  = require('express').Router();
const auth    = require('../controllers/authController');
const limiter = require('../middleware/rateLimiter');

// Apply rate limiter on all auth routes
router.use(limiter);

// Student
router.post('/student/register', auth.registerStudent);
router.post('/student/login',    auth.loginStudent);

// Admin
router.post('/admin/login', auth.loginAdmin);

// Google OAuth (shared for both roles)
router.post('/google', auth.googleAuth);

// Password reset
router.post('/reset-password', auth.resetPassword);

module.exports = router;
