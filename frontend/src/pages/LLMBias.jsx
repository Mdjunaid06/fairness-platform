import React, { useState } from "react";
import { testLLMBias } from "../services/api";

const PROVIDERS = [
  {
    key: "openai",
    name: "OpenAI",
    icon: "🤖",
    models: ["gpt-4o", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
    color: "#10a37f",
    bg: "#f0fdf4"
  },
  {
    key: "gemini",
    name: "Gemini",
    icon: "✨",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
    color: "#4285F4",
    bg: "#eff6ff"
  },
];

const TEST_SUITES = [
  {
    key: "hiring",
    name: "Hiring Bias",
    icon: "💼",
    desc: "Resume evaluation across names and demographics",
    dimensions: ["Gender", "Race", "Age"]
  },
  {
    key: "medical",
    name: "Medical Bias",
    icon: "🏥",
    desc: "Pain assessment and treatment recommendations",
    dimensions: ["Race", "Gender"]
  },
  {
    key: "financial",
    name: "Financial Bias",
    icon: "🏦",
    desc: "Loan and credit decisions by neighborhood",
    dimensions: ["Socioeconomic", "Race"]
  },
  {
    key: "default",
    name: "Full Battery",
    icon: "⚡",
    desc: "All test suites combined — comprehensive audit",
    dimensions: ["All dimensions"]
  },
];

const SEVERITY_COLORS = {
  None: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  Low: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  Moderate: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  High: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
};

export default function LLMBias() {
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
  const [selectedSuite, setSelectedSuite] = useState("hiring");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedTest, setExpandedTest] = useState(null);
  const [step, setStep] = useState("configure");

  const handleTest = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await testLLMBias({
        provider: selectedProvider,
        modelName: selectedModel,
        testSuite: selectedSuite,
      });
      setResults(res.data.analysis);
      setStep("results");
    } catch (err) {
      alert("Test failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  // ── CONFIGURE STEP ──────────────────────────────────────────
  if (step === "configure") {
    const currentProvider = PROVIDERS.find(p => p.key === selectedProvider);

    return (
      <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#6b7280", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
          LLM BIAS TESTING
        </p>
        <h1 style={{ margin: "0 0 8px" }}>Probe LLM Outputs for Bias</h1>
        <p style={{ color: "#6b7280", margin: "0 0 32px", fontSize: "15px" }}>
          Send identical prompts with different demographic variants.
          Measure if the model responds differently based on gender, race, or age.
        </p>

        {/* Provider Selection */}
        <div style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px"
        }}>
          <h3 style={{ margin: "0 0 16px" }}>1. Select AI Provider</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {PROVIDERS.map(provider => (
              <div
                key={provider.key}
                onClick={() => {
                  setSelectedProvider(provider.key);
                  setSelectedModel(provider.models[0]);
                }}
                style={{
                  padding: "16px",
                  border: `2px solid ${selectedProvider === provider.key ? provider.color : "#e5e7eb"}`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: selectedProvider === provider.key ? provider.bg : "white",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "24px" }}>{provider.icon}</span>
                  <span style={{ fontWeight: "600", fontSize: "16px" }}>{provider.name}</span>
                  {selectedProvider === provider.key && (
                    <span style={{
                      marginLeft: "auto",
                      width: "20px", height: "20px",
                      borderRadius: "50%",
                      background: provider.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "12px"
                    }}>✓</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                  {provider.models.length} models available
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px"
        }}>
          <h3 style={{ margin: "0 0 16px" }}>2. Select Model</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {currentProvider?.models.map(model => (
              <button
                key={model}
                onClick={() => setSelectedModel(model)}
                style={{
                  padding: "8px 16px",
                  border: `2px solid ${selectedModel === model ? currentProvider.color : "#e5e7eb"}`,
                  borderRadius: "8px",
                  background: selectedModel === model ? currentProvider.bg : "white",
                  cursor: "pointer",
                  fontWeight: selectedModel === model ? "500" : "400",
                  color: selectedModel === model ? currentProvider.color : "#374151",
                  fontSize: "14px"
                }}
              >
                {model}
              </button>
            ))}
          </div>
        </div>

        {/* Test Suite Selection */}
        <div style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px"
        }}>
          <h3 style={{ margin: "0 0 16px" }}>3. Select Bias Test Suite</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {TEST_SUITES.map(suite => (
              <div
                key={suite.key}
                onClick={() => setSelectedSuite(suite.key)}
                style={{
                  padding: "16px",
                  border: `2px solid ${selectedSuite === suite.key ? "#2563eb" : "#e5e7eb"}`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: selectedSuite === suite.key ? "#eff6ff" : "white",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "20px" }}>{suite.icon}</span>
                  <span style={{ fontWeight: "500", fontSize: "14px" }}>{suite.name}</span>
                  {selectedSuite === suite.key && (
                    <span style={{
                      marginLeft: "auto",
                      width: "18px", height: "18px",
                      borderRadius: "50%",
                      background: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "11px"
                    }}>✓</span>
                  )}
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#6b7280" }}>
                  {suite.desc}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {suite.dimensions.map((dim, i) => (
                    <span key={i} style={{
                      padding: "2px 8px",
                      background: "#f3f4f6",
                      borderRadius: "4px",
                      fontSize: "11px",
                      color: "#6b7280"
                    }}>
                      {dim}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px"
        }}>
          <h4 style={{ margin: "0 0 12px", fontSize: "14px" }}>⚙️ How it works</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { step: "1", text: "Send identical prompts with different names/demographics" },
              { step: "2", text: "Measure sentiment and tone differences in responses" },
              { step: "3", text: "Flag statistically significant disparities as bias" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{
                  width: "22px", height: "22px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "600",
                  flexShrink: 0
                }}>
                  {s.step}
                </span>
                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: loading ? "#9ca3af" : "#7c3aed",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "500"
          }}
        >
          {loading
            ? "⏳ Running bias tests — this may take 30-60 seconds..."
            : `🧠 Run ${TEST_SUITES.find(s => s.key === selectedSuite)?.name} on ${selectedModel}`
          }
        </button>
      </div>
    );
  }

  // ── RESULTS STEP ────────────────────────────────────────────
  if (step === "results" && results) {
    const score = results.summary?.fairness_score;
    const scoreColor = getScoreColor(score);

    return (
      <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={() => { setStep("configure"); setResults(null); setExpandedTest(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px" }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0 }}>LLM Bias Report</h1>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              {selectedModel} · {TEST_SUITES.find(s => s.key === selectedSuite)?.name}
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
              {results.summary?.label}
            </p>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: "700" }}>
                {results.summary?.total_tests}
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>Tests Run</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: "700", color: results.summary?.biased_tests > 0 ? "#ef4444" : "#22c55e" }}>
                {results.summary?.biased_tests}
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>Biased</div>
            </div>
          </div>
        </div>

        {/* Bias Dimensions */}
        {results.summary?.bias_dimensions_affected?.length > 0 && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px"
          }}>
            <strong style={{ color: "#dc2626" }}>⚠️ Bias detected in:</strong>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
              {results.summary.bias_dimensions_affected.map((dim, i) => (
                <span key={i} style={{
                  padding: "4px 12px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "500"
                }}>
                  {dim}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Test Results — Side by Side */}
        <h3 style={{ marginBottom: "16px" }}>Test Results</h3>
        {results.test_results?.map((test, i) => {
          const isExpanded = expandedTest === i;
          const colors = SEVERITY_COLORS[test.severity] || SEVERITY_COLORS.None;

          return (
            <div key={i} style={{
              background: "white",
              border: `1px solid ${test.is_biased ? "#fecaca" : "#e5e7eb"}`,
              borderRadius: "12px",
              marginBottom: "12px",
              overflow: "hidden"
            }}>
              {/* Header */}
              <div
                onClick={() => setExpandedTest(isExpanded ? null : i)}
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  background: test.is_biased ? "#fff5f5" : "white"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px" }}>
                    {test.is_biased ? "⚠️" : "✅"}
                  </span>
                  <div>
                    <div style={{ fontWeight: "500", fontSize: "15px" }}>
                      {test.test_id?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
                      Bias dimension: {test.bias_dimension?.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Sentiment Disparity</div>
                    <div style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: test.is_biased ? "#dc2626" : "#16a34a"
                    }}>
                      {(test.sentiment_disparity * 100).toFixed(1)}%
                    </div>
                  </div>
                  <span style={{
                    padding: "4px 12px",
                    background: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}>
                    {test.severity}
                  </span>
                  <span style={{ color: "#9ca3af", fontSize: "18px" }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded: Side by Side Responses */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid #f3f4f6", padding: "20px" }}>
                  <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px" }}>
                    Same prompt sent with different demographic details.
                    {test.is_biased
                      ? " ⚠️ Significant difference in responses detected."
                      : " ✅ Responses were consistent across groups."}
                  </p>

                  {/* Sort by sentiment score for clear contrast */}
                  {[...(test.responses || [])]
                    .filter(r => !r.error)
                    .sort((a, b) => (b.sentiment_score || 0) - (a.sentiment_score || 0))
                    .map((response, j) => {
                      const sentimentPct = ((response.sentiment_score || 0) * 100).toFixed(0);
                      const sentimentColor = response.sentiment_score > 0.1 ? "#16a34a"
                        : response.sentiment_score < -0.1 ? "#dc2626"
                        : "#6b7280";

                      return (
                        <div key={j} style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          marginBottom: "12px",
                          overflow: "hidden"
                        }}>
                          {/* Response Header */}
                          <div style={{
                            padding: "10px 16px",
                            background: "#f9fafb",
                            borderBottom: "1px solid #e5e7eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}>
                            <span style={{ fontWeight: "500", fontSize: "14px" }}>
                              Group: <strong>{response.group?.replace(/_/g, " ")}</strong>
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                                Sentiment:
                              </span>
                              <span style={{
                                fontWeight: "600",
                                color: sentimentColor,
                                fontSize: "14px"
                              }}>
                                {sentimentPct > 0 ? "+" : ""}{sentimentPct}%
                              </span>
                            </div>
                          </div>

                          {/* Prompt */}
                          <div style={{ padding: "12px 16px", background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
                            <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              PROMPT SENT
                            </p>
                            <p style={{ margin: 0, fontSize: "13px", color: "#78350f" }}>
                              {response.prompt}
                            </p>
                          </div>

                          {/* Response */}
                          <div style={{ padding: "12px 16px" }}>
                            <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              LLM RESPONSE
                            </p>
                            <p style={{ margin: 0, fontSize: "13px", color: "#374151", lineHeight: "1.6" }}>
                              {response.response || "No response recorded"}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                  {/* Error responses */}
                  {(test.responses || []).filter(r => r.error).map((r, j) => (
                    <div key={`err-${j}`} style={{
                      padding: "12px 16px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      fontSize: "13px",
                      color: "#dc2626"
                    }}>
                      Error for group {r.group}: {r.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Recommendations */}
        {results.recommendations?.length > 0 && (
          <div style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "20px",
            marginTop: "24px"
          }}>
            <h3 style={{ margin: "0 0 12px" }}>💡 Recommendations</h3>
            {results.recommendations.map((rec, i) => (
              <div key={i} style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                marginBottom: "8px"
              }}>
                <span style={{ color: "#2563eb", marginTop: "2px" }}>→</span>
                <p style={{ margin: 0, fontSize: "14px", color: "#1e40af" }}>{rec}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}