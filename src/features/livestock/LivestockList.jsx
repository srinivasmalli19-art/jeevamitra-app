import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listMyLivestock, deleteLivestock } from "./livestockApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

const ICONS = { Cattle: "🐄", Buffalo: "🐃", Goat: "🐐", Sheep: "🐑", Other: "🐾" };

export default function LivestockList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const showToast = useToast();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const data = await listMyLivestock(user.uid);
    setAnimals(data);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [user.uid]);

  async function handleDelete(id) {
    if (!confirm("Remove this entry?")) return;
    await deleteLivestock(id);
    showToast("Removed");
    refresh();
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title="My livestock" onBack={() => nav(-1)} />
      <div className="content">
        <Link to="/livestock/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ marginBottom: 14 }}>+ Add animal</button>
        </Link>
        {loading && <p className="meta">Loading...</p>}
        {!loading && animals.length === 0 && (
          <div className="empty-state"><div className="glyph">🐄</div><h3>No livestock added yet</h3><p>Keep a record of the animals you own.</p></div>
        )}
        {animals.map((a) => (
          <div key={a.id} className="card" style={{ cursor: "default", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="card-title">{ICONS[a.type] || "🐾"} {a.type === "Other" ? a.customType || "Other" : a.type}</div>
              <div className="meta">Count: {a.count}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to={`/livestock/${a.id}/edit`} style={{ textDecoration: "none" }}>
                <button className="btn-secondary" style={{ width: "auto", padding: "8px 14px" }}>Edit</button>
              </Link>
              <button className="btn-danger" style={{ width: "auto", padding: "8px 14px" }} onClick={() => handleDelete(a.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
