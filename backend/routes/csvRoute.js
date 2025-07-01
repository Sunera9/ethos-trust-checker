const express = require("express");
const multer = require("multer");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { uploadCsvAndFetchScores } = require("../controller/csvController");

const router = express.Router();

const uploadDir = path.join(os.tmpdir(), "uploads");

// Ensure uploads folder exists on each invocation
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

router.post("/upload-csv", upload.single("file"), uploadCsvAndFetchScores);

module.exports = router;
