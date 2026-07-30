const express = require('express');
const router = express.Router();
const { softDeleteStudent, getRecycleBin, restoreStudent, hardDeleteStudent } = require('../controllers/recycleBinController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Soft Delete a student (Wait, this is usually part of studentRoutes, but we'll add it here for Phase 1)
router.delete('/student/:id', protect, authorize(['SUPERADMIN', 'ADMIN']), softDeleteStudent);

// Get all soft deleted students
router.get('/', protect, authorize(['SUPERADMIN', 'ADMIN']), getRecycleBin);

// Restore
router.post('/restore', protect, authorize(['SUPERADMIN', 'ADMIN']), restoreStudent);

// Hard Delete
router.delete('/:id', protect, authorize(['SUPERADMIN', 'ADMIN']), hardDeleteStudent);

module.exports = router;
