const express = require("express");
const multer = require("multer");
const { uploadCsvAndFetchScores } = require("../controller/csvController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-csv", upload.single("file"), uploadCsvAndFetchScores);

module.exports = router;
