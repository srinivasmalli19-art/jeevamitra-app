// DEVELOPMENT ONLY. Not part of the production build (vite builds index.html
// only). Renders screens and components with sample data, without Firebase,
// so they can be screenshotted on a phone-sized browser for visual checks.
// Usage: /dev/harness.html?view=<name>&lang=te|hi|en
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import "../index.css";
import { LanguageProvider } from "../i18n/LanguageContext.jsx";
import { ToastProvider } from "../components/ToastContext.jsx";
import { views } from "./harnessViews.jsx";

const params = new URLSearchParams(location.search);
try { localStorage.setItem("jeevamitra_lang", params.get("lang") || "en"); } catch { /* ignore */ }
const View = views[params.get("view")] || (() => <p>Unknown view. Available: {Object.keys(views).join(", ")}</p>);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MemoryRouter>
      <LanguageProvider>
        <ToastProvider>
          <div style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}>
            <View />
          </div>
        </ToastProvider>
      </LanguageProvider>
    </MemoryRouter>
  </StrictMode>,
);
