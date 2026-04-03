const express = require("express");
const router = express.Router();
const { getReports, getReport } = require("../controllers/reportController");

router.get("/", getReports);
router.get("/:id", getReport);

module.exports = router;