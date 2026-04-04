import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getReports } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    biased: 0
  });
  const [reports, setReports] = useState([]);

  const getScore = (r) =>
    r.result?.overall_score?.score ??
    r.result?.summary?.fairness_score ??
    null;

  const getScoreColor = (score) => {
    if (score === null) return "#6b7280";
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  useEffect(() => {
    getReports()
      .then((res) => {
        const data = res.data.reports || [];
        setReports(data);
        if (data.length > 0) {
          const scores = data
            .map((r) => getScore(r))
            .filter((s) => s !== null);
          const avg =
            scores.length > 0
              ? Math.round(
                  scores.reduce((a, b) => a + b, 0) / scores.length
                )
              : 0;
          setStats({
            total: data.length,
            avgScore: avg,
            biased: data.filter(
              (r) => (getScore(r) ?? 100) < 60
            ).length,
          });
        }
      })
      .catch(console.error);
  }, []);

  const kpis = [
    { label: "Total Analyses", value: stats.total },
    {
      label: "Avg Fairness Score",
      value: `${stats.avgScore}/100`,
      color: getScoreColor(stats.avgScore)
    },
    {
      label: "Biased Reports",
      value: stats.biased,
      color: stats.biased > 0 ? "#ef4444" : "#22c55e"
    },
  ];

  const actions = [
    {
      to: "/dataset",
      icon: "📊",
      label: "Dataset analysis",
      desc: "Upload CSV and scan for bias"
    },
    {
      to: "/model",
      icon: "🤖",
      label: "Model audit",
      desc: "Check fairness on your model"
    },
    {
      to: "/llm",
      icon: "🧠",
      label: "LLM testing",
      desc: "Run prompt suites across groups"
    },
    {
      to: "/reports",
      icon: "📄",
      label: "Reports",
      desc: "History and scores"
    },
  ];

  return (
    <div style={{
      padding: "32px",
      maxWidth: "1100px",
      margin: "0 auto"
    }}>
      <p style={{
        color: "#6b7280",
        fontSize: "13px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        margin: "0 0 4px"
      }}>
        OVERVIEW
      </p>
      <h1 style={{ margin: "0 0 8px", fontSize: "28px" }}>
        Welcome back, {user?.displayName?.split(" ")[0] || "Researcher"}
      </h1>
      <p style={{ color: "#6b7280", margin: "0 0 32px" }}>
        Track fairness across datasets, models, and LLM outputs.
        Start with an analysis or open a recent result below.
      </p>

      {/* KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        marginBottom: "32px"
      }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb"
          }}>
            <p style={{
              color: "#6b7280",
              margin: "0 0 8px",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              {kpi.label}
            </p>
            <p style={{
              fontSize: "32px",
              fontWeight: "600",
              margin: 0,
              color: kpi.color || "inherit"
            }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>
        Quick actions
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "16px",
        marginBottom: "32px"
      }}>
        {actions.map((action, i) => (
          <Link key={i} to={action.to} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            textDecoration: "none",
            color: "inherit",
            background: "white"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <span style={{ fontSize: "20px" }}>{action.icon}</span>
              <div>
                <p style={{
                  margin: 0,
                  fontWeight: "500",
                  fontSize: "15px"
                }}>
                  {action.label}
                </p>
                <p style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "13px"
                }}>
                  {action.desc}
                </p>
              </div>
            </div>
            <span style={{ color: "#6b7280" }}>→</span>
          </Link>
        ))}
      </div>

      {/* Recent Analyses */}
      <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>
        Recent analyses
      </h2>
      <div style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden"
      }}>
        {reports.length === 0 ? (
          <p style={{
            color: "#6b7280",
            padding: "24px",
            textAlign: "center",
            margin: 0
          }}>
            No analyses yet. Run a dataset analysis to see results here.
          </p>
        ) : (
          reports.slice(0, 5).map((r, i) => {
            const score = getScore(r);
            return (
              <div key={i} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: i < Math.min(reports.length, 5) - 1
                  ? "1px solid #f3f4f6"
                  : "none"
              }}>
                <span style={{
                  fontWeight: "500",
                  fontSize: "15px"
                }}>
                  {r.type?.toUpperCase()} analysis
                </span>
                <span style={{
                  color: getScoreColor(score),
                  fontWeight: "600",
                  fontSize: "15px"
                }}>
                  {score !== null ? `${score}/100` : "N/A"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}