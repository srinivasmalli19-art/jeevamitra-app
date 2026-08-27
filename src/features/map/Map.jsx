import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

// Purely decorative — a stylized placeholder, not a real map integration.
function MapSvg() {
  const lands = [0, 1, 2, 3, 4];
  const vets = [0, 1, 2, 3];
  const alerts = [0, 1, 2];
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#E4EDDF" />
      <path d="M0 210 Q 100 150 200 200 T 400 170" stroke="#B9D2AC" strokeWidth="20" fill="none" />
      <path d="M60 0 L 90 300 M 320 0 L 350 300" stroke="#D3E2C7" strokeWidth="10" />
      {lands.map((i) => <circle key={`l${i}`} cx={60 + i * 55} cy={90 + (i % 3) * 40} r="7" fill="#1F4025" />)}
      {vets.map((i) => <circle key={`v${i}`} cx={100 + i * 48} cy={210 - (i % 2) * 30} r="7" fill="#3E6E8E" />)}
      {alerts.map((i) => <circle key={`a${i}`} cx={140 + i * 40} cy={60 + (i % 2) * 20} r="7" fill="#B23A2E" />)}
      <circle cx="200" cy="150" r="6" fill="#E4A020" stroke="#241800" strokeWidth="1.5" />
    </svg>
  );
}

export default function Map() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [filter, setFilter] = useState("lands");

  return (
    <div className="app-shell">
      <AppBar variant="top" title={t("map_title")} subtitle={t("map_subtitle")} onMap={() => nav("/map")} />
      <div className="content">
        <h1 className="page-title" style={{ fontFamily: "'Fraunces',serif", fontSize: 24, marginBottom: 14 }}>Map view</h1>
        <div className="map-wrap"><MapSvg /></div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center" }}>{t("map_caption")}</p>
        <div className="chip-row">
          <button className={`chip ${filter === "lands" ? "active" : ""}`} onClick={() => setFilter("lands")}>🌾 Lands</button>
          <button className={`chip ${filter === "vets" ? "active" : ""}`} onClick={() => setFilter("vets")}>🩺 Vets</button>
          <button className={`chip ${filter === "alerts" ? "active" : ""}`} onClick={() => setFilter("alerts")}>🚨 Alerts</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
