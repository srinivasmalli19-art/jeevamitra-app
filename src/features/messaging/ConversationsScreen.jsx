import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUserProfile } from "../auth/profileApi";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import Avatar from "../../components/Avatar";
import { useUserInteractions } from "./useMessaging";
import { otherParticipantId, unreadCountFor, toMillis } from "./messaging.logic";
import { useOnline } from "./useOnline";

function relTime(ts) {
  const ms = toMillis(ts);
  if (!ms) return "";
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

function Row({ interaction, uid, name, photoUrl, onOpen }) {
  const unread = unreadCountFor(interaction, uid);
  const { t } = useLanguage();
  const preview = interaction.lastMessage || t("msg_no_messages_yet");
  return (
    <div
      className="card"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
      style={{ display: "flex", gap: 12, alignItems: "center", background: unread ? "var(--pasture-pale)" : "var(--paper-card)" }}
    >
      <Avatar name={name} photoUrl={photoUrl} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span className="card-title" style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name || t("msg_participant")}
          </span>
          <span className="meta" style={{ fontSize: 11, flexShrink: 0 }}>{relTime(interaction.lastMessageAt)}</span>
        </div>
        <div className="meta" style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: unread ? 600 : 400, color: unread ? "var(--ink)" : "var(--ink-soft)" }}>
          {preview}
        </div>
        {interaction.publicationTitle && (
          <div className="meta" style={{ fontSize: 11, marginTop: 2 }}>🌾 {interaction.publicationTitle}</div>
        )}
      </div>
      {unread > 0 && (
        <span
          aria-label={`${unread} unread`}
          style={{
            flexShrink: 0, minWidth: 20, height: 20, padding: "0 6px", borderRadius: 10,
            background: "var(--marigold)", color: "#241800", fontSize: 11.5, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {unread}
        </span>
      )}
    </div>
  );
}

export default function ConversationsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const online = useOnline();
  const { interactions, loading, error, empty, refresh } = useUserInteractions(user.uid);
  const [profiles, setProfiles] = useState({}); // uid -> { name, photoUrl }

  useEffect(() => {
    const missing = interactions
      .map((it) => otherParticipantId(it, user.uid))
      .filter((id) => id && !profiles[id]);
    if (!missing.length) return;
    let cancelled = false;
    Promise.all(missing.map(async (id) => {
      const p = await getUserProfile(id).catch(() => null);
      return [id, { name: p?.name || "", photoUrl: p?.photoUrl || null }];
    })).then((entries) => {
      if (cancelled) return;
      setProfiles((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactions, user.uid]);

  return (
    <div className="app-shell">
      <AppBar variant="top" title={t("messages_title")} subtitle="JeevaMitra" />
      <div className="content">
        {!online && (
          <div className="card" style={{ cursor: "default", background: "var(--paper-dim)" }}>
            <span className="meta">📴 {t("msg_offline_banner")}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <button className="link-btn" onClick={refresh}>↻ {t("msg_refresh")}</button>
        </div>

        {loading && <p className="meta">{t("loading")}</p>}

        {!loading && error && (
          <div className="empty-state">
            <div className="glyph">⚠️</div>
            <h3>{t("msg_error_title")}</h3>
            <p>{t("msg_error_body")}</p>
            <button className="btn-secondary" onClick={refresh}>{t("msg_retry")}</button>
          </div>
        )}

        {!loading && !error && empty && (
          <div className="empty-state">
            <div className="glyph">💬</div>
            <h3>{t("msg_empty_title")}</h3>
            <p>{t("msg_empty_body")}</p>
          </div>
        )}

        {!loading && !error && interactions.map((it) => {
          const otherId = otherParticipantId(it, user.uid);
          const p = profiles[otherId] || {};
          return (
            <Row
              key={it.id}
              interaction={it}
              uid={user.uid}
              name={p.name}
              photoUrl={p.photoUrl}
              onOpen={() => nav(`/messages/${it.id}`)}
            />
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
