import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { uploadDataset, analyzeDataset, mitigateDataset, detectColumns } from "../services/api";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

const RISK_COLORS = {
  High: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
  Medium: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  Low: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
};

export default function DatasetAnalysis() {
  const [file, setFile] = useState(null);
  const [gcsUri, setGcsUri] = useState("");
  const [fileId, setFileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [step, setStep] = useState("upload");
  const [detection, setDetection] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedSensitive, setSelectedSensitive] = useState([]);
  const [results, setResults] = useState(null);
  const [mitResult, setMitResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const onDrop = useCallback((files) => setFile(files[0]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handleUploadAndDetect = async () => {
    if (!file) return alert("Please upload a CSV file");
    setLoading(true);
    setStatus("Uploading file...");
    try {
      const uploadRes = await uploadDataset(file);
      const uri = uploadRes.data.gcsUri;
      const fid = uploadRes.data.fileId;
      setGcsUri(uri);
      setFileId(fid);

      setStatus("Detecting sensitive columns...");
      const detectRes = await detectColumns({
        gcsUri: uri,
        fileId: fid
      });

      const det = detectRes.data.detection;
      setDetection(det);

      // Auto-select recommended options
      if (det.auto_config.recommended_target) {
        setSelectedTarget(det.auto_config.recommended_target);
      }
      setSelectedSensitive(
        det.auto_config.recommended_sensitive || []
      );

      setStep("configure");
      setStatus("");
    } catch (err) {
      setStatus("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedTarget) return alert("Please select a target column");
    if (selectedSensitive.length === 0)
      return alert("Please select at least one sensitive feature");

    setLoading(true);
    setStatus("Running deep bias analysis...");
    try {
      const res = await analyzeDataset({
        gcsUri,
        fileId,
        targetColumn: selectedTarget,
        sensitiveFeatures: selectedSensitive,
      });
      setResults(res.data.analysis);
      setStep("results");
      setStatus("");
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
        fileId,
        targetColumn: selectedTarget,
        sensitiveFeatures: selectedSensitive,
        strategy,
      });
      setMitResult(res.data.mitigation);
    } catch (err) {
      alert("Mitigation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSensitive = (col) => {
    setSelectedSensitive(prev =>
      prev.includes(col)
        ? prev.filter(c => c !== col)
        : [...prev, col]
    );
  };

  const chartData = results
    ? Object.entries(results.class_imbalance?.value_counts || {})
        .map(([label, count]) => ({ label: String(label), count }))
    : [];

  // ── STEP 1: UPLOAD ─────────────────────────────────────────
  if (step === "upload") {
    return (
      <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
        <p style={{ color: "#6b7280", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
          BIAS DETECTION
        </p>
        <h1 style={{ margin: "0 0 8px" }}>Dataset Analysis</h1>
        <p style={{ color: "#6b7280", margin: "0 0 32px" }}>
          Upload your CSV dataset. Our AI will automatically detect
          sensitive features, proxy variables, and potential bias sources.
        </p>

        <div
          {...getRootProps()}
          style={{
            border: "2px dashed #d1d5db",
            borderRadius: "16px",
            padding: "60px 40px",
            textAlign: "center",
            cursor: "pointer",
            background: isDragActive ? "#eff6ff" : "#fafafa",
            transition: "all 0.2s",
            marginBottom: "24px",
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>
            {file ? "✅" : "📂"}
          </div>
          {file ? (
            <div>
              <p style={{ margin: "0 0 4px", fontWeight: "500", fontSize: "16px" }}>
                {file.name}
              </p>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                {(file.size / 1024).toFixed(1)} KB — Ready to analyze
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: "0 0 4px", fontWeight: "500", fontSize: "16px" }}>
                {isDragActive ? "Drop it here!" : "Drag & drop your CSV"}
              </p>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                or click to browse files
              </p>
            </div>
          )}
        </div>

        {/* Demo Datasets */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "12px" }}>
            Or try a famous bias dataset:
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { name: "COMPAS Recidivism", desc: "Criminal justice AI bias" },
              { name: "Adult Census", desc: "Income prediction bias" },
              { name: "German Credit", desc: "Credit scoring bias" },
              { name: "Loan Approval", desc: "Banking discrimination" },
            ].map((d, i) => (
              <button key={i} style={{
                padding: "8px 14px",
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                textAlign: "left"
              }}>
                <div style={{ fontWeight: "500" }}>{d.name}</div>
                <div style={{ color: "#6b7280", fontSize: "11px" }}>{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleUploadAndDetect}
          disabled={!file || loading}
          style={{
            width: "100%",
            padding: "14px",
            background: !file || loading ? "#9ca3af" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: !file || loading ? "not-allowed" : "pointer",
            fontSize: "15px",
            fontWeight: "500"
          }}
        >
          {loading ? status || "Processing..." : "🔍 Upload & Auto-Detect Bias Factors"}
        </button>
      </div>
    );
  }

  // ── STEP 2: CONFIGURE ───────────────────────────────────────
  if (step === "configure" && detection) {
    return (
      <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button onClick={() => setStep("upload")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px" }}>
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0 }}>Configure Analysis</h1>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              {detection.total_rows} rows · {detection.total_columns} columns · AI detected {detection.sensitive_features.length} sensitive features
            </p>
          </div>
        </div>

        {/* Target Column Selection */}
        <div style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px"
        }}>
          <h3 style={{ margin: "0 0 4px" }}>🎯 Target Column</h3>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 16px" }}>
            The column your model predicts (outcome variable)
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {detection.suggested_targets.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedTarget(t.column)}
                style={{
                  padding: "8px 16px",
                  border: `2px solid ${selectedTarget === t.column ? "#2563eb" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  background: selectedTarget === t.column ? "#eff6ff" : "white",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div style={{ fontWeight: "500", fontSize: "14px", color: selectedTarget === t.column ? "#2563eb" : "inherit" }}>
                  {t.column}
                </div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>
                  {Math.round(t.confidence * 100)}% confidence · {t.reason}
                </div>
              </button>
            ))}
            {/* Show all other columns as options too */}
            {detection.column_names
              .filter(c => !detection.suggested_targets.find(t => t.column === c))
              .filter(c => !detection.id_columns.includes(c))
              .map((c, i) => (
                <button
                  key={`other-${i}`}
                  onClick={() => setSelectedTarget(c)}
                  style={{
                    padding: "8px 16px",
                    border: `2px solid ${selectedTarget === c ? "#2563eb" : "#e5e7eb"}`,
                    borderRadius: "8px",
                    background: selectedTarget === c ? "#eff6ff" : "white",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: "14px", color: selectedTarget === c ? "#2563eb" : "#6b7280" }}>
                    {c}
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Sensitive Features */}
        <div style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px"
        }}>
          <h3 style={{ margin: "0 0 4px" }}>⚠️ Sensitive Features</h3>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 16px" }}>
            AI-detected protected attributes. Select all that apply.
          </p>

          {detection.sensitive_features.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {detection.sensitive_features.map((sf, i) => {
                const colors = RISK_COLORS[sf.risk] || RISK_COLORS.Low;
                const isSelected = selectedSensitive.includes(sf.column);
                return (
                  <div
                    key={i}
                    onClick={() => toggleSensitive(sf.column)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      border: `2px solid ${isSelected ? "#2563eb" : "#e5e7eb"}`,
                      borderRadius: "10px",
                      cursor: "pointer",
                      background: isSelected ? "#eff6ff" : "white",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "20px", height: "20px",
                        borderRadius: "4px",
                        background: isSelected ? "#2563eb" : "white",
                        border: `2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", color: "white"
                      }}>
                        {isSelected ? "✓" : ""}
                      </div>
                      <div>
                        <div style={{ fontWeight: "500", fontSize: "14px" }}>
                          {sf.column}
                          <span style={{
                            marginLeft: "8px",
                            fontSize: "11px",
                            background: "#dbeafe",
                            color: "#1d4ed8",
                            padding: "2px 6px",
                            borderRadius: "4px"
                          }}>
                            {sf.category}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                          {sf.reason} · {Math.round(sf.confidence * 100)}% confidence
                        </div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
                          ⚖️ {sf.law}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      padding: "3px 10px",
                      background: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      {sf.risk} Risk
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              No sensitive features auto-detected.
              Manually select from all columns below.
            </p>
          )}

          {/* Manual add from remaining columns */}
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "8px" }}>
              Add more columns manually:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {detection.column_names
                .filter(c => !detection.sensitive_features.find(sf => sf.column === c))
                .filter(c => c !== selectedTarget)
                .filter(c => !detection.id_columns.includes(c))
                .map((c, i) => (
                  <button
                    key={i}
                    onClick={() => toggleSensitive(c)}
                    style={{
                      padding: "4px 10px",
                      border: `1px solid ${selectedSensitive.includes(c) ? "#2563eb" : "#e5e7eb"}`,
                      borderRadius: "6px",
                      background: selectedSensitive.includes(c) ? "#eff6ff" : "white",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: selectedSensitive.includes(c) ? "#2563eb" : "#374151"
                    }}
                  >
                    {selectedSensitive.includes(c) ? "✓ " : ""}{c}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px"
        }}>
          <h3 style={{ margin: "0 0 12px" }}>👁️ Data Preview</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {detection.column_names.map((col, i) => (
                    <th key={i} style={{
                      padding: "8px 12px",
                      background: selectedSensitive.includes(col)
                        ? "#fef3c7"
                        : col === selectedTarget
                        ? "#dbeafe"
                        : "#f9fafb",
                      border: "1px solid #e5e7eb",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      whiteSpace: "nowrap"
                    }}>
                      {col}
                      {selectedSensitive.includes(col) && <span style={{ color: "#f59e0b", marginLeft: "4px" }}>⚠</span>}
                      {col === selectedTarget && <span style={{ color: "#2563eb", marginLeft: "4px" }}>🎯</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detection.dataset_preview || []).map((row, i) => (
                  <tr key={i}>
                    {detection.column_names.map((col, j) => (
                      <td key={j} style={{
                        padding: "6px 12px",
                        border: "1px solid #f3f4f6",
                        color: "#374151"
                      }}>
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "8px" }}>
            🎯 = Target column &nbsp; ⚠ = Sensitive feature
          </p>
        </div>

        {/* Summary + Analyze Button */}
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: "500" }}>
              Ready to analyze
            </p>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              Target: <strong>{selectedTarget || "Not selected"}</strong>
              &nbsp;·&nbsp;
              Sensitive: <strong>{selectedSensitive.join(", ") || "None selected"}</strong>
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedTarget || selectedSensitive.length === 0}
            style={{
              padding: "12px 28px",
              background: loading || !selectedTarget || selectedSensitive.length === 0
                ? "#9ca3af" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "15px",
              fontWeight: "500",
              whiteSpace: "nowrap"
            }}
          >
            {loading ? "Analyzing..." : "🔍 Run Bias Analysis"}
          </button>
        </div>
        {status && <p style={{ color: "#6b7280", textAlign: "center" }}>{status}</p>}
      </div>
    );
  }

  // ── STEP 3: RESULTS ─────────────────────────────────────────
  if (step === "results" && results) {
    const score = results.overall_score?.score;
    const scoreColor = results.overall_score?.color || "#6b7280";

    const tabs = ["overview", "distribution", "issues", "mitigation"];

    return (
      <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={() => { setStep("configure"); setResults(null); setMitResult(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px" }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0 }}>Bias Analysis Report</h1>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              {results.dataset_info?.total_rows} rows · Target: {selectedTarget} · Sensitive: {selectedSensitive.join(", ")}
            </p>
          </div>
        </div>

        {/* Score Hero */}
        <div style={{
          background: "white",
          border: `2px solid ${scoreColor}`,
          borderRadius: "16px",
          padding: "28px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <p style={{ margin: "0 0 4px", color: "#6b7280", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              FAIRNESS SCORE
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "56px", fontWeight: "700", color: scoreColor, lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: "24px", color: "#9ca3af" }}>/100</span>
            </div>
            <p style={{ margin: "8px 0 0", fontWeight: "500", color: scoreColor }}>
              {results.overall_score?.label}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              width: "120px", height: "120px",
              borderRadius: "50%",
              background: `conic-gradient(${scoreColor} ${score * 3.6}deg, #f3f4f6 0deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}>
              <div style={{
                width: "90px", height: "90px",
                borderRadius: "50%",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: "700",
                color: scoreColor
              }}>
                {score}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "#f3f4f6", padding: "4px", borderRadius: "10px" }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: activeTab === tab ? "white" : "transparent",
                fontWeight: activeTab === tab ? "500" : "400",
                fontSize: "14px",
                color: activeTab === tab ? "#111827" : "#6b7280",
                boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
              {[
                { label: "Total Rows", value: results.dataset_info?.total_rows },
                { label: "Columns", value: results.dataset_info?.total_columns },
                {
                  label: "Imbalance Ratio",
                  value: `${results.class_imbalance?.imbalance_ratio}:1`,
                  color: results.class_imbalance?.is_imbalanced ? "#ef4444" : "#22c55e"
                },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "16px"
                }}>
                  <p style={{ margin: "0 0 4px", color: "#6b7280", fontSize: "13px" }}>
                    {stat.label}
                  </p>
                  <p style={{ margin: 0, fontSize: "24px", fontWeight: "600", color: stat.color || "inherit" }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Correlation Analysis */}
            {Object.entries(results.correlation_analysis || {}).map(([feature, data], i) => (
              <div key={i} style={{
                background: data.statistically_significant ? "#fef2f2" : "#f0fdf4",
                border: `1px solid ${data.statistically_significant ? "#fecaca" : "#bbf7d0"}`,
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{feature}</strong> ↔ {selectedTarget}
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>
                      {data.interpretation}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>p-value</div>
                    <div style={{ fontWeight: "600", color: data.statistically_significant ? "#dc2626" : "#16a34a" }}>
                      {data.p_value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Distribution */}
        {activeTab === "distribution" && (
          <div>
            <h3>Class Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Demographic distributions */}
            {Object.entries(results.demographic_distribution || {}).map(([feature, groups], i) => (
              <div key={i} style={{ marginTop: "24px" }}>
                <h3>Distribution by {feature}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
                  {Object.entries(groups).map(([group, stats], j) => (
                    <div key={j} style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px"
                    }}>
                      <p style={{ margin: "0 0 4px", fontWeight: "500", fontSize: "14px" }}>{group}</p>
                      <p style={{ margin: "0 0 4px", color: "#6b7280", fontSize: "13px" }}>
                        {stats.count} samples ({stats.percentage}%)
                      </p>
                      <div>
                        {Object.entries(stats.target_distribution || {}).map(([val, pct], k) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                            <span style={{ color: "#6b7280" }}>{val === "1" ? "Approved" : val === "0" ? "Denied" : val}</span>
                            <span style={{ fontWeight: "500" }}>{(pct * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Issues */}
        {activeTab === "issues" && (
          <div>
            {results.bias_summary?.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#22c55e" }}>
                <div style={{ fontSize: "48px" }}>✅</div>
                <h3>No significant bias detected</h3>
                <p style={{ color: "#6b7280" }}>This dataset appears fair across the selected sensitive features.</p>
              </div>
            ) : (
              results.bias_summary?.map((issue, i) => {
                const colors = RISK_COLORS[issue.severity] || RISK_COLORS.Low;
                return (
                  <div key={i} style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "12px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <span style={{ fontWeight: "600", fontSize: "16px" }}>{issue.type}</span>
                        <span style={{
                          marginLeft: "10px",
                          padding: "3px 10px",
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}>
                          {issue.severity}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: "0 0 12px", color: "#374151" }}>{issue.message}</p>
                    <div style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: "10px 14px"
                    }}>
                      <span style={{ color: "#059669", fontSize: "14px" }}>💡 {issue.action}</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Proxy Features */}
            {Object.entries(results.proxy_features || {}).some(([, proxies]) => proxies.length > 0) && (
              <div style={{ marginTop: "24px" }}>
                <h3>🔗 Proxy Features Detected</h3>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                  These features correlate strongly with sensitive attributes
                  and may encode bias indirectly.
                </p>
                {Object.entries(results.proxy_features || {}).map(([sensitive, proxies], i) =>
                  proxies.map((proxy, j) => (
                    <div key={`${i}-${j}`} style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px 18px",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <strong>{proxy.feature}</strong>
                        <span style={{ color: "#6b7280", fontSize: "13px", marginLeft: "8px" }}>
                          correlates with <strong>{sensitive}</strong>
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "13px", color: "#6b7280" }}>
                          correlation: {proxy.correlation}
                        </span>
                        <span style={{
                          padding: "3px 10px",
                          background: proxy.risk === "High" ? "#fee2e2" : "#fef3c7",
                          color: proxy.risk === "High" ? "#991b1b" : "#92400e",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}>
                          {proxy.risk} Risk
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Mitigation */}
        {activeTab === "mitigation" && (
          <div>
            <h3>Apply Mitigation Strategy</h3>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
              Choose a strategy to reduce detected bias. Results are saved
              for before/after comparison.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              {[
                {
                  strategy: "resample",
                  icon: "📈",
                  title: "SMOTE Resampling",
                  desc: "Create synthetic samples to balance class distribution. Best for class imbalance.",
                  when: "Use when: minority class < 40%"
                },
                {
                  strategy: "remove_feature",
                  icon: "✂️",
                  title: "Feature Removal",
                  desc: "Remove sensitive attributes and their proxy correlates from the dataset.",
                  when: "Use when: proxy features detected"
                }
              ].map((s, i) => (
                <div key={i} style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px"
                }}>
                  <div style={{ fontSize: "28px", marginBottom: "12px" }}>{s.icon}</div>
                  <h4 style={{ margin: "0 0 8px" }}>{s.title}</h4>
                  <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 8px" }}>{s.desc}</p>
                  <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 16px" }}>{s.when}</p>
                  <button
                    onClick={() => handleMitigate(s.strategy)}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: loading ? "#9ca3af" : "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: "500"
                    }}
                  >
                    {loading ? "Applying..." : `Apply ${s.title}`}
                  </button>
                </div>
              ))}
            </div>

            {mitResult && (
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "20px"
              }}>
                <h3 style={{ margin: "0 0 12px", color: "#15803d" }}>
                  ✅ Mitigation Applied: {mitResult.strategy}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontWeight: "500", fontSize: "13px", color: "#6b7280" }}>BEFORE</p>
                    {Object.entries(mitResult.before_distribution || {}).map(([k, v], i) => (
                      <p key={i} style={{ margin: "2px 0", fontSize: "14px" }}>
                        Class {k}: <strong>{v}</strong> samples
                      </p>
                    ))}
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontWeight: "500", fontSize: "13px", color: "#6b7280" }}>AFTER</p>
                    {Object.entries(mitResult.after_distribution || {}).map(([k, v], i) => (
                      <p key={i} style={{ margin: "2px 0", fontSize: "14px" }}>
                        Class {k}: <strong>{v}</strong> samples
                      </p>
                    ))}
                  </div>
                </div>
                {mitResult.columns_before && (
                  <p style={{ margin: "12px 0 0", fontSize: "14px" }}>
                    Columns: {mitResult.columns_before} → {mitResult.columns_after}
                    {mitResult.removed_sensitive_features?.length > 0 &&
                      ` (removed: ${mitResult.removed_sensitive_features.join(", ")})`
                    }
                  </p>
                )}
                <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#6b7280" }}>
                  Saved to: {mitResult.output_gcs_uri}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}