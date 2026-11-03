import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLand } from "./landsApi";
import { useAuth } from "../../context/AuthContext";
import { getCurrentPosition } from "../../utils/geo";
import { compressImageToDataUrl } from "../../utils/image";
import LocationPicker from "../../components/LocationPicker";
import { OTHER_DISTRICT } from "../../data/indiaLocations";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../i18n/LanguageContext";
import { amenityLabel, errText } from "../../i18n/labels";

const ALL_AMENITIES = ["Water source", "Shade", "Fenced", "Borewell", "Electricity", "Road access"];

export default function AddLand() {
  const { user } = useAuth();
  const { t, tf } = useLanguage();
  const showToast = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "", acres: "", price: "", description: "", amenities: [], lat: null, lng: null,
    state: "Andhra Pradesh", district: "", districtOther: "", mandal: "", village: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function toggleAmenity(value) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(value) ? f.amenities.filter((x) => x !== value) : [...f.amenities, value],
    }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleUseLocation() {
    setLocating(true);
    setLocError("");
    try {
      const { lat, lng } = await getCurrentPosition();
      set("lat", lat);
      set("lng", lng);
    } catch (err) {
      setLocError(errText(t, err));
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setPhotoError("");
    try {
      let photoUrl = null;
      if (photoFile) {
        setUploadStatus(t("ex_compressing_photo"));
        try {
          photoUrl = await compressImageToDataUrl(photoFile);
        } catch (err) {
          setPhotoError(errText(t, err) + " " + t("ex_save_without_photo"));
          setUploadStatus("");
          setBusy(false);
          return;
        }
      }
      const id = await createLand(user.uid, {
        ...form,
        district: form.district === OTHER_DISTRICT ? form.districtOther : form.district,
        photoUrl,
      });
      nav(`/lands/${id}`);
      showToast(t("ex_land_saved"));
    } finally {
      setBusy(false);
      setUploadStatus("");
    }
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_post_land")} onBack={() => nav(-1)} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>{t("ex_title")}</label>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <LocationPicker value={form} onChange={(next) => setForm((f) => ({ ...f, ...next }))} />
          <div className="row">
            <div className="field"><label>{t("ex_acres")}</label>
              <input required type="number" step="0.1" value={form.acres} onChange={(e) => set("acres", e.target.value)} />
            </div>
            <div className="field"><label>{t("ex_price_month")}</label>
              <input required type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
          </div>
          <div className="field"><label>{t("ex_description")}</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="field"><label>{t("ex_amenities")}</label>
            <div className="chip-row">
              {ALL_AMENITIES.map((a) => (
                <button key={a} type="button" className={`chip ${form.amenities.includes(a) ? "active" : ""}`} onClick={() => toggleAmenity(a)}>
                  {amenityLabel(t, a)}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>{t("ex_photo")}</label>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} />
            {photoPreview && (
              <img src={photoPreview} alt="Preview" style={{ width: "100%", borderRadius: 12, marginTop: 8, maxHeight: 200, objectFit: "cover" }} />
            )}
            {photoError && <div className="error-box" style={{ marginTop: 8 }}>{photoError}</div>}
          </div>
          <div className="field">
            <label>{t("ex_location_nearby")}</label>
            <button type="button" className={form.lat ? "btn-primary" : "btn-secondary"} onClick={handleUseLocation} disabled={locating} style={{ width: "100%" }}>
              {locating ? t("ex_getting_location") : form.lat ? tf("ex_location_captured", { lat: form.lat.toFixed(4), lng: form.lng.toFixed(4) }) : t("ex_use_my_location")}
            </button>
            {locError && <div className="error-box" style={{ marginTop: 8 }}>{locError}</div>}
            <p className="meta" style={{ marginTop: 6 }}>{t("ex_stand_near_land")}</p>
          </div>
          <button className="btn-primary" disabled={busy}>{uploadStatus || (busy ? t("ex_saving") : t("ex_save_listing"))}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
