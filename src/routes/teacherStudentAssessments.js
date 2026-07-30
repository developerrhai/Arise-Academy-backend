const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const c = require("../controllers/teacherStudentAssessmentsController");

router.get("/", auth, c.getLatestAll);
router.get("/:studentId", auth, c.getByStudent);
router.post("/:studentId", auth, c.createByStudent);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);

module.exports = router;
