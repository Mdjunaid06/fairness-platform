import React, { useState, useEffect } from "react";
import { getReports } from "../services/api";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReports()
      .then((res) => {
        setReports(res.data.reports || []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const typeColors = {
    dataset: "#3b82f6",
    model: "#8b5cf6",
    llm: "#f59e0b",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Analysis Reports</h1>
      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No reports yet. Run an analysis first.</p>
      ) : (
        reports.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              marginBottom: "8px",
              background: "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  padding: "4px 10px",
                  background: typeColors[r.type] || "#6b7280",
                  color: "white",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {r.type?.toUpperCase()}
              </span>
              <span style={{ color: "#374151", fontWeight: "500" }}>Analysis Report</span>
            </div>
            <span
              style={{
                color: (() => {
                    const score = r.result?.overall_score?.score ??
                      r.result?.summary?.fairness_score ?? 0;
                    return score >= 80 ? "#22c55e" : 
                          score >= 60 ? "#f59e0b" : "#ef4444";
                  })(),
                fontWeight: "700",
                fontSize: "18px",
              }}
            >
              {r.result?.overall_score?.score ?? 
                r.result?.summary?.fairness_score ?? 
                "N/A"}/100
            </span>
          </div>
        ))
      )}
    </div>
  );
}
