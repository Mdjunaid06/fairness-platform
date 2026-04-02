const { callAIEngine } = require("../utils/aiEngineClient");
const admin = require("../config/firebase");

const db = admin.firestore();

exports.auditModel = async (req, res) => {
  try {
    const { gcsUri, targetColumn, sensitiveFeatures } = req.body;
    if (!gcsUri || !targetColumn || !sensitiveFeatures) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await callAIEngine("/analyze/model", {
      gcs_uri: gcsUri,
      target_column: targetColumn,
      sensitive_features: sensitiveFeatures,
    });
    await db.collection("reports").add({
      userId: req.user.uid,
      type: "model",
      gcsUri,
      result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};