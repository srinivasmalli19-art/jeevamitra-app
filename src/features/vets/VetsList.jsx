import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listVets } from "./vetsApi";
import { useAuth } from "../../context/AuthContext";
import { getCurrentPosition, distanceKm } from "../../utils/geo";
import Avatar from "../../components/Avatar";
import BottomNav from "../../components/BottomNav";

export default function VetsList() {
  const { isAdmin } = useAuth();
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [designation, setDesignation] = useState("all");
  const [sortByRating, setSortByRating] = useState(false);
  const [myLoc, setMyLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  useEffect(() => {
    listVets().then((data) => { setVets(data); setLoading(false); });
  }, []);

  async function handleFindNearMe() {
    setLocating(true);
    setLocError("");
    try {
      const pos = await getCurrentPosition();
      setMyLoc(pos);
      setSortByRating(false); // distance takes priority when both are on
    } catch (err) {
      setLocError(err.message);
    } finally {
      setLocating(false);
    }
  }

  let filtered = vets.filter((v) => {
    const s = q.toLowerCase();
    const matchQ = !s || v.name.toLowerCase().includes(s) || v.village.toLowerCase().includes(s) || v.district.toLowerCase().includes(s);
    const matchSector = sector === "all" || v.sector === sector;
    const matchDesig = designation === "all" || v.designation === designation;
    return matchQ && matchSector && matchDesig;
  });

  if (myLoc) {
    filtered = filtered
      .map((v) => ({ ...v, _dist: distanceKm(myLoc.lat, myLoc.lng, v.lat, v.lng) }))
      .sort((a, b) => {
        if (a._dist === null) return 1;
        if (b._dist === null) return -1;
        return a._dist - b._dist;
      });
  } else if (sortByRating) {
    filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>Vets</h1><div className="sub">Veterinary directory</div></div>
      <div className="content">
        {isAdmin && (
          <Link to="/vets/new" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ marginBottom: 14 }}>+ Add vet (admin)</button>
          </Link>
        )}

        <div className="field">
          <input placeholder="Search by name, village, or district" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <button className={myLoc ? "btn-primary" : "btn-secondary"} style={{ marginBottom: 14 }} onClick={handleFindNearMe} disabled={locating}>
          {locating ? "Finding your location..." : myLoc ? "✓ Sorted by distance from you" : "📍 Find vets near me"}
        </button>
        {locError && <div className="error-box">{locError}</div>}

        <p className="meta" style={{ margin: "0 0 6px" }}>Sector</p>
        <div className="chip-row" style={{ marginBottom: 10 }}>
          {["all", "Government", "Private"].map((s) => (
            <button key={s} className={`chip ${sector === s ? "active" : ""}`} onClick={() => setSector(s)}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        <p className="meta" style={{ margin: "0 0 6px" }}>Designation</p>
        <div className="chip-row" style={{ marginBottom: 10 }}>
          {["all", "Veterinary Officer", "Veterinary Assistant"].map((d) => (
            <button key={d} className={`chip ${designation === d ? "active" : ""}`} onClick={() => setDesignation(d)}>
              {d === "all" ? "All" : d}
            </button>
          ))}
        </div>

        {!myLoc && (
          <div className="chip-row" style={{ marginBottom: 14 }}>
            <button className={`chip ${sortByRating ? "active" : ""}`} onClick={() => setSortByRating((v) => !v)}>
              Sort by rating {sortByRating ? "✓" : ""}
            </button>
          </div>
        )}

        {loading && <p className="meta">Loading vets...</p>}
        {!loading && filtered.length === 0 && (
          <div className="empty"><h3>No vets match</h3><p>Try clearing filters, or check back later — the directory is maintained by JeevaMitra admins.</p></div>
        )}
        {filtered.map((v) => (
          <Link key={v.id} to={`/vets/${v.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Avatar name={v.name} photoUrl={v.photoUrl} size={54} />
              <div>
                <div className="card-title">{v.name}</div>
                <div className="meta">{v.designation} · {v.experienceYears} yrs exp</div>
                <div style={{ marginTop: 6 }}>
                  <span className={`pill ${v.sector === "Government" ? "pill-sky" : "pill-gold"}`}>{v.sector}</span>{" "}
                  {v.rating && <span className="pill pill-green">★ {v.rating}</span>}{" "}
                  {myLoc && v._dist !== null && <span className="pill pill-sky">{v._dist.toFixed(1)} km away</span>}{" "}
                  <span className="meta" style={{ display: "inline" }}>{v.village}, {v.district}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
