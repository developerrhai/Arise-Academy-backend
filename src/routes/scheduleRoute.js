const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminTeacherUpdatesController.js");
const auth = require("../middleware/auth");

router.get("/schedule",controller.getFullSchedule);
module.exports = router;
