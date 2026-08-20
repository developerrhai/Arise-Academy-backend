const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure Multer to use S3 for storage
const uploadToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      // Clean up the original name to avoid spaces and special chars in URL
      const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "");
      cb(null, `chat-uploads/${uniqueSuffix}-${cleanFileName}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

const uploadHomeworkToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "");
      cb(null, `homework-uploads/${uniqueSuffix}-${cleanFileName}`);
    },
  }),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit for PDFs/Images
  },
});

module.exports = {
  s3,
  uploadToS3,
  uploadHomeworkToS3,
};
