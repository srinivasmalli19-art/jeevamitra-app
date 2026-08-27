import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listAlerts } from "./alertsApi";
import { getCurrentPosition, distanceKm } from "../../utils/geo";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { listMyNotifications } from "../notifications/notificationsApi";
import AppBar from "../../components/AppBar";
import BottomSheet from "../../components/BottomSheet";
import BottomNav from "../../components/BottomNav";
import NotificationsSheet from "../notifications/NotificationsSheet";

export default function AlertsList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [myLoc, setMyLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    listAlerts().then((data) => { setAlerts(data); setLoading(false); });
  }, []);
  useEffect(() => {
    listMyNotifications(user.uid)
      .then((data) => setUnread(data.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
  }, [user.uid]);

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
      <AppBar
        variant="top"
        title={t("alerts_title")}
        subtitle="Community outbreak awareness"
        onMap={() => nav("/map")}
        onBell={() => setNotifOpen(true)}
        unread={unread > 0}
      />
      <div className="content">
        <Link to="/alerts/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ marginBottom: 14 }}>+ {t("report_alert")}</button>
        </Link>

        <button className={myLoc ? "btn-primary" : "btn-secondary"} style={{ marginBottom: 14 }} onClick={handleFindNearMe} disabled={locating}>
          {locating ? "Finding your location..." : myLoc ? "✓ Sorted by distance from you" : "📍 Show nearest to me"}
        </button>
        {locError && <div className="error-box">{locError}</div>}

        <div className="chip-row" style={{ marginBottom: 14 }}>
          {["all", "high", "medium", "low"].map((s) => (
            <button
              key={s}
              className={`chip ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading && <p className="meta">Loading alerts...</p>}
        {!loading && filtered.length === 0 && (
          <div className="empty-state"><div className="glyph">🚨</div><h3>No alerts here</h3><p>Nothing reported for this filter yet.</p></div>
        )}
        {filtered.map((a) => (
          <Link key={a.id} to={`/alerts/${a.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card stub">
              <div className="card-title" style={{ display: "flex", alignItems: "center" }}>
                <span className={`severity-dot sev-${a.severity === "medium" ? "med" : a.severity}`} style={{ marginRight: 6 }} />
                {a.disease}
              </div>
              <div className="meta">{a.species} · {a.village}, {a.district}</div>
              {myLoc && a._dist !== null && (
                <span className="pill pill-sky" style={{ marginTop: 6, display: "inline-block" }}>{a._dist.toFixed(1)} km away</span>
              )}
            </div>
          </Link>
        ))}
      </div>
      <BottomSheet open={notifOpen} onClose={() => setNotifOpen(false)} title={t("notifications_title")}>
        <NotificationsSheet />
      </BottomSheet>
      <BottomNav />
    </div>
  );
}
