import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listAllLands, listMyLands } from "./landsApi";
import { getCurrentPosition, distanceKm } from "../../utils/geo";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { unitLabel, errText } from "../../i18n/labels";
import { listMyNotifications } from "../notifications/notificationsApi";
import AppBar from "../../components/AppBar";
import BottomSheet from "../../components/BottomSheet";
import BottomNav from "../../components/BottomNav";
import NotificationsSheet from "../notifications/NotificationsSheet";

function DiscoverTab() {
  const { t, tf } = useLanguage();
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
      setLocError(errText(t, err));
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
        <input placeholder={t("ex_search_lands")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <button className={myLoc ? "btn-primary" : "btn-secondary"} style={{ marginBottom: 12 }} onClick={handleFindNearMe} disabled={locating}>
        {locating ? t("ex_finding_location") : myLoc ? t("ex_sorted_by_distance") : t("ex_find_lands_near")}
      </button>
      {locError && <div className="error-box">{locError}</div>}

      {loading && <p className="meta">{t("ex_loading_lands")}</p>}
      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="glyph">🌾</div>
          <h3>{t("ex_no_lands_listed")}</h3>
          <p>{t("ex_be_first")}</p>
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
                    <span className={`pill ${available ? "pill-green" : "pill-red"}`}>{available ? t("available") : t("ex_has_bookings")}</span>{" "}
                    <span className="pill pill-gold">{tf("ex_n_acres", { n: l.acres })}</span>{" "}
                    {myLoc && l._dist !== null && <span className="pill pill-sky">{tf("ex_km_away", { n: l._dist.toFixed(1) })}</span>}
                  </div>
                </div>
                <div className="price">₹{l.price}/{unitLabel(t, l.unit)}</div>
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}

function MyLandsTab() {
  const { t, tf } = useLanguage();
  const { user } = useAuth();
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyLands(user.uid).then((data) => { setLands(data); setLoading(false); });
  }, [user.uid]);

  return (
    <>
      <Link to="/lands/new" style={{ textDecoration: "none" }}>
        <button className="btn-primary" style={{ marginBottom: 14 }}>{t("ex_post_new_land")}</button>
      </Link>
      {loading && <p className="meta">{t("loading")}</p>}
      {!loading && lands.length === 0 && (
        <div className="empty-state">
          <div className="glyph">🌾</div>
          <h3>{t("ex_no_lands_posted_title")}</h3>
          <p>{t("ex_list_your_land")}</p>
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
              <div className="meta">{l.village}, {l.district} · {tf("ex_n_acres", { n: l.acres })}</div>
              <div className="price" style={{ marginTop: 6 }}>₹{l.price}/{unitLabel(t, l.unit)}</div>
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
          <button className={`tabbtn ${tab === "discover" ? "active" : ""}`} onClick={() => setTab("discover")}>{t("ex_discover")}</button>
          <button className={`tabbtn ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>{t("ex_my_lands")}</button>
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
