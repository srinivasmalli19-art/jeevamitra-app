import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { listAllLands, listMyLands } from "../lands/landsApi";
import { listMyBookings, listBookingRequestsForOwner } from "../lands/bookingsApi";
import { listVets } from "../vets/vetsApi";
import { listAlerts } from "../alerts/alertsApi";
import { listMyNotifications } from "../notifications/notificationsApi";
import AppBar from "../../components/AppBar";
import BottomSheet from "../../components/BottomSheet";
import BottomNav from "../../components/BottomNav";
import NotificationsSheet from "../notifications/NotificationsSheet";

function severityDot(sev) {
  const cls = sev === "high" ? "sev-high" : sev === "medium" ? "sev-med" : "sev-low";
  return <span className={`severity-dot ${cls}`} style={{ marginRight: 6 }} />;
}

export default function Home() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const [lands, setLands] = useState([]);
  const [myLands, setMyLands] = useState([]);
  const [mine, setMine] = useState([]);
  const [requests, setRequests] = useState([]);
  const [vets, setVets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    Promise.all([
      listAllLands(),
      listMyLands(user.uid),
      listMyBookings(user.uid),
      listBookingRequestsForOwner(user.uid),
      listVets(),
      listAlerts(),
    ]).then(([l, ml, m, r, v, a]) => {
      setLands(l); setMyLands(ml); setMine(m); setRequests(r); setVets(v); setAlerts(a);
      setLoading(false);
    });
    listMyNotifications(user.uid)
      .then((data) => setUnread(data.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
  }, [user.uid]);

  const hr = new Date().getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";

  const cardsAll = {
    nearbyLands: {
      num: lands.filter((l) => (l.bookedRanges || []).length === 0).length,
      lbl: t("home_stat_nearbyLands"), variant: "", onClick: () => nav("/lands"),
    },
    myLands: {
      num: myLands.length,
      lbl: t("home_stat_myLands"), variant: "alt", onClick: () => nav("/lands/mine"),
    },
    activeBookings: {
      num: [...mine, ...requests].filter((b) => b.status === "pending" || b.status === "confirmed").length,
      lbl: t("home_stat_activeBookings"), variant: "", onClick: () => nav("/bookings"),
    },
    nearbyVets: {
      num: vets.length,
      lbl: t("home_stat_nearbyVets"), variant: "alt", onClick: () => nav("/vets"),
    },
    diseaseAlerts: {
      num: alerts.filter((a) => a.severity === "high").length,
      lbl: t("home_stat_diseaseAlerts"), variant: "alert-card", onClick: () => nav("/alerts"),
    },
    bookingRequests: {
      num: requests.filter((b) => b.status === "pending").length,
      lbl: t("home_stat_bookingRequests"), variant: "", onClick: () => nav("/bookings"),
    },
  };
  const orderMap = {
    livestock: ["nearbyLands", "activeBookings", "nearbyVets", "diseaseAlerts"],
    land: ["myLands", "bookingRequests", "nearbyVets", "diseaseAlerts"],
    both: ["myLands", "nearbyLands", "bookingRequests", "activeBookings", "nearbyVets", "diseaseAlerts"],
  };
  const order = orderMap[profile?.profileType] || orderMap.livestock;

  return (
    <div className="app-shell">
      <AppBar
        variant="top"
        title={`${greeting}, ${profile?.name || "there"}`}
        subtitle="JeevaMitra"
        onMap={() => nav("/map")}
        onBell={() => setNotifOpen(true)}
        unread={unread > 0}
      />
      <div className="content">
        {loading && <p className="meta">Loading...</p>}

        {!loading && (
          <div className="stat-grid" style={{ marginBottom: 18 }}>
            {order.map((key) => {
              const c = cardsAll[key];
              return (
                <div key={key} className={`stat-card ${c.variant}`} onClick={c.onClick}>
                  <div className="num">{c.num}</div>
                  <div className="lbl">{c.lbl}</div>
                </div>
              );
            })}
          </div>
        )}

        <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>Quick actions</h3>
        <div className="qa-row">
          <button className="qa-btn" onClick={() => nav("/lands/new")}>
            <span className="qa-icon">🌾</span><span>{t("home_qa_postLand")}</span>
          </button>
          <button className="qa-btn" onClick={() => nav("/lands")}>
            <span className="qa-icon">🔍</span><span>{t("home_qa_findLand")}</span>
          </button>
          <button className="qa-btn" onClick={() => nav("/vets")}>
            <span className="qa-icon">🩺</span><span>{t("home_qa_findVet")}</span>
          </button>
          <button className="qa-btn" onClick={() => nav("/alerts/new")}>
            <span className="qa-icon">📢</span><span>{t("home_qa_reportAlert")}</span>
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 10px" }}>
          <h3 style={{ fontSize: 15, margin: 0 }}>{t("home_yourBookings_title")}</h3>
          <Link to="/bookings" className="see-all" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--pasture)", textDecoration: "none" }}>{t("see_all")}</Link>
        </div>
        {!loading && mine.length === 0 && <p className="meta" style={{ marginBottom: 8 }}>You haven't booked anything yet.</p>}
        {mine.slice(0, 3).map((b) => (
          <div key={b.id} className="card" style={{ cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div className="card-title">{b.landTitle}</div>
                <div className="meta">{b.from} → {b.to}</div>
              </div>
              <span className={`pill ${b.status === "confirmed" ? "pill-green" : b.status === "pending" ? "pill-gold" : "pill-red"}`}>{b.status[0].toUpperCase() + b.status.slice(1)}</span>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 10px" }}>
          <h3 style={{ fontSize: 15, margin: 0 }}>{t("home_yourPostedLands_title")}</h3>
          <Link to="/lands/mine" className="see-all" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--pasture)", textDecoration: "none" }}>{t("see_all")}</Link>
        </div>
        {!loading && myLands.length === 0 && <p className="meta" style={{ marginBottom: 8 }}>You haven't posted any land yet.</p>}
        {myLands.slice(0, 3).map((l) => (
          <Link key={l.id} to={`/lands/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card stub">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div className="card-title">{l.title}</div>
                  <div className="meta">{l.village}, {l.district} · {l.acres} acres</div>
                </div>
                <div className="price">₹{l.price}/{l.unit}</div>
              </div>
            </div>
          </Link>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 10px" }}>
          <h3 style={{ fontSize: 15, margin: 0 }}>{t("home_nearbyLands_title")}</h3>
          <Link to="/lands" className="see-all" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--pasture)", textDecoration: "none" }}>{t("see_all")}</Link>
        </div>
        {lands.slice(0, 3).map((l) => {
          const available = (l.bookedRanges || []).length === 0;
          return (
            <Link key={l.id} to={`/lands/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card stub">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div className="card-title">{l.title}</div>
                    <div className="meta">{l.village}, {l.district}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className={`pill ${available ? "pill-green" : "pill-red"}`}>{available ? "Available" : "Booked"}</span>{" "}
                      <span className="pill pill-gold">{l.acres} acres</span>
                    </div>
                  </div>
                  <div className="price">₹{l.price}/{l.unit}</div>
                </div>
              </div>
            </Link>
          );
        })}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 10px" }}>
          <h3 style={{ fontSize: 15, margin: 0 }}>{t("home_alerts_title")}</h3>
          <Link to="/alerts" className="see-all" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--pasture)", textDecoration: "none" }}>{t("see_all")}</Link>
        </div>
        {alerts.slice(0, 2).map((a) => (
          <Link key={a.id} to={`/alerts/${a.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card stub">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div className="card-title" style={{ display: "flex", alignItems: "center" }}>{severityDot(a.severity)}{a.disease}</div>
                  <div className="meta">{a.species} · {a.village}, {a.district}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <BottomSheet open={notifOpen} onClose={() => setNotifOpen(false)} title={t("notifications_title")}>
        <NotificationsSheet onChanged={() => {
          listMyNotifications(user.uid).then((data) => setUnread(data.filter((n) => !n.read).length)).catch(() => {});
        }} />
      </BottomSheet>
      <BottomNav />
    </div>
  );
}
