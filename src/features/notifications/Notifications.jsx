import { useEffect, useState } from "react";
import { listMyNotifications, markNotificationRead, markAllRead } from "./notificationsApi";
import { useAuth } from "../../context/AuthContext";
import BottomNav from "../../components/BottomNav";

function timeAgo(ts) {
  if (!ts?.toDate) return "";
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await listMyNotifications(user.uid);
      setNotifs(data);
    } catch {
      // notifications rule not published yet — show empty state instead of crashing
      setNotifs([]);
    }
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [user.uid]);

  async function handleTap(n) {
    if (!n.read) {
      await markNotificationRead(n.id);
      refresh();
    }
  }

  async function handleMarkAll() {
    await markAllRead(notifs);
    refresh();
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>Notifications</h1><div className="sub">Updates on your bookings</div></div>
      <div className="content">
        {notifs.some((n) => !n.read) && (
          <button className="btn-secondary" style={{ marginBottom: 14 }} onClick={handleMarkAll}>Mark all as read</button>
        )}
        {loading && <p className="meta">Loading...</p>}
        {!loading && notifs.length === 0 && (
          <div className="empty"><h3>No notifications yet</h3><p>You'll see updates here when someone acts on your bookings.</p></div>
        )}
        {notifs.map((n) => (
          <div key={n.id} className="card" onClick={() => handleTap(n)} style={{ background: n.read ? "var(--paper-card)" : "var(--pasture-pale)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--marigold)", marginTop: 6, flexShrink: 0 }} />}
              <div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>{n.message}</p>
                <span className="meta" style={{ fontSize: 11 }}>{timeAgo(n.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
