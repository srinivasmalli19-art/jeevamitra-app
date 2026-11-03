import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAlert, withdrawAlert } from "./alertsApi";
import { useAuth } from "../../context/AuthContext";
import { directionsUrl } from "../../utils/geo";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../i18n/LanguageContext";
import { speciesLabel, severityLabel } from "../../i18n/labels";

export default function AlertDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();
  const { t, tf } = useLanguage();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlert(id).then((a) => { setAlert(a); setLoading(false); });
  }, [id]);

  if (loading) return <div className="app-shell"><div className="content"><p className="meta">{t("loading")}</p></div></div>;
  if (!alert) return <div className="app-shell"><div className="content"><p>{t("ex_alert_not_found")}</p></div></div>;

  const isReporter = alert.reporterId === user.uid;
  const sevPill = alert.severity === "high" ? "pill-red" : alert.severity === "medium" ? "pill-gold" : "pill-sky";

  async function handleWithdraw() {
    if (!confirm(t("ex_withdraw_confirm"))) return;
    await withdrawAlert(alert.id);
    showToast(t("ex_alert_withdrawn"));
    nav("/alerts");
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_alert_details")} onBack={() => nav(-1)} />
      <div className="content">
        <div style={{ marginBottom: 8 }}><span className={`pill ${sevPill}`}>{tf("ex_n_severity", { s: severityLabel(t, alert.severity) })}</span></div>
        <h1 className="page-title" style={{ fontFamily: "'Fraunces',serif", fontSize: 22, margin: "0 0 4px" }}>{alert.disease}</h1>
        <div className="meta" style={{ marginBottom: 14 }}>{speciesLabel(t, alert.species)} · {alert.village}, {alert.district}</div>
        <div className="card" style={{ cursor: "default" }}>
          <div className="kv-row"><span className="k">{t("ex_reported_by")}</span><span className="v">{alert.reporterName}</span></div>
          <div className="kv-row"><span className="k">{t("ex_species")}</span><span className="v">{speciesLabel(t, alert.species)}</span></div>
          <div className="kv-row"><span className="k">{t("ex_location")}</span><span className="v">{alert.village}</span></div>
        </div>
        {alert.symptoms && (
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-title" style={{ fontSize: 13.5 }}>{t("ex_symptoms_reported")}</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{alert.symptoms}</p>
          </div>
        )}
        {alert.lat && alert.lng && (
          <a href={directionsUrl(alert.lat, alert.lng)} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <button className="btn-secondary" style={{ width: "100%", marginBottom: 10 }}>{t("ex_get_directions")}</button>
          </a>
        )}
        {isReporter && (
          <button className="btn-danger" onClick={handleWithdraw}>{t("ex_withdraw_alert")}</button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
