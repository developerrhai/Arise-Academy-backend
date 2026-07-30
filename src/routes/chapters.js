const express = require("express");
const router = express.Router();
const controller = require("../controllers/chaptersController.js");

router.post("/", controller.createChapter);
router.get("/", controller.getChaptersByHierarchy);
router.put("/:id", controller.updateChapter);
router.delete("/:id", controller.deleteChapter);
router.get(
  "/filter",
  controller.getChaptersByHierarchy
);

module.exports = router;
