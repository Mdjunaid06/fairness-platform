import React, { useState } from "react";
import { auditModel } from "../services/api";
import toast from "react-hot-toast";

/**
 * Placeholder UI wired to POST /api/model/audit — extend when backend shape is fixed.
 */
export default function ModelAudit() {
  const [gcsUri, setGcsUri] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [sensitiveFeatures, setSensitiveFeatures] = useState("");
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    if (!gcsUri.trim()) {
      toast.error("Enter a GCS URI or path your backend expects.");
      return;
    }
    setLoading(true);
    try {
      const res = await auditModel({
        gcsUri: gcsUri.trim(),
        targetColumn: targetColumn.trim() || undefined,
        sensitiveFeatures: sensitiveFeatures
          ? sensitiveFeatures.split(",").map((s) => s.trim())
          : undefined,
      });
      toast.success("Audit request sent.");
      console.log(res.data);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Audit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
          Model fairness audit
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Point at your training data or model artifact (fields depend on your backend). Adjust
          when backend contract is finalized.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-1">
          <label className="block text-sm font-medium text-slate-700">
            GCS URI or resource path
            <input
              value={gcsUri}
              onChange={(e) => setGcsUri(e.target.value)}
              placeholder="gs://bucket/path/to/model-or-data"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600/20 focus:border-teal-500 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Target column (optional)
            <input
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              placeholder="e.g. label"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600/20 focus:border-teal-500 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Sensitive features (comma-separated, optional)
            <input
              value={sensitiveFeatures}
              onChange={(e) => setSensitiveFeatures(e.target.value)}
              placeholder="gender, race, age"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600/20 focus:border-teal-500 focus:ring-2"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={runAudit}
          className="mt-6 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Running…" : "Run audit"}
        </button>
      </div>
    </div>
  );
}
