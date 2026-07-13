import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { resolveTokenKey } from "./lib/tokenKey";
import "./index.css";
import App from "./App";

// Single, path-aware auth token getter — set ONCE before render.
// /brands uses the brand token; landing + /earn use the reviewer token.
// This replaces the per-app module-load setters, which conflicted once merged.
setAuthTokenGetter(() => localStorage.getItem(resolveTokenKey(window.location.pathname)));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
