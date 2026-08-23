import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyLands } from "./landsApi";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../../components/BottomNav";

export default function MyLands() {
  const { user } = useAuth();
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyLands(user.uid).then((data) => { setLands(data); setLoading(false); });
  }, [user.uid]);

  return (
    <div className="app-shell">
      <div className="topbar"><h1>My Lands</h1><div className="sub">Your listings</div></div>
      <div className="content">
        <Link to="/lands/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ marginBottom: 14 }}>+ Post new land</button>
        </Link>
        {loading && <p className="meta">Loading...</p>}
        {!loading && lands.length === 0 && (
          <div className="empty"><h3>No lands posted yet</h3><p>List your grazing or fodder land so livestock owners nearby can find it.</p></div>
        )}
        {lands.map((l) => (
          <Link key={l.id} to={`/lands/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card">
              <div className="card-title">{l.title}</div>
              <div className="meta">{l.village}, {l.district} · {l.acres} acres</div>
              <div className="price" style={{ marginTop: 6 }}>₹{l.price}/{l.unit}</div>
            </div>
          </Link>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
