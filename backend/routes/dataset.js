const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadDataset,
  analyzeDataset,
  mitigateDataset
} = require("../controllers/datasetController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post("/upload", upload.single("file"), uploadDataset);
router.post("/analyze", analyzeDataset);
router.post("/mitigate", mitigateDataset);

module.exports = router;