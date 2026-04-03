const express = require("express");
const router = express.Router();
const { testLLMBias } = require("../controllers/llmController");

router.post("/test", testLLMBias);

module.exports = router;