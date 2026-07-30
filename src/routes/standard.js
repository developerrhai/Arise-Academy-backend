const express = require("express");
const router = express.Router();
const controller = require("../controllers/standardController.js");

router.post("/", controller.createStandard);
router.get("/", controller.getStandards);
router.put("/:id", controller.updateStandard);
router.delete("/:id", controller.deleteStandard);
router.get("/filter", controller.getStandardsFiltered);

module.exports = router;
