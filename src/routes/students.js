const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const c = require("../controllers/studentsController");

const protectAdminOrTeacher = (req, res, next) => {
  if (req.user) {
    req.admin = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    };
  }
  next();
};

router.get("/",      protect, authorize(["ADMIN", "TEACHER"]), protectAdminOrTeacher, c.getAll);
router.get("/:id",   protect, authorize(["ADMIN", "TEACHER"]), protectAdminOrTeacher, c.getOne);
router.post("/",     protect, authorize(["ADMIN"]), protectAdminOrTeacher, c.create);
router.put("/:id",   protect, authorize(["ADMIN"]), protectAdminOrTeacher, c.update);
router.delete("/:id",protect, authorize(["ADMIN"]), protectAdminOrTeacher, c.remove);
router.get("/:id/password", protect, authorize(["ADMIN"]), protectAdminOrTeacher, c.getStudentPassword);
router.put("/:id/password", protect, authorize(["ADMIN"]), protectAdminOrTeacher, c.adminResetPassword);
module.exports = router;
