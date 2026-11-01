// List card for a residue field, a need-a-herd request or a herd.
import { Link } from "react-router-dom";
import { useLanguage } from "../../../i18n/LanguageContext";
import { KIND, STATUS, ANIMAL_EMOJI, priceLabel, sprayStatus } from "../fields.logic";
import { pick } from "../cropGuides.logic";
import { relTime, fmtDistance } from "../time";

export function StatusPill({ post }) {
  const { t } = useLanguage();
  if (post.hidden) return <span className="pill pill-red">{t("fp_hidden_by_admin")}</span>;
  const map = {
    [STATUS.AVAILABLE]: ["pill-green", "fp_status_available"],
    [STATUS.PARTLY]: ["pill-gold", "fp_status_partly"],
    [STATUS.FULL]: ["pill-red", "fp_status_full"],
    [STATUS.CLOSED]: ["pill-red", "fp_status_closed"],
  };
  const [cls, key] = map[post.status] || map[STATUS.AVAILABLE];
  return <span className={`pill ${cls}`}>{t(key)}</span>;
}

export default function PostCard({ post, crops, settings }) {
  const { t, tf, lang } = useLanguage();
  const crop = post.kind === KIND.RESIDUE ? crops.find((c) => c.id === post.crop) : null;
  const photo = post.photos?.[0]?.url;
  const dist = post._dist !== null && post._dist !== undefined ? tf("fp_km_away", { n: fmtDistance(post._dist, t) }) : null;

  let title;
  let emoji;
  if (post.kind === KIND.RESIDUE) {
    emoji = crop?.emoji || "🌱";
    title = `${crop ? pick(crop.name, lang) : post.cropOther || t("fp_crop_other")} · ${post.acres} ${t("fp_acres")}`;
  } else if (post.kind === KIND.NIGHT_STAY_NEED) {
    emoji = "🌙";
    title = `${t("fp_need_herd_title")} · ${post.acres} ${t("fp_acres")}`;
  } else {
    emoji = ANIMAL_EMOJI[post.animalType] || "🐑";
    title = `${t("fp_animal_" + post.animalType)} · ${post.animalCount}`;
  }
  const spray = post.kind === KIND.RESIDUE ? sprayStatus(post, settings?.sprayWarningDays) : null;

  return (
    <Link to={`/field-posts/${post.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card stub" style={{ display: "flex", gap: 12 }}>
        {photo ? (
          <img src={photo} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, flex: "0 0 auto" }} />
        ) : (
          <div className="land-thumb-fallback" style={{ width: 72, height: 72 }}>{emoji}</div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="card-title clamp-2">{emoji} {title}</div>
          <div className="meta">{[post.village, post.district].filter(Boolean).join(", ")}{dist ? ` · ${dist}` : ""}</div>
          <div className="price" style={{ fontSize: 13.5, marginTop: 4, fontFamily: "inherit", fontWeight: 700 }}>{priceLabel(post, t)}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <StatusPill post={post} />
            {post.kind === KIND.RESIDUE && post.allowNightStay && <span className="pill pill-sky">{t("fp_graze_and_stay")}</span>}
            {spray && spray.status !== "ok" && <span className="pill pill-red">⚠️ {t("fp_spray_check")}</span>}
            {post.kind === KIND.HERD && post.locationUpdatedAt && (
              <span className="pill pill-sky">{relTime(post.locationUpdatedAt, tf)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
