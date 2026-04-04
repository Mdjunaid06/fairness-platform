import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { uploadDataset, auditModel } from "../services/api";

export default function ModelAudit() {
  const [file, setFile] = useState(null);
  const [gcsUri, setGcsUri] = useState("");
  const [fileId, setFileId] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [sensitiveFeatures, setSensitiveFeatures] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState(null);

  const onDrop = useCallback((files) => setFile(files[0]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handleAudit = async () => {
    if (!file || !targetColumn || !sensitiveFeatures) {
      return alert("Please upload a CSV and fill all fields");
    }
    setLoading(true);
    setResults(null);
    try {
      setStatus("Uploading dataset...");
      const uploadRes = await uploadDataset(file);
      const uri = uploadRes.data.gcsUri;
      const fid = uploadRes.data.fileId;
      setGcsUri(uri);
      setFileId(fid);

      setStatus("Training model and auditing fairness...");
      const res = await auditModel({
        gcsUri: uri,
        fileId: fid,
        targetColumn,
        sensitiveFeatures: sensitiveFeatures
          .split(",")
          .map((s) => s.trim()),
      });
      setResults(res.data.analysis);
      setStatus("Audit complete!");
    } catch (err) {
      setStatus(
        "Error: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const featureData = results
    ? Object.entries(results.feature_importance || {})
        .map(([name, value]) => ({
          name,
          importance: parseFloat((value * 100).toFixed(2))
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 8)
    : [];

  return (
    <div style={{
      padding: "32px",
      maxWidth: "900px",
      margin: "0 auto"
    }}>
      <h1>Model Fairness Audit</h1>
      <p style={{ color: "#6b7280" }}>
        Upload a CSV dataset. We train a model and measure
        fairness across sensitive groups.
      </p>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #d1d5db",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          cursor: "pointer",
          background: isDragActive ? "#f0fdf4" : "white",
          marginBottom: "16px",
        }}
      >
        <input {...getInputProps()} />
        <p style={{ margin: 0, color: "#6b7280" }}>
          {file
            ? `✅ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
            : isDragActive
            ? "Drop the CSV here"
            : "Drag & drop a CSV file, or click to select"}
        </p>
      </div>

      {/* Config */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        marginBottom: "16px"
      }}>
        <input
          value={targetColumn}
          onChange={(e) => setTargetColumn(e.target.value)}
          placeholder="Target column (e.g. loan_approved)"
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "14px"
          }}
        />
        <input
          value={sensitiveFeatures}
          onChange={(e) => setSensitiveFeatures(e.target.value)}
          placeholder="Sensitive features (e.g. gender,race)"
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "14px"
          }}
        />
      </div>

      <button
        onClick={handleAudit}
        disabled={loading}
        style={{
          padding: "12px 28px",
          background: loading ? "#9ca3af" : "#059669",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "15px",
          fontWeight: "500"
        }}
      >
        {loading ? "Auditing..." : "🤖 Run Audit"}
      </button>

      {status && (
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          {status}
        </p>
      )}

      {results && (
        <div style={{ marginTop: "32px" }}>

          {/* Score Card */}
          <div style={{
            padding: "24px",
            border: `2px solid ${results.overall_score?.color}`,
            borderRadius: "12px",
            marginBottom: "24px",
            textAlign: "center",
            background: "white"
          }}>
            <h2 style={{ margin: "0 0 4px" }}>
              Fairness Score:{" "}
              <span style={{ color: results.overall_score?.color }}>
                {results.overall_score?.score}/100
              </span>
            </h2>
            <p style={{ margin: "0 0 8px", color: "#6b7280" }}>
              {results.overall_score?.label}
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              Model: {results.model_type} |
              Accuracy: {(results.accuracy * 100).toFixed(1)}% |
              Test samples: {results.test_samples}
            </p>
          </div>

          {/* Feature Importance Chart */}
          <h3>Feature Importance</h3>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Higher importance = model relied on this feature more.
            Watch for sensitive features near the top.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={featureData}
              layout="vertical"
              margin={{ left: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                unit="%"
                domain={[0, 100]}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar
                dataKey="importance"
                fill="#059669"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Fairness Metrics */}
          <h3 style={{ marginTop: "24px" }}>Fairness Metrics</h3>
          {results.fairness_metrics?.map((sf, i) => (
            <div key={i} style={{
              padding: "16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              marginBottom: "12px",
              background: "white"
            }}>
              <strong>
                Sensitive Feature: {sf.sensitive_feature}
              </strong>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px",
                marginTop: "12px"
              }}>
                {sf.metrics?.map((metric, j) => (
                  <div key={j} style={{
                    padding: "12px",
                    background: metric.is_fair
                      ? "#f0fdf4" : "#fef2f2",
                    borderRadius: "8px",
                    border: `1px solid ${
                      metric.is_fair ? "#bbf7d0" : "#fecaca"
                    }`
                  }}>
                    <p style={{
                      margin: "0 0 4px",
                      fontWeight: "500",
                      fontSize: "13px"
                    }}>
                      {metric.metric}
                    </p>
                    <p style={{
                      margin: "0 0 4px",
                      fontSize: "20px",
                      fontWeight: "600",
                      color: metric.is_fair
                        ? "#059669" : "#dc2626"
                    }}>
                      {metric.value}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#6b7280"
                    }}>
                      {metric.interpretation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}