import React, { useState } from "react";
import { signInWithGoogle } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { messageForFirebaseAuthError } from "../utils/firebaseErrors";

export default function Login() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setBusy(true);
    try {
      const cred = await signInWithGoogle();
      if (cred?.user) {
        toast.success("Signed in");
        navigate("/");
      }
      // null = redirect flow started; page will reload after Google
    } catch (err) {
      console.error("Login failed:", err);
      toast.error(messageForFirebaseAuthError(err), { duration: 8000 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(45, 212, 191, 0.25), transparent 50%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99, 102, 241, 0.2), transparent 50%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(14, 165, 233, 0.15), transparent 55%)",
        }}
      />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="mb-10 max-w-md text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400/90">
            Fairness & bias
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Fairness Platform
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Detect bias in datasets, audit models, and test LLM outputs—then act on
            clear, explainable results.
          </p>
        </div>

        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-md">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white">Sign in</h2>
              <p className="mt-1 text-sm text-slate-400">
                Use your Google account. We only use it to identify your session.
              </p>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={handleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {busy ? "Opening Google…" : "Continue with Google"}
            </button>

            <p className="text-center text-xs leading-relaxed text-slate-500">
              If sign-in fails with “configuration not found”, open Firebase Console →
              Authentication → Get started, then enable the Google provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
