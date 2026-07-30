const express = require('express');
const router = express.Router();
const { getStudentDashboard } = require('../controllers/studentDashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize(['STUDENT']), getStudentDashboard);

module.exports = router;
