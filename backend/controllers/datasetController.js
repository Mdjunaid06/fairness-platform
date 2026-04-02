const { uploadToGCS } = require("../utils/gcsUpload");
const { callAIEngine } = require("../utils/aiEngineClient");
const admin = require("../config/firebase");

const db = admin.firestore();

exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const userId = req.user.uid;
    const fileName = `${userId}/${Date.now()}_${req.file.originalname}`;
    const gcsUri = await uploadToGCS(
      req.file.buffer,
      fileName,
      req.file.mimetype
    );
    const docRef = await db.collection("uploads").add({
      userId,
      fileName: req.file.originalname,
      gcsUri,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "uploaded",
    });
    res.json({ uploadId: docRef.id, gcsUri, message: "Uploaded successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.analyzeDataset = async (req, res) => {
  try {
    const { gcsUri, targetColumn, sensitiveFeatures, uploadId } = req.body;
    if (!gcsUri || !targetColumn || !sensitiveFeatures) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const analysisResult = await callAIEngine("/analyze/dataset", {
      gcs_uri: gcsUri,
      target_column: targetColumn,
      sensitive_features: sensitiveFeatures,
    });
    const reportRef = await db.collection("reports").add({
      userId: req.user.uid,
      uploadId: uploadId || null,
      type: "dataset",
      gcsUri,
      result: analysisResult,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ reportId: reportRef.id, analysis: analysisResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.mitigateDataset = async (req, res) => {
  try {
    const { gcsUri, targetColumn, sensitiveFeatures, strategy } = req.body;
    const result = await callAIEngine("/mitigate", {
      gcs_uri: gcsUri,
      target_column: targetColumn,
      sensitive_features: sensitiveFeatures,
      strategy: strategy || "resample",
    });
    await db.collection("mitigations").add({
      userId: req.user.uid,
      originalGcsUri: gcsUri,
      strategy,
      result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ mitigation: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};