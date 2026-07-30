const express = require("express");
const router = express.Router();
const controller = require("../controllers/subjectController.js");

router.post("/", controller.createSubject);
router.get("/", controller.getSubjects);
router.put("/:id", controller.updateSubject);
router.delete("/:id", controller.deleteSubject);
router.get("/filter", controller.getSubjectsFiltered);

module.exports = router;
