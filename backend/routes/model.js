const express = require("express");
const router = express.Router();
const { auditModel } = require("../controllers/modelController");

router.post("/audit", auditModel);

module.exports = router;