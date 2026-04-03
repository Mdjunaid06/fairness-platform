import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { uploadDataset, analyzeDataset, mitigateDataset } from "../services/api";

export default function DatasetAnalysis() {
  const [file, setFile] = useState(null);
  const [gcsUri, setGcsUri] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [sensitiveFeatures, setSensitiveFeatures] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState(null);
  const [mitResult, setMitResult] = useState(null);

  const onDrop = useCallback((files) => setFile(files[0]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handleAnalyze = async () => {
    if (!file || !targetColumn || !sensitiveFeatures) {
      return alert("Please upload a CSV and fill all fields");
    }
    setLoading(true);
    setResults(null);
    try {
      setStatus("Uploading to Cloud Storage...");
      const uploadRes = await uploadDataset(file);
      const uri = uploadRes.data.gcsUri;
      setGcsUri(uri);

      setStatus("Running bias analysis...");
      const res = await analyzeDataset({
        gcsUri: uri,
        targetColumn,
        sensitiveFeatures: sensitiveFeatures.split(",").map((s) => s.trim()),
      });
      setResults(res.data.analysis);
      setStatus("Analysis complete!");
    } catch (err) {
      setStatus("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMitigate = async (strategy) => {
    setLoading(true);
    try {
      const res = await mitigateDataset({
        gcsUri,
        targetColumn,
        sensitiveFeatures: sensitiveFeatures.split(",").map((s) => s.trim()),
        strategy,
      });
      setMitResult(res.data.mitigation);
    } catch (err) {
      alert("Mitigation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = results
    ? Object.entries(results.class_imbalance?.value_counts || {}).map(
      ([label, count]) => ({ label: String(label), count })
    )
    : [];

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Dataset Bias Analysis</h1>
      <p style={{ color: "#6b7280" }}>Upload a CSV file to detect bias across sensitive features.</p>

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <input
          value={targetColumn}
          onChange={(e) => setTargetColumn(e.target.value)}
          placeholder="Target column (e.g. loan_approved)"
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
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
            fontSize: "14px",
          }}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          padding: "12px 28px",
          background: loading ? "#9ca3af" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "15px",
          fontWeight: "500",
        }}
      >
        {loading ? "Processing..." : "🔍 Analyze Bias"}
      </button>

      {status && <p style={{ color: "#6b7280", marginTop: "8px" }}>{status}</p>}

      {results && (
        <div style={{ marginTop: "32px" }}>
          <div
            style={{
              padding: "24px",
              border: `2px solid ${results.overall_score?.color}`,
              borderRadius: "12px",
              marginBottom: "24px",
              textAlign: "center",
              background: "white",
            }}
          >
            <h2 style={{ margin: 0 }}>
              Fairness Score:{" "}
              <span style={{ color: results.overall_score?.color }}>
                {results.overall_score?.score}/100
              </span>
            </h2>
            <p style={{ color: "#6b7280", marginBottom: 0 }}>{results.overall_score?.label}</p>
          </div>

          <h3>Class Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <h3 style={{ marginTop: "24px" }}>Detected Issues</h3>
          {results.bias_summary?.length === 0 ? (
            <p style={{ color: "#22c55e" }}>✅ No significant bias detected</p>
          ) : (
            results.bias_summary?.map((issue, i) => (
              <div
                key={i}
                style={{
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  background: "white",
                }}
              >
                <strong>{issue.type}</strong>
                <span
                  style={{
                    marginLeft: "8px",
                    padding: "2px 8px",
                    background: issue.severity === "High" || issue.severity === "Severe" ? "#fee2e2" : "#fef3c7",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: issue.severity === "High" || issue.severity === "Severe" ? "#991b1b" : "#92400e",
                  }}
                >
                  {issue.severity}
                </span>
                <p style={{ margin: "8px 0 4px", color: "#374151" }}>{issue.message}</p>
                <p style={{ margin: 0, color: "#059669", fontSize: "14px" }}>💡 {issue.action}</p>
              </div>
            ))
          )}

          <h3 style={{ marginTop: "24px" }}>Apply Mitigation</h3>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => handleMitigate("resample")}
              disabled={loading}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                background: "white",
              }}
            >
              📈 Resample (SMOTE)
            </button>
            <button
              onClick={() => handleMitigate("remove_feature")}
              disabled={loading}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                background: "white",
              }}
            >
              ✂️ Remove Proxy Features
            </button>
          </div>
        </div>
      )}

      {mitResult && (
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            background: "#f0fdf4",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
          }}
        >
          <h3 style={{ margin: "0 0 8px" }}>✅ Mitigation Applied: {mitResult.strategy}</h3>
          <p style={{ margin: "4px 0" }}>
            Rows before: {mitResult.rows_before} → after: {mitResult.rows_after}
          </p>
          <p style={{ margin: "4px 0", fontSize: "13px", color: "#6b7280" }}>
            Saved to: {mitResult.output_gcs_uri}
          </p>
        </div>
      )}
    </div>
  );
}
