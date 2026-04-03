import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getRedirectResult } from "firebase/auth";
import "./index.css";
import App from "./App.jsx";
import { auth } from "./services/firebase";

// Complete Google sign-in after signInWithRedirect (full-page flow)
getRedirectResult(auth)
  .catch(() => {})
  .finally(() => {
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
