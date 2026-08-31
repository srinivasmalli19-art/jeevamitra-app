import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listMyLandHoldings, deleteLandHolding } from "./landHoldingsApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

export default function LandHoldingsList() {
  const { user } = useAuth();
  const nav = useNavigate();
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
    if (!confirm("Remove this entry?")) return;
    await deleteLandHolding(id);
    showToast("Removed");
    refresh();
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title="My land holdings" onBack={() => nav(-1)} />
      <div className="content">
        <Link to="/land-holdings/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ marginBottom: 14 }}>+ Add land record</button>
        </Link>
        {loading && <p className="meta">Loading...</p>}
        {!loading && holdings.length === 0 && (
          <div className="empty-state"><div className="glyph">🌾</div><h3>No land holdings recorded yet</h3><p>Keep a record of land you own and farm.</p></div>
        )}
        {holdings.map((h) => (
          <div key={h.id} className="card" style={{ cursor: "default", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="card-title">Survey No. {h.surveyNumber}</div>
              <div className="meta">{h.extent} acres{h.currentCrop ? ` · ${h.currentCrop}` : ""}</div>
            </div>
            <button className="btn-danger" style={{ width: "auto", padding: "8px 14px" }} onClick={() => handleDelete(h.id)}>Delete</button>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
