import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLand, deleteLand } from "./landsApi";
import { requestBooking } from "./bookingsApi";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { unitLabel, amenityLabel } from "../../i18n/labels";
import { directionsUrl, whatsappShareUrl } from "../../utils/geo";
import { useToast } from "../../components/ToastContext";
import { getOrCreatePublicationInteraction } from "../messaging/messagingApi";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

export default function LandDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const showToast = useToast();
  const [land, setLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    getLand(id).then((l) => { setLand(l); setLoading(false); });
  }, [id]);

  if (loading) return <div className="app-shell"><div className="content"><p className="meta">{t("loading")}</p></div></div>;
  if (!land) return <div className="app-shell"><div className="content"><p>{t("ex_land_not_found")}</p></div></div>;

  const isOwner = land.ownerId === user.uid;

  function overlapsExisting(f, t) {
    return (land.bookedRanges || []).some((r) => f <= r.to && r.from <= t);
  }

  async function handleRequest(e) {
    e.preventDefault();
    setMsg("");
    if (!from || !to || from > to) { setMsg(t("ex_pick_valid_dates")); return; }
    if (overlapsExisting(from, to)) {
      setMsg(t("ex_dates_taken"));
      return;
    }
    setBusy(true);
    try {
      await requestBooking({
        landId: land.id, landTitle: land.title, ownerId: land.ownerId,
        requesterId: user.uid, requesterName: profile?.name || "Someone",
        from, to,
      });
      setMsg(t("ex_booking_sent"));
      showToast(t("ex_booking_sent_toast"));
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t("ex_delete_land_confirm"))) return;
    await deleteLand(land.id);
    showToast(t("ex_listing_deleted"));
    nav("/lands/mine");
  }

  async function handleContactPublisher() {
    if (isOwner || contacting) return; // self-contact is structurally impossible
    setContacting(true);
    try {
      const interactionId = await getOrCreatePublicationInteraction({
        contextId: land.id,
        requesterId: user.uid,
        recipientId: land.ownerId,
        publicationTitle: land.title,
        publicationImageUrl: land.photoUrl || null,
      });
      nav(`/messages/${interactionId}`);
    } catch (err) {
      console.warn("open chat failed", err);
      showToast(t("ex_chat_open_failed"));
      setContacting(false);
    }
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_land_details")} onBack={() => nav(-1)} />
      <div className="content">
        <div
          className="detail-hero"
          style={land.photoUrl ? { backgroundImage: `url(${land.photoUrl})` } : undefined}
        >
          {!land.photoUrl && <span className="hero-emoji">🌾</span>}
          <div className="hero-tag">{land.title}</div>
        </div>
        <div className="card" style={{ cursor: "default" }}>
          <div className="kv-row"><span className="k">{t("ex_village")}</span><span className="v">{land.village}</span></div>
          <div className="kv-row"><span className="k">{t("ex_district")}</span><span className="v">{land.district}</span></div>
          <div className="kv-row"><span className="k">{t("ex_acres")}</span><span className="v">{land.acres}</span></div>
          <div className="kv-row"><span className="k">{t("ex_price")}</span><span className="v">₹{land.price}/{unitLabel(t, land.unit)}</span></div>
          {land.description && <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 10 }}>{land.description}</p>}
        </div>

        {land.amenities && land.amenities.length > 0 && (
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-title" style={{ fontSize: 13.5, marginBottom: 8 }}>{t("ex_amenities")}</div>
            {land.amenities.map((a) => (
              <span key={a} className="pill pill-sky" style={{ marginRight: 6, marginBottom: 6, display: "inline-block" }}>{amenityLabel(t, a)}</span>
            ))}
          </div>
        )}

        {(land.bookedRanges || []).length > 0 && (
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-title" style={{ fontSize: 13.5 }}>{t("ex_blocked_dates")}</div>
            {land.bookedRanges.map((r, i) => (
              <div key={i} className="kv-row"><span className="k">{t("ex_blocked")}</span><span className="v">{r.from} → {r.to}</span></div>
            ))}
          </div>
        )}

        <div className="row" style={{ marginBottom: 12 }}>
          {land.lat && land.lng && (
            <a href={directionsUrl(land.lat, land.lng)} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: "none" }}>
              <button className="btn-secondary" style={{ width: "100%" }}>{t("ex_get_directions")}</button>
            </a>
          )}
          <a
            href={whatsappShareUrl(`Check out this land on JeevaMitra: ${land.title} — ${land.village}, ${land.district} — ₹${land.price}/${land.unit}, ${land.acres} acres.${land.lat ? ` Location: ${directionsUrl(land.lat, land.lng)}` : ""}`)}
            target="_blank"
            rel="noreferrer"
            style={{ flex: 1, textDecoration: "none" }}
          >
            <button className="btn-secondary" style={{ width: "100%" }}>{t("fp_share_whatsapp")}</button>
          </a>
        </div>

        {isOwner ? (
          <div className="row">
            <button className="btn-danger" onClick={handleDelete}>{t("ex_delete_listing")}</button>
          </div>
        ) : (
          <>
            <button
              className="btn-primary"
              onClick={handleContactPublisher}
              disabled={contacting}
              style={{ marginBottom: 14 }}
            >
              💬 {contacting ? t("loading") : t("msg_contact_publisher")}
            </button>
            <form onSubmit={handleRequest}>
            <div className="row">
              <div className="field"><label>{t("ex_from")}</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className="field"><label>{t("ex_to")}</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            </div>
            {msg && <div className="error-box">{msg}</div>}
            <button className="btn-primary" disabled={busy}>{busy ? t("msg_sending") : t("ex_request_booking")}</button>
            </form>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
