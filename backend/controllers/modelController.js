const { callAIEngine } = require("../utils/aiEngineClient");
const admin = require("../config/firebase");

const db = admin.firestore();

exports.auditModel = async (req, res) => {
  try {
    const {
      gcsUri,
      fileId,
      targetColumn,
      sensitiveFeatures
    } = req.body;

    if (!targetColumn || !sensitiveFeatures) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

        const result = await callAIEngine("/analyze/model", {
        gcs_uri: gcsUri || "",
        file_id: fileId || null,
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
    console.error("Model audit error:", err.message);
    res.status(500).json({ error: err.message });
  }
};