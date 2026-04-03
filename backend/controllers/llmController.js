const { callAIEngine } = require("../utils/aiEngineClient");
const admin = require("../config/firebase");

const db = admin.firestore();

exports.testLLMBias = async (req, res) => {
  try {
    const { provider, modelName, testSuite, customPrompts } = req.body;
    if (!provider || !modelName) {
      return res.status(400).json({ error: "provider and modelName required" });
    }
    const result = await callAIEngine("/analyze/llm", {
      provider,
      model_name: modelName,
      test_suite: testSuite || "default",
      custom_prompts: customPrompts || [],
    });
    await db.collection("reports").add({
      userId: req.user.uid,
      type: "llm",
      provider,
      modelName,
      result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};