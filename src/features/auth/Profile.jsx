import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { listMyNotifications } from "../notifications/notificationsApi";
import Avatar from "../../components/Avatar";
import AppBar from "../../components/AppBar";
import BottomSheet from "../../components/BottomSheet";
import BottomNav from "../../components/BottomNav";
import SettingsSheet from "../../components/SettingsSheet";
import NotificationsSheet from "../notifications/NotificationsSheet";

const meta = {
  livestock: { emoji: "🐄", label: "Livestock Owner" },
  land: { emoji: "🌾", label: "Fodder Land Provider" },
  both: { emoji: "🔄", label: "Both" },
};

export default function Profile() {
  const { user, profile, updateProfileType } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    listMyNotifications(user.uid)
      .then((data) => setUnread(data.filter((n) => !n.read).length))
      .catch(() => setUnread(0)); // notifications rule not published yet — harmless
  }, [user.uid]);

  return (
    <div className="app-shell">
      <AppBar
        variant="top"
        title={t("profile_title")}
        onMap={() => nav("/map")}
        onBell={() => setNotifOpen(true)}
        unread={unread > 0}
      />
      <div className="content">
        <div className="card" style={{ cursor: "default", display: "flex", gap: 14, alignItems: "center" }}>
          <Avatar name={profile?.name} photoUrl={profile?.photoUrl} size={54} />
          {profile?.name ? (
            <div>
              <div className="card-title" style={{ margin: 0 }}>{profile.name}</div>
              <div className="meta">{profile.village}, {profile.district}</div>
            </div>
          ) : (
            <div className="meta">No profile info saved yet — tap "Edit profile" below.</div>
          )}
        </div>
        <Link to="/profile/edit" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ marginTop: 10 }}>{t("edit_profile")}</button>
        </Link>
        <Link to="/alerts" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ marginTop: 10 }}>🚨 {t("profile_alerts_link")}</button>
        </Link>
        <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => setSettingsOpen(true)}>
          ⚙️ {t("settings_title")}
        </button>
        <Link to="/livestock" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ marginTop: 10 }}>🐄 {t("profile_livestock_link")}</button>
        </Link>
        <Link to="/land-holdings" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ marginTop: 10 }}>🌾 {t("profile_landHoldings_link")}</button>
        </Link>
        <Link to="/stories" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ marginTop: 10 }}>📖 {t("profile_stories_link")}</button>
        </Link>
        <Link to="/videos" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ marginTop: 10 }}>🎬 {t("profile_videos_link")}</button>
        </Link>

        <h3 style={{ fontSize: 15, margin: "18px 0 10px" }}>{t("profile_type")}</h3>
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
      </div>
      <BottomSheet open={notifOpen} onClose={() => setNotifOpen(false)} title={t("notifications_title")}>
        <NotificationsSheet />
      </BottomSheet>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <BottomNav />
    </div>
  );
}
