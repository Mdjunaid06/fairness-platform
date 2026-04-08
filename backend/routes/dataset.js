const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadDataset,
  analyzeDataset,
  mitigateDataset,
  detectColumns,
  listDemoDatasets,
  analyzeDemoDataset,
  runLegalCheck,
  generateNarrative
} = require("../controllers/datasetController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post("/upload", upload.single("file"), uploadDataset);
router.post("/analyze", analyzeDataset);
router.post("/mitigate", mitigateDataset);
// router.post("/detect", analyzeDataset);
router.post("/detect", detectColumns);
router.get("/demo/list", listDemoDatasets);
router.post("/demo/analyze", analyzeDemoDataset);
router.post("/legal", runLegalCheck);
router.post("/narrative", generateNarrative);

module.exports = router;