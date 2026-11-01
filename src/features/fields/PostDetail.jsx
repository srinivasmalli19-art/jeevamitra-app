// Detail screen for any field post (/field-posts/:id).
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import BottomSheet from "../../components/BottomSheet";
import VoicePlayer from "../../components/VoicePlayer";
import { directionsUrl, getCurrentPosition } from "../../utils/geo";
import { getOrCreatePublicationInteraction } from "../messaging/messagingApi";
import SafetyCard from "./components/SafetyCard";
import { StatusPill } from "./components/PostCard";
import { useCropGuides } from "./cropGuidesApi";
import { pick } from "./cropGuides.logic";
import { watchPost, setPostStatus, deletePost, updateHerdLocation } from "./fieldsApi";
import { KIND, OWNER_STATUSES, ANIMAL_EMOJI, priceLabel, sprayStatus } from "./fields.logic";
import { relTime } from "./time";
import { telUrl, whatsappChatUrl } from "./contact";
import { setSessionLocation } from "./useMyLocation";

export default function PostDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { t, tf, lang } = useLanguage();
  const showToast = useToast();
  const { crops, settings } = useCropGuides();
  const [post, setPost] = useState(undefined);
  const [busy, setBusy] = useState("");
  const [safetyOpen, setSafetyOpen] = useState(false);

  useEffect(() => watchPost(id, setPost, () => setPost(null)), [id]);

  if (post === undefined) return <Shell t={t} nav={nav}><p className="meta">{t("loading")}</p></Shell>;
  if (!post || (post.hidden && post.ownerId !== user.uid)) {
    return <Shell t={t} nav={nav}><div className="empty-state"><div className="glyph">🌾</div><p>{t("fp_not_found")}</p></div></Shell>;
  }

  const isOwner = post.ownerId === user.uid;
  const crop = post.kind === KIND.RESIDUE ? crops.find((c) => c.id === post.crop) : null;
  const cropLabel = crop ? pick(crop.name, lang) : post.cropOther || t("fp_crop_other");
  let heading;
  if (post.kind === KIND.RESIDUE) heading = `${crop?.emoji || "🌱"} ${cropLabel} · ${post.acres} ${t("fp_acres")}`;
  else if (post.kind === KIND.NIGHT_STAY_NEED) heading = `🌙 ${t("fp_need_herd_title")}`;
  else heading = `${ANIMAL_EMOJI[post.animalType] || "🐑"} ${t("fp_animal_" + post.animalType)} · ${post.animalCount}`;
  const spray = post.kind === KIND.RESIDUE ? sprayStatus(post, settings.sprayWarningDays) : null;
  const shareText = `${heading} · ${post.village}${post.district ? ", " + post.district : ""} · ${priceLabel(post, t)} · JeevaMitra`;

  async function chat() {
    setBusy("chat");
    try {
      const interactionId = await getOrCreatePublicationInteraction({
        contextId: post.id, requesterId: user.uid, recipientId: post.ownerId,
        publicationTitle: heading, publicationImageUrl: post.photos?.[0]?.url || null, contextKind: "fieldPost",
      });
      nav(`/messages/${interactionId}`);
    } catch (e) {
      showToast(e.message || t("fp_err_generic"));
      setBusy("");
    }
  }

  async function changeStatus(s) {
    setBusy("status");
    try { await setPostStatus(post.id, s); showToast(t("fp_status_changed")); }
    catch { showToast(t("fp_err_generic")); }
    finally { setBusy(""); }
  }

  async function remove() {
    if (!window.confirm(t("fp_delete_confirm"))) return;
    setBusy("delete");
    try { await deletePost(post); showToast(t("fp_deleted")); nav("/field-posts/mine", { replace: true }); }
    catch { showToast(t("fp_err_generic")); setBusy(""); }
  }

  async function herdHere() {
    setBusy("herd");
    try {
      const p = await getCurrentPosition();
      setSessionLocation(p);
      await updateHerdLocation(post, p, { force: true });
      showToast(t("fp_herd_updated"));
    } catch (e) {
      showToast(e.message || t("fp_err_generic"));
    } finally { setBusy(""); }
  }

  const photos = post.photos || [];
  return (
    <Shell t={t} nav={nav}>
      {photos.length > 0 ? (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, scrollSnapType: "x mandatory" }}>
          {photos.map((ph, i) => (
            <a key={ph.path || i} href={ph.url} target="_blank" rel="noreferrer" style={{ flex: "0 0 auto", scrollSnapAlign: "start" }}>
              <img src={ph.url} alt="" style={{ width: photos.length === 1 ? "calc(100vw - 36px)" : 260, maxWidth: 444, height: 190, objectFit: "cover", borderRadius: 14 }} />
            </a>
          ))}
        </div>
      ) : (
        <div className="detail-hero"><span className="hero-emoji">{post.kind === KIND.HERD ? ANIMAL_EMOJI[post.animalType] : post.kind === KIND.RESIDUE ? crop?.emoji || "🌱" : "🌙"}</span></div>
      )}

      <h2 style={{ fontSize: 19, margin: "0 0 4px" }}>{heading}</h2>
      <div className="meta" style={{ marginBottom: 8 }}>{[...new Set([post.village, post.mandal, post.district].filter(Boolean))].join(", ")}</div>
      <div className="price" style={{ fontSize: 17, fontFamily: "inherit", fontWeight: 700, marginBottom: 8 }}>{priceLabel(post, t)}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <StatusPill post={post} />
        {post.kind === KIND.RESIDUE && post.allowNightStay && <span className="pill pill-sky">{t("fp_graze_and_stay")}</span>}
        {post.kind === KIND.HERD && post.locationUpdatedAt && (
          <span className="pill pill-sky">{tf("fp_location_updated", { time: relTime(post.locationUpdatedAt, tf) })}</span>
        )}
      </div>

      {spray?.status === "recent" && <div className="warn-box">{tf("fp_spray_recent", { n: spray.daysAgo })}</div>}
      {spray?.status === "unknown" && <div className="warn-box">{t("fp_spray_unknown")}</div>}
      {post.kind === KIND.RESIDUE && crop && (
        <button className="btn-secondary" style={{ marginBottom: 12 }} onClick={() => setSafetyOpen(true)}>
          ⓘ {tf("fp_safety_open", { name: cropLabel })}
        </button>
      )}

      {!isOwner && (
        <div className="contact-grid">
          <button className="btn-primary" onClick={chat} disabled={busy === "chat"}>{t("fp_chat")}</button>
          {telUrl(post.ownerPhone) && <a className="btn-secondary btn-link" href={telUrl(post.ownerPhone)}>{t("fp_call")}</a>}
          {whatsappChatUrl(post.ownerPhone) && (
            <a className="btn-secondary btn-link" href={whatsappChatUrl(post.ownerPhone, shareText)} target="_blank" rel="noreferrer">{t("whatsapp")}</a>
          )}
          {post.lat && post.lng && (
            <a className="btn-secondary btn-link" href={directionsUrl(post.lat, post.lng)} target="_blank" rel="noreferrer">{t("fp_directions")}</a>
          )}
        </div>
      )}

      {isOwner && (
        <div className="card" style={{ cursor: "default" }}>
          <div className="card-title" style={{ fontSize: 14 }}>{t("fp_your_post")}</div>
          {post.hidden && <div className="error-box" style={{ marginTop: 8 }}>{t("fp_hidden_by_admin")}</div>}
          <label className="meta" style={{ display: "block", margin: "8px 0 6px", fontWeight: 600 }}>{t("fp_status")}</label>
          <div className="seg" style={{ marginBottom: 12 }}>
            {OWNER_STATUSES.map((s) => (
              <button key={s} type="button" data-status={s} disabled={busy === "status"} className={`chip ${post.status === s ? "active" : ""}`} onClick={() => changeStatus(s)}>
                {t("fp_status_" + s)}
              </button>
            ))}
          </div>
          {post.kind === KIND.HERD && (
            <button className="btn-primary" style={{ marginBottom: 10 }} onClick={herdHere} disabled={busy === "herd"}>
              {busy === "herd" ? t("fp_locating") : t("fp_herd_here")}
            </button>
          )}
          <div className="row">
            <Link to={`/field-posts/${post.id}/edit`} style={{ textDecoration: "none" }}><button className="btn-secondary">{t("edit")}</button></Link>
            <button className="btn-danger" onClick={remove} disabled={busy === "delete"}>{t("fp_delete_post")}</button>
          </div>
        </div>
      )}

      {post.voiceNote?.url && (
        <div className="card" style={{ cursor: "default" }}><VoicePlayer src={post.voiceNote.url} durationSec={post.voiceNote.durationSec} /></div>
      )}

      <div className="card" style={{ cursor: "default" }}>
        {post.kind === KIND.RESIDUE && (
          <>
            <Row k={t("fp_crop")} v={cropLabel} />
            <Row k={t("fp_field_size")} v={post.acres} />
            <Row k={t("fp_dates")} v={`${post.availableFrom || ""} → ${post.untilFinished ? t("fp_until_finished_short") : post.availableUntil || ""}`} />
            {post.waterNearby !== null && post.waterNearby !== undefined && <Row k={t("fp_water")} v={post.waterNearby ? t("fp_yes") : t("fp_no")} />}
            <Row k={t("fp_last_spray")} v={post.notSprayed ? t("fp_spray_none") : spray?.daysAgo !== null && spray?.daysAgo !== undefined ? tf("fp_time_days", { n: spray.daysAgo }) : "—"} />
          </>
        )}
        {post.kind === KIND.NIGHT_STAY_NEED && (
          <>
            <Row k={t("fp_field_size")} v={post.acres} />
            <Row k={t("fp_dates")} v={`${post.availableFrom || ""} → ${post.availableUntil || ""}`} />
            <Row k={t("fp_nights")} v={post.nights} />
            <Row k={t("fp_animal_pref")} v={`${ANIMAL_EMOJI[post.animalPreferred] || ""} ${t("fp_animal_" + post.animalPreferred)}`} />
            {post.extras?.length > 0 && <Row k={t("fp_extras")} v={post.extras.map((x) => t("fp_extra_" + x)).join(", ")} />}
          </>
        )}
        {post.kind === KIND.HERD && (
          <>
            <Row k={t("fp_herd_size")} v={`${t("fp_animal_" + post.animalType)} · ${post.animalCount}`} />
            <Row k={t("fp_looking_for")} v={(post.lookingFor || []).map((x) => t("fp_lf_" + x)).join(", ")} />
            <Row k={t("fp_dates")} v={`${post.availableFrom || ""} → ${post.availableUntil || "…"}`} />
            {post.headingTo && <Row k={t("fp_heading_to")} v={post.headingTo} />}
          </>
        )}
        <Row k={t("fp_posted_by")} v={post.ownerName || "—"} />
        {post.description && <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 10, whiteSpace: "pre-wrap" }}>{post.description}</p>}
      </div>

      <BottomSheet open={safetyOpen} onClose={() => setSafetyOpen(false)} title={`${crop?.emoji || ""} ${cropLabel} · ${t("fp_safety_title")}`}>
        {crop && <SafetyCard crop={crop} settings={settings} />}
      </BottomSheet>
    </Shell>
  );
}

function Shell({ t, nav, children }) {
  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("fp_detail_title")} onBack={() => nav(-1)} />
      <div className="content">{children}</div>
      <BottomNav />
    </div>
  );
}

function Row({ k, v }) {
  return <div className="kv-row"><span className="k">{k}</span><span className="v" style={{ fontFamily: "inherit", textAlign: "right" }}>{v}</span></div>;
}
