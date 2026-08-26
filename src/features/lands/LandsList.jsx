import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAllLands } from "./landsApi";
import { getCurrentPosition, distanceKm } from "../../utils/geo";
import BottomNav from "../../components/BottomNav";

export default function LandsList() {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [myLoc, setMyLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  useEffect(() => {
    listAllLands().then((data) => { setLands(data); setLoading(false); });
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

  let filtered = lands.filter((l) => {
    const s = q.toLowerCase();
    return !s || l.title.toLowerCase().includes(s) || l.village.toLowerCase().includes(s) || l.district.toLowerCase().includes(s);
  });

  // Attach a live distance to each land if we know the user's location.
  if (myLoc) {
    filtered = filtered
      .map((l) => ({ ...l, _dist: distanceKm(myLoc.lat, myLoc.lng, l.lat, l.lng) }))
      .sort((a, b) => {
        if (a._dist === null) return 1;
        if (b._dist === null) return -1;
        return a._dist - b._dist;
      });
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>Lands</h1><div className="sub">Marketplace</div></div>
      <div className="content">
        <div className="field">
          <input placeholder="Search village, district, or title" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <button className={myLoc ? "btn-primary" : "btn-secondary"} style={{ marginBottom: 12 }} onClick={handleFindNearMe} disabled={locating}>
          {locating ? "Finding your location..." : myLoc ? "✓ Sorted by distance from you" : "📍 Find lands near me"}
        </button>
        {locError && <div className="error-box">{locError}</div>}

        {loading && <p className="meta">Loading lands from your database...</p>}
        {!loading && filtered.length === 0 && (
          <div className="empty">
            <h3>No lands listed yet</h3>
            <p>Be the first — post a grazing or fodder land from "My Lands".</p>
          </div>
        )}
        {filtered.map((l) => {
          const available = (l.bookedRanges || []).length === 0;
          return (
            <Link key={l.id} to={`/lands/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card">
                {l.photoUrl ? (
                  <img src={l.photoUrl} alt={l.title} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, marginBottom: 10 }} />
                ) : (
                  <div className="land-thumb-fallback" style={{ width: "100%", height: 90, marginBottom: 10 }}>🌾</div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div className="card-title">{l.title}</div>
                    <div className="meta">{l.village}, {l.district}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className={`pill ${available ? "pill-green" : "pill-red"}`}>{available ? "Available" : "Has bookings"}</span>{" "}
                      <span className="pill pill-gold">{l.acres} acres</span>{" "}
                      {myLoc && l._dist !== null && <span className="pill pill-sky">{l._dist.toFixed(1)} km away</span>}
                    </div>
                  </div>
                  <div className="price">₹{l.price}/{l.unit}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
