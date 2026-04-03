/** User-friendly copy for common Firebase Auth errors */
export function messageForFirebaseAuthError(err) {
  const code = err?.code;
  const map = {
    "auth/configuration-not-found":
      "Firebase Authentication is not set up for this project. In Firebase Console: open Authentication → Get started, then Sign-in method → enable Google.",
    "auth/operation-not-allowed":
      "Google sign-in is disabled. In Firebase Console → Authentication → Sign-in method → enable Google.",
    "auth/unauthorized-domain":
      "This site’s domain is not allowed. In Firebase Console → Authentication → Settings → Authorized domains, add localhost (and your production domain).",
    "auth/popup-blocked":
      "The browser blocked the sign-in popup. Allow popups for this site or try again.",
    "auth/network-request-failed":
      "Network error. Check your connection and try again.",
    "auth/internal-error":
      "Firebase returned an internal error. Confirm Google sign-in is enabled and billing/API access is OK for your project.",
  };
  return map[code] || err?.message || "Sign-in failed. Please try again.";
}
