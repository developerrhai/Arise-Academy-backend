const express = require("express");
const router = express.Router();
const controller = require("../controllers/chatMessageController");
const { protect } = require("../middleware/authMiddleware");

router.get("/:groupId", protect, controller.getMessages);
router.post("/", protect, controller.createMessage); // REST fallback
router.delete("/:messageId", protect, controller.deleteMessage);

module.exports = router;
