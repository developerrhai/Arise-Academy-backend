const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const c = require("../controllers/studentsController");

// Universal students data for all logged-in users.
router.get("/", auth, c.getAll);

module.exports = router;

