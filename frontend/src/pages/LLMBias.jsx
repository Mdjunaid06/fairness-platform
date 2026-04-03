import React, { useState } from "react";
import { testLLMBias } from "../services/api";

export default function LLMBias() {
  const [provider, setProvider] = useState("openai");
  const [modelName, setModelName] = useState("gpt-4");
  const [testSuite, setTestSuite] = useState("hiring");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await testLLMBias({ provider, modelName, testSuite });
      setResults(res.data.analysis);
    } catch (err) {
      alert("Test failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    background: "white",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>LLM Bias Testing</h1>
      <p style={{ color: "#6b7280" }}>
        Run automated bias tests against any LLM provider using demographic variant prompts.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
          margin: "24px 0",
        }}
      >
        <select value={provider} onChange={(e) => setProvider(e.target.value)} style={selectStyle}>
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini (Vertex AI)</option>
        </select>
        <input
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="Model (e.g. gpt-4)"
          style={selectStyle}
        />
        <select value={testSuite} onChange={(e) => setTestSuite(e.target.value)} style={selectStyle}>
          <option value="default">All Suites</option>
          <option value="hiring">Hiring Bias</option>
          <option value="medical">Medical Bias</option>
          <option value="financial">Financial Bias</option>
        </select>
      </div>

      <button
        onClick={handleTest}
        disabled={loading}
        style={{
          padding: "12px 28px",
          background: loading ? "#9ca3af" : "#7c3aed",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "15px",
          fontWeight: "500",
        }}
      >
        {loading ? "Running Tests..." : "🧠 Run Bias Tests"}
      </button>

      {results && (
        <div style={{ marginTop: "32px" }}>
          <div
            style={{
              padding: "24px",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              marginBottom: "24px",
              background: "white",
            }}
          >
            <h2 style={{ margin: "0 0 8px" }}>
              Fairness Score:{" "}
              <span
                style={{
                  color:
                    results.summary?.fairness_score >= 80
                      ? "#22c55e"
                      : results.summary?.fairness_score >= 60
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              >
                {results.summary?.fairness_score}/100
              </span>
            </h2>
            <p style={{ margin: "4px 0", color: "#6b7280" }}>
              Tests run: {results.summary?.total_tests} | Biased: {results.summary?.biased_tests} | Label:{" "}
              <strong>{results.summary?.label}</strong>
            </p>
          </div>

          <h3>Test Results</h3>
          {results.test_results?.map((test, i) => (
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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{test.test_id}</strong>
                <span
                  style={{
                    color: test.is_biased ? "#ef4444" : "#22c55e",
                    fontWeight: "500",
                  }}
                >
                  {test.is_biased ? "⚠️ Bias Detected" : "✅ Fair"}
                </span>
              </div>
              <p style={{ margin: "4px 0", color: "#6b7280", fontSize: "13px" }}>
                Dimension: {test.bias_dimension} | Severity: {test.severity} | Disparity: {test.sentiment_disparity}
              </p>
            </div>
          ))}

          {results.recommendations?.length > 0 && (
            <div
              style={{
                padding: "16px",
                background: "#eff6ff",
                borderRadius: "8px",
                border: "1px solid #bfdbfe",
              }}
            >
              <h3 style={{ margin: "0 0 8px" }}>💡 Recommendations</h3>
              {results.recommendations.map((rec, i) => (
                <p key={i} style={{ margin: "4px 0", fontSize: "14px" }}>
                  • {rec}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
