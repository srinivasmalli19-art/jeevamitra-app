import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAlert, withdrawAlert } from "./alertsApi";
import { useAuth } from "../../context/AuthContext";
import { directionsUrl } from "../../utils/geo";
import BottomNav from "../../components/BottomNav";

export default function AlertDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
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
    nav("/alerts");
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{alert.disease}</h1><div className="sub">{alert.village}, {alert.district}</div></div>
      <div className="content">
        <div style={{ marginBottom: 10 }}><span className={`pill ${sevPill}`}>{alert.severity[0].toUpperCase() + alert.severity.slice(1)} severity</span></div>
        <div className="card" style={{ cursor: "default" }}>
          <div className="meta">Species: <b>{alert.species}</b></div>
          <div className="meta">Reported by: <b>{alert.reporterName}</b></div>
          <div className="meta">Location: <b>{alert.village}</b></div>
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
