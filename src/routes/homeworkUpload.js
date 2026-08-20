const express = require("express");
const router = express.Router();
const { uploadHomeworkToS3 } = require("../config/s3");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

// POST /api/homework-attachments/upload
// Expects form-data with a field named "file"
router.post("/upload", protect, (req, res) => {
  const upload = uploadHomeworkToS3.single("file");
  
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, message: "File too large. Maximum size allowed is 20MB." });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      console.error("Homework File Upload Error:", err);
      return res.status(500).json({ success: false, message: "Failed to upload file" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: req.file.location,
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error) {
      console.error("Homework File Upload Error:", error);
      return res.status(500).json({ success: false, message: "Failed to process uploaded file" });
    }
  });
});

module.exports = router;
