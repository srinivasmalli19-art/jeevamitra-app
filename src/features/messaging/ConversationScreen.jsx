import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUserProfile } from "../auth/profileApi";
import AppBar from "../../components/AppBar";
import Avatar from "../../components/Avatar";
import { useInteraction, useMessages, useSendMessage } from "./useMessaging";
import { markInteractionRead } from "./messagingApi";
import { otherParticipantId, isParticipant } from "./messaging.logic";
import { useOnline } from "./useOnline";
import PublicationContextCard from "./components/PublicationContextCard";
import MessageBubble from "./components/MessageBubble";
import MessageInput from "./components/MessageInput";

export default function ConversationScreen() {
  const { interactionId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const online = useOnline();

  const { interaction, loading: intLoading, error: intError } = useInteraction(interactionId);
  const { messages, loading: msgLoading, error: msgError, loadOlder, loadingOlder, reachedStart } =
    useMessages(interactionId);
  const { send, sending, error: sendError, clearError } = useSendMessage(interactionId, user.uid);

  const [other, setOther] = useState(null);
  const bottomRef = useRef(null);
  const lastReadKeyRef = useRef("");

  const participant = isParticipant(interaction, user.uid);
  const otherId = interaction ? otherParticipantId(interaction, user.uid) : null;

  useEffect(() => {
    if (!otherId) return;
    getUserProfile(otherId).then((p) => setOther(p)).catch(() => setOther(null));
  }, [otherId]);

  // Scroll to newest on message changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark read whenever there are unread incoming messages for me.
  useEffect(() => {
    if (!interaction || !participant) return;
    const unreadIncoming = messages
      .filter((m) => m.receiverId === user.uid && !m.readAt)
      .map((m) => m.id);
    const key = `${interactionId}:${unreadIncoming.length}`;
    if (unreadIncoming.length === 0 || lastReadKeyRef.current === key) return;
    lastReadKeyRef.current = key;
    markInteractionRead({ interactionId, uid: user.uid, unreadIncomingIds: unreadIncoming }).catch(() => {});
  }, [messages, interaction, participant, interactionId, user.uid]);

  const title = other?.name || t("msg_participant");

  if (intLoading) {
    return (
      <div className="app-shell">
        <AppBar variant="detail" title={t("messages_title")} onBack={() => nav(-1)} />
        <div className="content"><p className="meta">{t("loading")}</p></div>
      </div>
    );
  }

  if (intError || !interaction || !participant) {
    return (
      <div className="app-shell">
        <AppBar variant="detail" title={t("messages_title")} onBack={() => nav(-1)} />
        <div className="content">
          <div className="empty-state">
            <div className="glyph">🔒</div>
            <h3>{t("msg_unavailable_title")}</h3>
            <p>{t("msg_unavailable_body")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={title} onBack={() => nav(-1)} />
      <div className="content" style={{ display: "flex", flexDirection: "column", paddingBottom: 96 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Avatar name={other?.name} photoUrl={other?.photoUrl} size={40} />
          <div>
            <div className="card-title" style={{ fontSize: 15 }}>{title}</div>
            <div className="meta" style={{ fontSize: 11 }}>{t("msg_publisher")}</div>
          </div>
        </div>

        <PublicationContextCard interaction={interaction} />

        {!online && (
          <div className="meta" style={{ textAlign: "center", marginBottom: 8 }}>📴 {t("msg_offline_banner")}</div>
        )}

        {!reachedStart && messages.length > 0 && (
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <button className="link-btn" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? t("loading") : t("msg_load_older")}
            </button>
          </div>
        )}

        {msgLoading && <p className="meta">{t("loading")}</p>}
        {!msgLoading && msgError && <div className="error-box">{t("msg_error_body")}</div>}
        {!msgLoading && !msgError && messages.length === 0 && (
          <div className="empty-state" style={{ padding: "24px 16px" }}>
            <div className="glyph">👋</div>
            <p>{t("msg_start_conversation")}</p>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} mine={m.senderId === user.uid} />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={send} sending={sending} error={sendError} onClearError={clearError} />
    </div>
  );
}
