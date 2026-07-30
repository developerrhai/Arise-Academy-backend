const express = require("express");
const router = express.Router();
const controller = require("../controllers/teachingLogController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize(["TEACHER", "ADMIN"]), controller.createLog);
router.get("/batch/:batch", protect, authorize(["STUDENT", "TEACHER", "ADMIN"]), controller.getLogsByBatch);
router.get("/teacher", protect, authorize(["TEACHER"]), controller.getTeacherLogs);
router.get("/overview", protect, authorize(["ADMIN"]), controller.getOverview);

module.exports = router;
