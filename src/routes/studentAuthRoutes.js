const express = require('express');
const router = express.Router();
const { loginStudent, changePassword } = require('../controllers/studentAuthController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', loginStudent);
router.post('/change-password', protect, authorize(['STUDENT']), changePassword);

module.exports = router;
