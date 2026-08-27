import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAlert, withdrawAlert } from "./alertsApi";
import { useAuth } from "../../context/AuthContext";
import { directionsUrl } from "../../utils/geo";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

export default function AlertDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlert(id).then((a) => { setAlert(a); setLoading(false); });
  }, [id]);

  if (loading) return <div className="app-shell"><div className="content"><p className="meta">Loading...</p></div></div>;
  if (!alert) return <div className="app-shell"><div className="content"><p>Alert not found.</p></div></div>;

  const isReporter = alert.reporterId === user.uid;
  const sevPill = alert.severity === "high" ? "pill-red" : alert.severity === "medium" ? "pill-gold" : "pill-sky";

  async function handleWithdraw() {
    if (!confirm("Withdraw this alert? It will no longer show to others.")) return;
    await withdrawAlert(alert.id);
    showToast("Alert withdrawn");
    nav("/alerts");
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title="Alert details" onBack={() => nav(-1)} />
      <div className="content">
        <div style={{ marginBottom: 8 }}><span className={`pill ${sevPill}`}>{alert.severity[0].toUpperCase() + alert.severity.slice(1)} severity</span></div>
        <h1 className="page-title" style={{ fontFamily: "'Fraunces',serif", fontSize: 22, margin: "0 0 4px" }}>{alert.disease}</h1>
        <div className="meta" style={{ marginBottom: 14 }}>{alert.species} · {alert.village}, {alert.district}</div>
        <div className="card" style={{ cursor: "default" }}>
          <div className="kv-row"><span className="k">Reported by</span><span className="v">{alert.reporterName}</span></div>
          <div className="kv-row"><span className="k">Species</span><span className="v">{alert.species}</span></div>
          <div className="kv-row"><span className="k">Location</span><span className="v">{alert.village}</span></div>
        </div>
        {alert.symptoms && (
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-title" style={{ fontSize: 13.5 }}>Symptoms reported</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{alert.symptoms}</p>
          </div>
        )}
        {alert.lat && alert.lng && (
          <a href={directionsUrl(alert.lat, alert.lng)} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <button className="btn-secondary" style={{ width: "100%", marginBottom: 10 }}>📍 Get directions</button>
          </a>
        )}
        {isReporter && (
          <button className="btn-danger" onClick={handleWithdraw}>Withdraw alert</button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
