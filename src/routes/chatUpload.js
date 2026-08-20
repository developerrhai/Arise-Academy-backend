const express = require("express");
const router = express.Router();
const { uploadToS3 } = require("../config/s3");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

// POST /api/chat/upload
// Expects form-data with a field named "files"
router.post("/upload", protect, (req, res) => {
  const upload = uploadToS3.array("files", 10);
  
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, message: "File too large. Maximum size allowed is 10MB." });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      console.error("Chat File Upload Error:", err);
      return res.status(500).json({ success: false, message: "Failed to upload files" });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No files uploaded" });
      }

      // Map all uploaded files to an array of metadata objects
      const uploadedFiles = req.files.map(file => ({
        url: file.location, // The public S3 URL
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
      }));

      return res.status(200).json({
        success: true,
        message: "Files uploaded successfully",
        data: uploadedFiles,
      });
    } catch (error) {
      console.error("Chat File Upload Error:", error);
      return res.status(500).json({ success: false, message: "Failed to upload files" });
    }
  });
});

module.exports = router;
