const { uploadToFirebaseStorage, getFileFromFirestore } = require("../utils/gcsUpload");
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

    const { gcsUri, fileId } = await uploadToFirebaseStorage(
      req.file.buffer,
      fileName,
      req.file.mimetype
    );

    const docRef = await db.collection("uploads").add({
      userId,
      fileName: req.file.originalname,
      gcsUri,
      fileId,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "uploaded",
    });

    res.json({
      uploadId: docRef.id,
      gcsUri,
      fileId,
      message: "File uploaded successfully"
    });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const doc = await db
      .collection("file_storage")
      .doc(fileId)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: "File not found" });
    }

    const data = doc.data();
    const csvBuffer = Buffer.from(data.content, "base64");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${data.fileName || "mitigated_dataset.csv"} "`
    );
    res.setHeader("Content-Type", "text/csv");
    res.send(csvBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.analyzeDataset = async (req, res) => {
  try {
    const { gcsUri, targetColumn, sensitiveFeatures, uploadId, fileId } = req.body;

    if (!targetColumn || !sensitiveFeatures) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const analysisResult = await callAIEngine("/analyze/dataset", {
      gcs_uri: gcsUri,
      file_id: fileId,
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
    console.error("Analysis error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.mitigateDataset = async (req, res) => {
  try {
    const { gcsUri, targetColumn, sensitiveFeatures, strategy, fileId } = req.body;

    const result = await callAIEngine("/mitigate", {
      gcs_uri: gcsUri,
      file_id: fileId,
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
    console.error("Mitigation error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
exports.detectColumns = async (req, res) => {
  try {
    const { gcsUri, fileId } = req.body;

    const result = await callAIEngine("/detect/columns", {
      gcs_uri: gcsUri || "",
      file_id: fileId || null,
    });

    res.json({ detection: result });
  } catch (err) {
    console.error("Column detection error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
exports.listDemoDatasets = async (req, res) => {
  try {
    const result = await callAIEngine("/demo/datasets", null, "GET");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.analyzeDemoDataset = async (req, res) => {
  try {
    const { datasetKey } = req.body;
    const result = await callAIEngine("/demo/analyze", {
      dataset_key: datasetKey
    });

    await db.collection("reports").add({
      userId: req.user.uid,
      type: "dataset",
      gcsUri: `demo://${datasetKey}`,
      result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ analysis: result, reportSaved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.runLegalCheck = async (req, res) => {
  try {
    const { analysisResults, sensitiveFeatures, contextKeywords } = req.body;
    const result = await callAIEngine("/analyze/legal", {
      analysis_results: analysisResults,
      sensitive_features: sensitiveFeatures,
      context_keywords: contextKeywords || []
    });
    res.json({ legal: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateNarrative = async (req, res) => {
  try {
    const { analysisResults, sensitiveFeatures, targetColumn, legalResults } = req.body;
    const result = await callAIEngine("/analyze/narrative", {
      analysis_results: analysisResults,
      sensitive_features: sensitiveFeatures,
      target_column: targetColumn,
      legal_results: legalResults || {}
    });
    res.json({ narrative: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};