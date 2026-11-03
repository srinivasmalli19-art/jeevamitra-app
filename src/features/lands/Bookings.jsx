import { useEffect, useState } from "react";
import { listMyBookings, listBookingRequestsForOwner, acceptBooking, rejectBooking, cancelBooking } from "./bookingsApi";
import { getUserProfile } from "../auth/profileApi";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { useToast } from "../../components/ToastContext";
import { listMyNotifications } from "../notifications/notificationsApi";
import AppBar from "../../components/AppBar";
import BottomSheet from "../../components/BottomSheet";
import BottomNav from "../../components/BottomNav";
import NotificationsSheet from "../notifications/NotificationsSheet";
import { useNavigate } from "react-router-dom";
import { bookingStatusLabel } from "../../i18n/labels";

function StatusPill({ status }) {
  const { t } = useLanguage();
  const map = { pending: "pill-gold", confirmed: "pill-green", rejected: "pill-red", cancelled: "pill-red" };
  return <span className={`pill ${map[status] || "pill-gold"}`}>{bookingStatusLabel(t, status)}</span>;
}

function ContactCard({ contact, bookingId, onMessage }) {
  const { t } = useLanguage();
  if (!contact) return null;
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
      <div className="meta" style={{ marginBottom: 6 }}>{contact.name}{contact.village ? ` · ${contact.village}` : ""}</div>
      <div className="row">
        <a href={`tel:${contact.phone}`} style={{ flex: 1, textDecoration: "none" }}>
          <button className="btn-primary" style={{ width: "100%" }}>{t("call")}</button>
        </a>
        <a href={`https://wa.me/91${contact.phone}`} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: "none" }}>
          <button className="btn-secondary" style={{ width: "100%" }}>{t("whatsapp")}</button>
        </a>
      </div>
      <button className="btn-secondary" style={{ width: "100%", marginTop: 8 }} onClick={() => onMessage(bookingId)}>💬 {t("ex_message")}</button>
    </div>
  );
}

export default function Bookings() {
  const { user } = useAuth();
  const { t, tf } = useLanguage();
  const nav = useNavigate();
  const showToast = useToast();
  const [tab, setTab] = useState("mine");
  const [mine, setMine] = useState([]);
  const [requests, setRequests] = useState([]);
  const [contacts, setContacts] = useState({});
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  async function refresh() {
    setLoading(true);
    const [m, r] = await Promise.all([listMyBookings(user.uid), listBookingRequestsForOwner(user.uid)]);
    setMine(m); setRequests(r);
    setLoading(false);

    // Once a booking is confirmed, both sides need each other's contact
    // details — fetch the counterparty's profile (owner's for "mine",
    // requester's for "requests") for every confirmed booking.
    const uidsToFetch = new Set();
    m.filter((b) => b.status === "confirmed").forEach((b) => uidsToFetch.add(b.ownerId));
    r.filter((b) => b.status === "confirmed").forEach((b) => uidsToFetch.add(b.requesterId));
    const entries = await Promise.all(
      [...uidsToFetch].map(async (uid) => [uid, await getUserProfile(uid)])
    );
    setContacts(Object.fromEntries(entries));
  }

  useEffect(() => { refresh(); }, [user.uid]);
  useEffect(() => {
    listMyNotifications(user.uid)
      .then((data) => setUnread(data.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
  }, [user.uid]);

  async function handleAccept(b) {
    setErrMsg("");
    try {
      await acceptBooking(b.id, b);
      showToast(t("ex_booking_confirmed"));
      await refresh();
    } catch (err) {
      setErrMsg(err.message);
    }
  }
  async function handleReject(b) {
    await rejectBooking(b.id, b);
    showToast(t("ex_booking_rejected"));
    await refresh();
  }
  async function handleCancel(b) {
    await cancelBooking(b.id, b);
    showToast(t("ex_booking_cancelled"));
    await refresh();
  }

  const pendingRequests = requests.filter((b) => b.status === "pending");
  const decidedRequests = requests.filter((b) => b.status !== "pending");

  return (
    <div className="app-shell">
      <AppBar
        variant="top"
        title={t("bookings_title")}
        subtitle={t("ex_manage_requests")}
        onMap={() => nav("/map")}
        onBell={() => setNotifOpen(true)}
        unread={unread > 0}
      />
      <div className="content">
        <div className="tabbar">
          <button className={`tabbtn ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>{t("my_bookings")}</button>
          <button className={`tabbtn ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}>
            {t("requests")} {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </button>
        </div>

        {errMsg && <div className="error-box">{errMsg}</div>}
        {loading && <p className="meta">{t("loading")}</p>}

        {!loading && tab === "mine" && (mine.length === 0
          ? <div className="empty-state"><div className="glyph">📋</div><h3>{t("ex_no_bookings_title")}</h3><p>{t("ex_browse_lands_first")}</p></div>
          : mine.map((b) => (
            <div key={b.id} className="card" style={{ cursor: "default" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div className="card-title">{b.landTitle}</div>
                  <div className="meta">{b.from} → {b.to}</div>
                </div>
                <StatusPill status={b.status} />
              </div>
              {b.status === "confirmed" && <ContactCard contact={contacts[b.ownerId]} bookingId={b.id} onMessage={(id) => nav(`/bookings/${id}/chat`)} />}
              {(b.status === "pending" || b.status === "confirmed") && (
                <button className="btn-danger" style={{ marginTop: 10 }} onClick={() => handleCancel(b)}>{t("cancel")}</button>
              )}
            </div>
          ))
        )}

        {!loading && tab === "requests" && (requests.length === 0
          ? <div className="empty-state"><div className="glyph">📥</div><h3>{t("ex_no_requests_title")}</h3><p>{t("ex_no_requests_body")}</p></div>
          : [...pendingRequests, ...decidedRequests].map((b) => (
            <div key={b.id} className="card" style={{ cursor: "default" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div className="card-title">{b.landTitle}</div>
                  <div className="meta">{tf("ex_request_from", { name: b.requesterName })} · {b.from} → {b.to}</div>
                </div>
                {b.status !== "pending" && <StatusPill status={b.status} />}
              </div>
              {b.status === "confirmed" && <ContactCard contact={contacts[b.requesterId]} bookingId={b.id} onMessage={(id) => nav(`/bookings/${id}/chat`)} />}
              {b.status === "pending" && (
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn-danger" onClick={() => handleReject(b)}>{t("reject")}</button>
                  <button className="btn-primary" onClick={() => handleAccept(b)}>{t("accept")}</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <BottomSheet open={notifOpen} onClose={() => setNotifOpen(false)} title={t("notifications_title")}>
        <NotificationsSheet />
      </BottomSheet>
      <BottomNav />
    </div>
  );
}
