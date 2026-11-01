// One form for all three v62 post types:
//   /residue/new                 crop residue field (farmer)
//   /night-stay/new?type=need    I need a herd (farmer)
//   /night-stay/new?type=herd    my herd is available (herd owner)
//   /field-posts/:id/edit        edit any of the above (owner only)
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import LocationPicker from "../../components/LocationPicker";
import PhotoPicker from "../../components/PhotoPicker";
import VoiceRecorder from "../../components/VoiceRecorder";
import { OTHER_DISTRICT } from "../../data/indiaLocations";
import { getCurrentPosition } from "../../utils/geo";
import { deleteStoragePath } from "../../utils/media";
import CropPicker from "./components/CropPicker";
import { useCropGuides } from "./cropGuidesApi";
import { getPost, newPostId, savePost, uploadPostPhoto, uploadPostVoice } from "./fieldsApi";
import { setSessionLocation } from "./useMyLocation";
import { askForPushSoon } from "../push/events";
import {
  KIND, PRICE, PRICE_TYPES_BY_KIND, ANIMALS, ANIMAL_PREFS, ANIMAL_EMOJI, EXTRAS, LOOKING_FOR, MAX_PHOTOS, isoDay, validatePost,
} from "./fields.logic";

function defaultsFor(kind, profile) {
  const place = {
    state: profile?.state || "Andhra Pradesh", district: profile?.district || "", districtOther: "",
    mandal: profile?.mandal || "", village: profile?.village || "", lat: null, lng: null,
  };
  const common = { ...place, availableFrom: isoDay(), description: "", negotiable: false, amount: "" };
  if (kind === KIND.RESIDUE) {
    return { ...common, crop: "", cropOther: "", acres: "", untilFinished: true, availableUntil: "", priceType: PRICE.PER_DAY,
      allowNightStay: false, waterNearby: null, lastSprayDate: "", notSprayed: false };
  }
  if (kind === KIND.NIGHT_STAY_NEED) {
    return { ...common, acres: "", nights: "3", animalPreferred: "sheep", priceType: PRICE.PER_NIGHT, extras: [] };
  }
  return { ...common, animalType: "sheep", animalCount: "", headingTo: "", availableUntil: "", lookingFor: ["nightStay", "grazing"], priceType: "" };
}

function fromPost(post) {
  return {
    ...post,
    acres: post.acres ?? "", amount: post.amount ?? "", nights: post.nights ?? "", animalCount: post.animalCount ?? "",
    availableUntil: post.availableUntil || "", lastSprayDate: post.lastSprayDate || "", districtOther: "",
    priceType: post.priceType || "",
  };
}

