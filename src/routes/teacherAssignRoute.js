const express = require("express");
const router = express.Router();
const controller = require("../controllers/teacherAssignmentController.js");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize(["ADMIN"]), controller.assignTeacher);
router.get("/", protect, authorize(["ADMIN"]), controller.getAllAssignments);
router.put("/:id", protect, authorize(["ADMIN"]), controller.updateAssignment);
router.delete("/:id", protect, authorize(["ADMIN"]), controller.deleteAssignment);
// router.get("/filter", controller.getAssignmentsFiltered);

module.exports = router;
