import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listMyNotifications } from "../notifications/notificationsApi";
import BottomNav from "../../components/BottomNav";

const meta = {
  livestock: { emoji: "🐄", label: "Livestock Owner" },
  land: { emoji: "🌾", label: "Fodder Land Provider" },
  both: { emoji: "🔄", label: "Both" },
};

export default function Profile() {
  const { user, profile, logout, updateProfileType } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    listMyNotifications(user.uid)
      .then((data) => setUnread(data.filter((n) => !n.read).length))
      .catch(() => setUnread(0)); // notifications rule not published yet — harmless
  }, [user.uid]);

  return (
    <div className="app-shell">
      <div className="topbar"><h1>Profile</h1></div>
      <div className="content">
        <div className="card" style={{ cursor: "default" }}>
          {profile?.name ? (
            <>
              <div className="card-title">{profile.name}</div>
              <div className="meta">{profile.village}, {profile.district}</div>
            </>
          ) : (
            <div className="meta">No profile info saved yet — tap "Edit profile" below.</div>
          )}
        </div>
        <Link to="/profile/edit" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ marginTop: 10 }}>Edit profile</button>
        </Link>
        <Link to="/notifications" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ marginTop: 10 }}>
            🔔 Notifications {unread > 0 && <span className="pill pill-gold" style={{ marginLeft: 6 }}>{unread} new</span>}
          </button>
        </Link>

        <h3 style={{ fontSize: 15, margin: "18px 0 10px" }}>Profile type</h3>
        {Object.entries(meta).map(([key, m]) => {
          const selected = profile?.profileType === key;
          return (
            <div
              key={key}
              className="card"
              style={{
                borderColor: selected ? "var(--pasture)" : "var(--line)",
                borderWidth: selected ? 2 : 1,
                background: selected ? "var(--pasture-pale)" : "var(--paper-card)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
              onClick={() => updateProfileType(key)}
            >
              <div className="card-title" style={{ margin: 0 }}>{m.emoji} {m.label}</div>
              {selected && <span style={{ color: "var(--pasture)", fontSize: 20, fontWeight: 700 }}>✓</span>}
            </div>
          );
        })}

        <button className="btn-secondary" style={{ marginTop: 12 }} onClick={logout}>Log out</button>
      </div>
      <BottomNav />
    </div>
  );
}
