import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAlerts } from "./alertsApi";
import { getCurrentPosition, distanceKm } from "../../utils/geo";
import BottomNav from "../../components/BottomNav";

function SevDot({ sev }) {
  const color = sev === "high" ? "var(--alert)" : sev === "medium" ? "var(--marigold)" : "var(--success)";
  return <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: color, marginRight: 6 }} />;
}

export default function AlertsList() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [myLoc, setMyLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  useEffect(() => {
    listAlerts().then((data) => { setAlerts(data); setLoading(false); });
  }, []);

  async function handleFindNearMe() {
    setLocating(true);
    setLocError("");
    try {
      const pos = await getCurrentPosition();
      setMyLoc(pos);
    } catch (err) {
      setLocError(err.message);
    } finally {
      setLocating(false);
    }
  }

  let filtered = alerts.filter((a) => filter === "all" || a.severity === filter);

  if (myLoc) {
    filtered = filtered
      .map((a) => ({ ...a, _dist: distanceKm(myLoc.lat, myLoc.lng, a.lat, a.lng) }))
      .sort((a, b) => {
        if (a._dist === null) return 1;
        if (b._dist === null) return -1;
        return a._dist - b._dist;
      });
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>Disease alerts</h1><div className="sub">Community outbreak awareness</div></div>
      <div className="content">
        <Link to="/alerts/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ marginBottom: 14 }}>+ Report an alert</button>
        </Link>

        <button className={myLoc ? "btn-primary" : "btn-secondary"} style={{ marginBottom: 14 }} onClick={handleFindNearMe} disabled={locating}>
          {locating ? "Finding your location..." : myLoc ? "✓ Sorted by distance from you" : "📍 Show nearest to me"}
        </button>
        {locError && <div className="error-box">{locError}</div>}

        <div className="row" style={{ marginBottom: 14, flexWrap: "wrap" }}>
          {["all", "high", "medium", "low"].map((s) => (
            <button
              key={s}
              className={filter === s ? "btn-primary" : "btn-secondary"}
              style={{ flex: "0 1 auto", padding: "8px 14px", fontSize: 12.5 }}
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading && <p className="meta">Loading alerts...</p>}
        {!loading && filtered.length === 0 && (
          <div className="empty"><h3>No alerts here</h3><p>Nothing reported for this filter yet.</p></div>
        )}
        {filtered.map((a) => (
          <Link key={a.id} to={`/alerts/${a.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card">
              <div className="card-title"><SevDot sev={a.severity} />{a.disease}</div>
              <div className="meta">{a.species} · {a.village}, {a.district}</div>
              {myLoc && a._dist !== null && (
                <span className="pill pill-sky" style={{ marginTop: 6, display: "inline-block" }}>{a._dist.toFixed(1)} km away</span>
              )}
            </div>
          </Link>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
