import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listAllLands, listMyLands } from "./landsApi";
import { getCurrentPosition, distanceKm } from "../../utils/geo";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { listMyNotifications } from "../notifications/notificationsApi";
import AppBar from "../../components/AppBar";
import BottomSheet from "../../components/BottomSheet";
import BottomNav from "../../components/BottomNav";
import NotificationsSheet from "../notifications/NotificationsSheet";

function DiscoverTab() {
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
    <>
      <div className="searchbar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        <input placeholder="Search village, district, or title" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <button className={myLoc ? "btn-primary" : "btn-secondary"} style={{ marginBottom: 12 }} onClick={handleFindNearMe} disabled={locating}>
        {locating ? "Finding your location..." : myLoc ? "✓ Sorted by distance from you" : "📍 Find lands near me"}
      </button>
      {locError && <div className="error-box">{locError}</div>}

      {loading && <p className="meta">Loading lands from your database...</p>}
      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="glyph">🌾</div>
          <h3>No lands listed yet</h3>
          <p>Be the first — post a grazing or fodder land from "My lands".</p>
        </div>
      )}
      {filtered.map((l) => {
        const available = (l.bookedRanges || []).length === 0;
        return (
          <Link key={l.id} to={`/lands/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card stub">
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
    </>
  );
}

function MyLandsTab() {
  const { user } = useAuth();
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyLands(user.uid).then((data) => { setLands(data); setLoading(false); });
  }, [user.uid]);

  return (
    <>
      <Link to="/lands/new" style={{ textDecoration: "none" }}>
        <button className="btn-primary" style={{ marginBottom: 14 }}>+ Post new land</button>
      </Link>
      {loading && <p className="meta">Loading...</p>}
      {!loading && lands.length === 0 && (
        <div className="empty-state">
          <div className="glyph">🌾</div>
          <h3>No lands posted yet</h3>
          <p>List your grazing or fodder land so livestock owners nearby can find it.</p>
        </div>
      )}
      {lands.map((l) => (
        <Link key={l.id} to={`/lands/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card stub" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {l.photoUrl ? (
              <img src={l.photoUrl} alt={l.title} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
            ) : (
              <div className="land-thumb-fallback" style={{ width: 64, height: 64 }}>🌾</div>
            )}
            <div>
              <div className="card-title">{l.title}</div>
              <div className="meta">{l.village}, {l.district} · {l.acres} acres</div>
              <div className="price" style={{ marginTop: 6 }}>₹{l.price}/{l.unit}</div>
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}

export default function Lands({ initialTab = "discover" }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const [tab, setTab] = useState(initialTab);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    listMyNotifications(user.uid)
      .then((data) => setUnread(data.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
  }, [user.uid]);

  return (
    <div className="app-shell">
      <AppBar
        variant="top"
        title={t("lands_title")}
        subtitle={t("lands_subtitle")}
        onMap={() => nav("/map")}
        onBell={() => setNotifOpen(true)}
        unread={unread > 0}
      />
      <div className="content">
        <div className="tabbar">
          <button className={`tabbtn ${tab === "discover" ? "active" : ""}`} onClick={() => setTab("discover")}>Discover</button>
          <button className={`tabbtn ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>My lands</button>
        </div>
        {tab === "discover" ? <DiscoverTab /> : <MyLandsTab />}
      </div>
      <BottomSheet open={notifOpen} onClose={() => setNotifOpen(false)} title={t("notifications_title")}>
        <NotificationsSheet />
      </BottomSheet>
      <BottomNav />
    </div>
  );
}
