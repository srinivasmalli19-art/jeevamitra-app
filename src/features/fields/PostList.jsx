// Shared browse list: loads one kind of post, sorts by distance when the
// phone's location is known, and applies the filters.
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import PostCard from "./components/PostCard";
import { listPosts } from "./fieldsApi";
import { withDistance, filterPosts, sortNewestFirst, RADIUS_OPTIONS_KM, KIND, ANIMAL_PREFS, ANIMAL_EMOJI } from "./fields.logic";
import { pick } from "./cropGuides.logic";
import useMyLocation from "./useMyLocation";

export default function PostList({ kind, crops, settings, emptyTitle, emptyBody, emptyGlyph }) {
  const { t, tf, lang } = useLanguage();
  const { loc, locating, error: locError, locate } = useMyLocation();
  const [posts, setPosts] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [filters, setFilters] = useState({ crop: "", maxKm: 0, animal: "", availableNow: false });

  useEffect(() => {
    let alive = true;
    listPosts(kind)
      .then((p) => { if (alive) setPosts(p); })
      .catch((e) => { console.warn("Load posts failed:", e?.message); if (alive) { setPosts([]); setLoadError(true); } });
    return () => { alive = false; };
  }, [kind]);

  const shown = useMemo(() => {
    if (!posts) return [];
    const base = loc ? withDistance(posts, loc) : sortNewestFirst(posts).map((p) => ({ ...p, _dist: null }));
    return filterPosts(base, { crop: filters.crop || undefined, maxKm: loc ? filters.maxKm || undefined : undefined, animal: filters.animal || undefined, availableNow: filters.availableNow });
  }, [posts, loc, filters]);

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <button className={loc ? "btn-primary" : "btn-secondary"} style={{ marginBottom: 10 }} onClick={locate} disabled={locating}>
        {locating ? t("fp_locating") : loc ? t("fp_sorted_by_distance") : t("fp_find_near_me")}
      </button>
      {locError && <div className="error-box">{locError}</div>}

      <div className="row" style={{ marginBottom: 12 }}>
        {kind === KIND.RESIDUE ? (
          <select className="filter-select" value={filters.crop} onChange={(e) => setF("crop", e.target.value)} aria-label={t("fp_crop")}>
            <option value="">{t("fp_filter_all_crops")}</option>
            {crops.map((c) => <option key={c.id} value={c.id}>{c.emoji} {pick(c.name, lang)}</option>)}
          </select>
        ) : (
          <select className="filter-select" value={filters.animal} onChange={(e) => setF("animal", e.target.value)} aria-label={t("fp_animal_type")}>
            <option value="">{t("fp_filter_any_animal")}</option>
            {ANIMAL_PREFS.filter((a) => a !== "any").map((a) => <option key={a} value={a}>{ANIMAL_EMOJI[a]} {t("fp_animal_" + a)}</option>)}
          </select>
        )}
        <select className="filter-select" value={filters.maxKm} disabled={!loc} onChange={(e) => setF("maxKm", Number(e.target.value))} aria-label={t("ns_distance")}>
          <option value={0}>{t("fp_filter_any_distance")}</option>
          {RADIUS_OPTIONS_KM.map((km) => <option key={km} value={km}>{tf("fp_filter_within", { n: km })}</option>)}
        </select>
      </div>
      <label className="check-row" style={{ marginBottom: 14 }}>
        <input type="checkbox" checked={filters.availableNow} onChange={(e) => setF("availableNow", e.target.checked)} />
        {t("fp_filter_available_now")}
      </label>

      {posts === null && <p className="meta">{t("loading")}</p>}
      {loadError && <div className="error-box">{t("msg_error_body")}</div>}
      {posts && posts.length === 0 && !loadError && (
        <div className="empty-state"><div className="glyph">{emptyGlyph}</div><h3>{emptyTitle}</h3><p>{emptyBody}</p></div>
      )}
      {posts && posts.length > 0 && shown.length === 0 && <p className="meta" style={{ textAlign: "center", padding: 20 }}>{t("fp_no_match")}</p>}
      {shown.map((p) => <PostCard key={p.id} post={p} crops={crops} settings={settings} />)}
    </div>
  );
}