export default function PostForm() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const isEdit = !!id;
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const { t, tf } = useLanguage();
  const showToast = useToast();
  const { crops, settings } = useCropGuides();

  const location = useLocation();
  const routeKind = location.pathname.startsWith("/residue")
    ? KIND.RESIDUE
    : search.get("type") === "herd" ? KIND.HERD : KIND.NIGHT_STAY_NEED;

  const [loaded, setLoaded] = useState(!isEdit);
  const [kind, setKind] = useState(routeKind);
  const [postId] = useState(() => id || newPostId());
  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState(() => defaultsFor(routeKind, profile));
  const [photos, setPhotos] = useState([]);
  const [voice, setVoice] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const topRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    getPost(id).then((p) => {
      if (!p || p.ownerId !== user.uid) { nav(`/field-posts/${id}`, { replace: true }); return; }
      setKind(p.kind);
      setOriginal(p);
      setForm(fromPost(p));
      setPhotos((p.photos || []).map((ph) => ({ key: ph.path, path: ph.path, url: ph.url })));
      setVoice(p.voiceNote ? { ...p.voiceNote } : null);
      setLoaded(true);
    });
  }, [id, isEdit, nav, user.uid]);

  const priceTypes = PRICE_TYPES_BY_KIND[kind];
  const title = isEdit ? t("fp_edit_post") : kind === KIND.RESIDUE ? t("fp_form_title_residue") : kind === KIND.HERD ? t("fp_form_title_herd") : t("fp_form_title_need");
  const err = (k) => (errors[k] ? <div className="field-error">{t(errors[k])}</div> : null);
  // Changing a field clears its error (and the summary) straight away.
  const clearErr = (...keys) => setErrors((e) => {
    if (!keys.some((k) => e[k])) return e;
    const next = { ...e };
    keys.forEach((k) => delete next[k]);
    return next;
  });
  const RELATED = { untilFinished: ["availableUntil"], notSprayed: ["lastSprayDate"], priceType: ["amount"], crop: ["cropOther"] };
  const set = (k, v) => { clearErr(k, ...(RELATED[k] || [])); setForm((f) => ({ ...f, [k]: v })); };
  const toggleIn = (k, v) => { clearErr(k); setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] })); };
  const changePhotos = (items) => { clearErr("photos"); setPhotos(items); };
  const changeVoice = (v) => { clearErr("voiceNote"); setVoice(v); };

  async function captureLocation() {
    setLocating(true);
    setLocError("");
    try {
      const p = await getCurrentPosition();
      setSessionLocation(p);
      clearErr("location");
      setForm((f) => ({ ...f, lat: p.lat, lng: p.lng }));
    } catch (e) {
      setLocError(e.message);
    } finally {
      setLocating(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setErrors({});
    const district = form.district === OTHER_DISTRICT ? form.districtOther : form.district;
    // Validate first with placeholder media so no upload happens for a form with mistakes.
    const draft = {
      ...form, district,
      photos: photos.map((p) => ({ path: p.path || "pending", url: p.url })),
      voiceNote: voice ? { path: voice.path || "pending", url: voice.url, durationSec: voice.durationSec } : null,
    };
    const pre = validatePost(kind, draft);
    if (Object.keys(pre).length) {
      setErrors(pre);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setBusy(true);
    const uploaded = [];
    try {
      const finalPhotos = [];
      const newOnes = photos.filter((p) => p.blob);
      let n = 0;
      for (const p of photos) {
        if (p.blob) {
          n += 1;
          setStatus(tf("fp_uploading", { n, to: newOnes.length }));
          const up = await uploadPostPhoto(user.uid, postId, p.blob);
          uploaded.push(up.path);
          finalPhotos.push(up);
        } else {
          finalPhotos.push({ path: p.path, url: p.url });
        }
      }
      let voiceNote = null;
      if (voice?.blob) {
        const up = await uploadPostVoice(user.uid, postId, voice.blob, voice.mimeType);
        uploaded.push(up.path);
        voiceNote = { ...up, durationSec: voice.durationSec };
      } else if (voice?.path) {
        voiceNote = { path: voice.path, url: voice.url, durationSec: voice.durationSec };
      }
      setStatus(t("fp_saving"));
      await savePost({ postId, kind, form: { ...form, district, photos: finalPhotos, voiceNote }, user, profile, isEdit });

      if (original) {
        const keep = new Set([...finalPhotos.map((p) => p.path), voiceNote?.path].filter(Boolean));
        const old = [...(original.photos || []).map((p) => p.path), original.voiceNote?.path].filter(Boolean);
        await Promise.all(old.filter((p) => !keep.has(p)).map(deleteStoragePath));
      }
      showToast(isEdit ? t("fp_updated") : t("fp_saved"));
      if (!isEdit) askForPushSoon();
      nav(`/field-posts/${postId}`, { replace: true });
    } catch (e2) {
      // Don't leave orphan files behind if saving failed.
      await Promise.all(uploaded.map(deleteStoragePath));
      if (e2.fieldErrors) setErrors(e2.fieldErrors);
      else showToast(t("fp_err_generic"));
      console.warn("Save post failed:", e2?.message);
      setBusy(false);
      setStatus("");
    }
  }

  if (!loaded) return <div className="app-shell"><AppBar variant="detail" title={title} onBack={() => nav(-1)} /><div className="content"><p className="meta">{t("loading")}</p></div></div>;

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={title} onBack={() => nav(-1)} />
      <div className="content" ref={topRef}>
        {Object.keys(errors).length > 0 && <div className="error-box">{t(Object.values(errors)[0])}</div>}
        <form onSubmit={submit} noValidate>
          {kind === KIND.RESIDUE && (
            <div className="field">
              <label>{t("fp_crop")}</label>
              <CropPicker crops={crops} settings={settings} value={form.crop} onChange={(v) => set("crop", v)} />
              {err("crop")}
              {form.crop === "other" && (
                <div style={{ marginTop: 8 }}>
                  <input placeholder={t("fp_crop_other_name")} value={form.cropOther} onChange={(e) => set("cropOther", e.target.value)} />
                  {err("cropOther")}
                </div>
              )}
            </div>
          )}

          {kind === KIND.HERD && (
            <>
              <div className="field">
                <label>{t("fp_animal_type")}</label>
                <div className="seg">
                  {ANIMALS.map((a) => (
                    <button key={a} type="button" className={`chip ${form.animalType === a ? "active" : ""}`} onClick={() => set("animalType", a)}>
                      {ANIMAL_EMOJI[a]} {t("fp_animal_" + a)}
                    </button>
                  ))}
                </div>
                {err("animalType")}
              </div>
              <div className="field">
                <label>{t("fp_animal_count")}</label>
                <input type="number" inputMode="numeric" min="1" value={form.animalCount} onChange={(e) => set("animalCount", e.target.value)} />
                {err("animalCount")}
              </div>
              <div className="field">
                <label>{t("fp_looking_for")}</label>
                <div className="seg">
                  {LOOKING_FOR.map((x) => (
                    <button key={x} type="button" className={`chip ${form.lookingFor.includes(x) ? "active" : ""}`} onClick={() => toggleIn("lookingFor", x)}>
                      {t("fp_lf_" + x)}
                    </button>
                  ))}
                </div>
                {err("lookingFor")}
              </div>
            </>
          )}

          {kind !== KIND.HERD && (
            <div className="field">
              <label>{t("fp_field_size")}</label>
              <input type="number" inputMode="decimal" step="0.1" min="0" value={form.acres} onChange={(e) => set("acres", e.target.value)} />
              {err("acres")}
            </div>
          )}

          <div className="field">
            <label>{t("fp_location")}</label>
            <button type="button" className={form.lat ? "btn-primary" : "btn-secondary"} onClick={captureLocation} disabled={locating}>
              {locating ? t("fp_locating") : form.lat ? t("fp_location_captured") : t("fp_use_location")}
            </button>
            <p className="meta" style={{ marginTop: 6 }}>{t("fp_location_hint")}</p>
            {locError && <div className="error-box" style={{ marginTop: 6 }}>{locError}</div>}
            {err("location")}
          </div>
          <LocationPicker value={form} onChange={(next) => { clearErr("village"); setForm((f) => ({ ...f, ...next })); }} />
          {err("village")}

          <div className="row">
            <div className="field">
              <label>{kind === KIND.NIGHT_STAY_NEED ? t("fp_start_date") : t("fp_available_from")}</label>
              <input type="date" value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} />
              {err("availableFrom")}
            </div>
            {kind === KIND.NIGHT_STAY_NEED && (
              <div className="field">
                <label>{t("fp_nights")}</label>
                <input type="number" inputMode="numeric" min="1" max="365" value={form.nights} onChange={(e) => set("nights", e.target.value)} />
                {err("nights")}
              </div>
            )}
            {kind === KIND.HERD && (
              <div className="field">
                <label>{t("fp_available_until_optional")}</label>
                <input type="date" value={form.availableUntil} onChange={(e) => set("availableUntil", e.target.value)} />
                {err("availableUntil")}
              </div>
            )}
          </div>

          {kind === KIND.RESIDUE && (
            <div className="field">
              <label className="check-row">
                <input type="checkbox" checked={form.untilFinished} onChange={(e) => set("untilFinished", e.target.checked)} />
                {t("fp_until_finished")}
              </label>
              {!form.untilFinished && (
                <div style={{ marginTop: 8 }}>
                  <label>{t("fp_available_until")}</label>
                  <input type="date" value={form.availableUntil} onChange={(e) => set("availableUntil", e.target.value)} />
                </div>
              )}
              {err("availableUntil")}
            </div>
          )}

          {kind === KIND.NIGHT_STAY_NEED && (
            <>
              <div className="field">
                <label>{t("fp_animal_pref")}</label>
                <div className="seg">
                  {ANIMAL_PREFS.map((a) => (
                    <button key={a} type="button" className={`chip ${form.animalPreferred === a ? "active" : ""}`} onClick={() => set("animalPreferred", a)}>
                      {ANIMAL_EMOJI[a]} {t("fp_animal_" + a)}
                    </button>
                  ))}
                </div>
                {err("animalPreferred")}
              </div>
              <div className="field">
                <label>{t("fp_extras")}</label>
                <div className="seg">
                  {EXTRAS.map((x) => (
                    <button key={x} type="button" className={`chip ${form.extras.includes(x) ? "active" : ""}`} onClick={() => toggleIn("extras", x)}>
                      {t("fp_extra_" + x)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="field">
            <label>{kind === KIND.NIGHT_STAY_NEED ? t("fp_payment_offered") : kind === KIND.HERD ? t("fp_rate_optional") : t("fp_price_type")}</label>
            <select value={form.priceType} onChange={(e) => set("priceType", e.target.value)}>
              {kind === KIND.HERD && <option value="">{t("fp_no_rate")}</option>}
              {priceTypes.map((p) => <option key={p} value={p}>{t("fp_price_" + p)}</option>)}
            </select>
            {err("priceType")}
          </div>
          {form.priceType && form.priceType !== PRICE.FREE_FOR_MANURE && (
            <div className="field">
              <label>{t("fp_amount")}</label>
              <input type="number" inputMode="numeric" min="1" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
              {err("amount")}
              <label className="check-row" style={{ marginTop: 8 }}>
                <input type="checkbox" checked={form.negotiable} onChange={(e) => set("negotiable", e.target.checked)} />
                {t("fp_negotiable")}
              </label>
            </div>
          )}

          {kind === KIND.RESIDUE && (
            <>
              <div className="field">
                <label className="check-row">
                  <input type="checkbox" checked={form.allowNightStay} onChange={(e) => set("allowNightStay", e.target.checked)} />
                  {t("fp_allow_night_stay")}
                </label>
              </div>
              <div className="field">
                <label>{t("fp_water_nearby")}</label>
                <div className="seg">
                  <button type="button" className={`chip ${form.waterNearby === true ? "active" : ""}`} onClick={() => set("waterNearby", true)}>{t("fp_yes")}</button>
                  <button type="button" className={`chip ${form.waterNearby === false ? "active" : ""}`} onClick={() => set("waterNearby", false)}>{t("fp_no")}</button>
                </div>
              </div>
              <div className="field">
                <label>{t("fp_last_spray")}</label>
                {!form.notSprayed && (
                  <input type="date" max={isoDay()} value={form.lastSprayDate} onChange={(e) => set("lastSprayDate", e.target.value)} />
                )}
                <label className="check-row" style={{ marginTop: 8 }}>
                  <input type="checkbox" checked={form.notSprayed} onChange={(e) => set("notSprayed", e.target.checked)} />
                  {t("fp_not_sprayed")}
                </label>
                {err("lastSprayDate")}
              </div>
            </>
          )}

          {kind === KIND.HERD && (
            <div className="field">
              <label>{t("fp_heading_to")}</label>
              <input value={form.headingTo} maxLength={200} onChange={(e) => set("headingTo", e.target.value)} />
            </div>
          )}

          <div className="field">
            <label>{t("fp_photos")}</label>
            <PhotoPicker items={photos} onChange={changePhotos} max={MAX_PHOTOS} />
            {err("photos")}
          </div>

          <div className="field">
            <label>{t("fp_voice_note")}</label>
            <VoiceRecorder value={voice} onChange={changeVoice} />
            {err("voiceNote")}
          </div>

          <div className="field">
            <label>{t("fp_description")}</label>
            <textarea maxLength={1000} value={form.description} onChange={(e) => set("description", e.target.value)} />
            {err("description")}
          </div>

          {!isEdit && <p className="meta" style={{ marginBottom: 12 }}>ℹ️ {t("fp_phone_shown")}</p>}
          <button className="btn-primary" disabled={busy}>{status || (isEdit ? t("fp_save_changes") : t("fp_publish"))}</button>
        </form>
      </div>
    </div>
  );
}
