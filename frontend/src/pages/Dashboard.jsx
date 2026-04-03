import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Database, Brain, Sparkles, FileText, ArrowRight } from "lucide-react";
import { getReports } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, avgScore: 0, biased: 0 });
  const [reports, setReports] = useState([]);

  useEffect(() => {
    getReports()
      .then((res) => {
        const data = res.data.reports || [];
        setReports(data);
        if (data.length > 0) {
          const scores = data.map((r) => r.result?.overall_score?.score || 0);
          setStats({
            total: data.length,
            avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            biased: data.filter((r) => (r.result?.overall_score?.score || 100) < 60).length,
          });
        }
      })
      .catch(console.error);
  }, []);

  const kpis = [
    { label: "Total analyses", value: stats.total },
    { label: "Avg fairness score", value: `${stats.avgScore}/100` },
    { label: "Flagged reports", value: stats.biased },
  ];

  const actions = [
    { to: "/dataset", icon: Database, label: "Dataset analysis", desc: "Upload CSV and scan for bias" },
    { to: "/model", icon: Brain, label: "Model audit", desc: "Check fairness on your model" },
    { to: "/llm", icon: Sparkles, label: "LLM testing", desc: "Run prompt suites across groups" },
    { to: "/reports", icon: FileText, label: "Reports", desc: "History and scores" },
  ];

  const firstName = user?.displayName?.split(" ")[0] || "Researcher";

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Overview</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">
          Welcome back, {firstName}
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Track fairness across datasets, models, and LLM outputs. Start with an analysis or open a
          recent result below.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{kpi.label}</p>
            <p className="mt-2 font-serif text-3xl font-semibold tabular-nums text-slate-900">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <ActionIcon className="h-5 w-5" />
                </span>
                <span>
                  <span className="font-medium text-slate-900">{action.label}</span>
                  <span className="mt-0.5 block text-sm text-slate-500">{action.desc}</span>
                </span>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
            </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Recent analyses</h2>
        <div className="mt-3 space-y-2">
          {reports.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-500">
              No analyses yet. Run a dataset analysis to see results here.
            </p>
          ) : (
            reports.slice(0, 5).map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span className="font-medium text-slate-800">{r.type?.toUpperCase()} analysis</span>
                <span
                  className={
                    (r.result?.overall_score?.score || 0) >= 80
                      ? "font-semibold text-emerald-600"
                      : "font-semibold text-rose-600"
                  }
                >
                  {r.result?.overall_score?.score ?? "N/A"}/100
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
