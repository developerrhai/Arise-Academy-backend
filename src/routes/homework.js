const express = require("express");
const router = express.Router();
const controller = require("../controllers/homeworkController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize(["TEACHER", "ADMIN"]), controller.createHomework);
router.patch("/:id", protect, authorize(["TEACHER", "ADMIN"]), controller.editHomework);
router.get("/batch/:batch", protect, authorize(["STUDENT", "TEACHER", "ADMIN"]), controller.getHomeworkByBatch);
router.get("/teacher", protect, authorize(["TEACHER"]), controller.getTeacherHomework);
router.get("/admin", protect, authorize(["ADMIN"]), controller.getAllHomeworkAdmin);
router.put("/:id/status", protect, authorize(["TEACHER", "ADMIN"]), controller.bulkUpdateStatus);
router.get("/:id/students", protect, authorize(["TEACHER", "ADMIN"]), controller.getHomeworkStudents);
router.delete("/:id", protect, authorize(["TEACHER", "ADMIN"]), controller.deleteHomework);

module.exports = router;
