import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listMyLandHoldings, deleteLandHolding } from "./landHoldingsApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../i18n/LanguageContext";

export default function LandHoldingsList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { t, tf } = useLanguage();
  const showToast = useToast();
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const data = await listMyLandHoldings(user.uid);
    setHoldings(data);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [user.uid]);

  async function handleDelete(id) {
    if (!confirm(t("ex_remove_entry"))) return;
    await deleteLandHolding(id);
    showToast(t("ex_removed"));
    refresh();
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_my_land_holdings")} onBack={() => nav(-1)} />
      <div className="content">
        <Link to="/land-holdings/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ marginBottom: 14 }}>{t("ex_add_land_record_btn")}</button>
        </Link>
        {loading && <p className="meta">{t("loading")}</p>}
        {!loading && holdings.length === 0 && (
          <div className="empty-state"><div className="glyph">🌾</div><h3>{t("ex_no_holdings_title")}</h3><p>{t("ex_no_holdings_body")}</p></div>
        )}
        {holdings.map((h) => (
          <div key={h.id} className="card" style={{ cursor: "default", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="card-title">{tf("ex_survey_no", { n: h.surveyNumber })}</div>
              <div className="meta">{tf("ex_n_acres", { n: h.extent })}{h.currentCrop ? ` · ${h.currentCrop}` : ""}</div>
            </div>
            <button className="btn-danger" style={{ width: "auto", padding: "8px 14px" }} onClick={() => handleDelete(h.id)}>{t("delete")}</button>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
