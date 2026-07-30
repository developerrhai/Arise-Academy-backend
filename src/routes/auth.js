const express = require("express");
const router = express.Router();
const { signup, login, sendOtp, verifyOtp, resetPasswordOtp } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password-otp", resetPasswordOtp);

module.exports = router;
