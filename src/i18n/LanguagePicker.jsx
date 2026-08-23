import { useLanguage } from "./LanguageContext";

export default function LanguagePicker() {
  const { setLang, languages } = useLanguage();

  return (
    <div className="app-shell" style={{ justifyContent: "center" }}>
      <div className="content" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 46, marginBottom: 10 }}>🌐</div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 22 }}>Choose your language</h1>
          <p className="meta">భాష ఎంచుకోండి · भाषा चुनें</p>
        </div>
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            style={{
              display: "flex", alignItems: "center", gap: 14, width: "100%",
              padding: "18px 20px", marginBottom: 12, borderRadius: 14,
              border: "1.5px solid var(--line)", background: "var(--paper-card)",
              fontSize: 20, fontFamily: "'Fraunces',serif", fontWeight: 600, cursor: "pointer",
              color: "var(--ink)",
            }}
          >
            <span style={{ fontSize: 26 }}>{l.flag}</span> {l.nativeName}
          </button>
        ))}
      </div>
    </div>
  );
}
