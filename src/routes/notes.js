const express = require("express");
const router = express.Router();
const controller = require("../controllers/notesController.js");

router.post("/", controller.createNote);
router.get("/", controller.getNotes);
router.put("/:id", controller.updateNote);
router.delete("/:id", controller.deleteNote);
router.get(
  "/filter",
  controller.getNotesByHierarchy
);

module.exports = router;
