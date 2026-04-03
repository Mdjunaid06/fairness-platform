import React from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  Database,
  Brain,
  Sparkles,
  FileText,
  LogOut,
  Scale,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DatasetAnalysis from "./pages/DatasetAnalysis";
import LLMBias from "./pages/LLMBias";
import Reports from "./pages/Reports";
import ModelAudit from "./pages/ModelAudit";
import { logout } from "./services/firebase";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <p className="text-sm">Loading session…</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dataset", label: "Dataset analysis", icon: Database },
  { to: "/model", label: "Model audit", icon: Brain },
  { to: "/llm", label: "LLM testing", icon: Sparkles },
  { to: "/reports", label: "Reports", icon: FileText },
];

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Scale className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <p className="font-serif text-sm font-semibold tracking-tight text-slate-900">
              Fairness
            </p>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              Platform
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {navItems.map((item) => {
            const NavIcon = item.icon;
            return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")
              }
            >
              <NavIcon className="h-4 w-4 shrink-0 opacity-80" />
              {item.label}
            </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-h-screen flex-1 pl-64">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "text-sm",
          duration: 4000,
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dataset"
          element={
            <PrivateRoute>
              <Layout>
                <DatasetAnalysis />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/model"
          element={
            <PrivateRoute>
              <Layout>
                <ModelAudit />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/llm"
          element={
            <PrivateRoute>
              <Layout>
                <LLMBias />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Layout>
                <Reports />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
