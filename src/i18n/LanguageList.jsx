export default function LanguageList({ languages, current, onSelect }) {
  return (
    <div>
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => onSelect(l.code)}
          style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "14px 16px", marginBottom: 10, borderRadius: 12,
            border: l.code === current ? "2px solid var(--pasture)" : "1.5px solid var(--line)",
            background: l.code === current ? "var(--pasture-pale)" : "var(--paper-card)",
            fontSize: 17, fontWeight: 600, cursor: "pointer", color: "var(--ink)",
          }}
        >
          <span style={{
            flex: "0 0 auto", width: 30, height: 30, borderRadius: "50%",
            background: "var(--pasture)", color: "var(--paper)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, fontWeight: 700,
          }}>
            {l.code.toUpperCase()}
          </span>
          {l.nativeName}
        </button>
      ))}
    </div>
  );
}
