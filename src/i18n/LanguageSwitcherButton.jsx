import { useState } from "react";
import { useLanguage } from "./LanguageContext";

export default function LanguageSwitcherButton() {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Change language"
        style={{
          position: "absolute", top: 10, right: 10, zIndex: 30,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(0,0,0,0.28)", color: "#fff", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, cursor: "pointer",
        }}
      >
        🌐
      </button>

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "absolute", inset: 0, background: "rgba(20,20,12,0.45)", zIndex: 60, display: "flex", alignItems: "flex-end" }}
        >
          <div style={{ background: "var(--paper)", width: "100%", borderRadius: "20px 20px 0 0", padding: "18px 18px 24px" }}>
            <div style={{ width: 36, height: 4, background: "var(--line)", borderRadius: 4, margin: "0 auto 16px" }} />
            <h3 style={{ fontFamily: "'Fraunces',serif", margin: "0 0 14px", fontSize: 17, textAlign: "center" }}>🌐 Language / భాష / भाषा</h3>
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  padding: "14px 16px", marginBottom: 10, borderRadius: 12,
                  border: l.code === current.code ? "2px solid var(--pasture)" : "1.5px solid var(--line)",
                  background: l.code === current.code ? "var(--pasture-pale)" : "var(--paper-card)",
                  fontSize: 17, fontWeight: 600, cursor: "pointer", color: "var(--ink)",
                }}
              >
                <span style={{ fontSize: 22 }}>{l.flag}</span> {l.nativeName}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
