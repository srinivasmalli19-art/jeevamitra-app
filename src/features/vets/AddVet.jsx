import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { createVetProfile } from "./vetsApi";
import { useAuth } from "../../context/AuthContext";
import { getCurrentPosition } from "../../utils/geo";
import { compressImageToDataUrl } from "../../utils/image";
import LocationPicker from "../../components/LocationPicker";
import { OTHER_DISTRICT } from "../../data/indiaLocations";
import BottomNav from "../../components/BottomNav";

const ALL_LANGS = ["Telugu", "English", "Hindi"];
const ALL_SERVICES = ["General Checkup", "Vaccination", "First Aid", "Artificial Insemination", "Surgery", "Epidemic Response"];

export default function AddVet() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", sector: "Government", designation: "Veterinary Officer",
    services: ["General Checkup"], experienceYears: "", languages: ["Telugu"],
    phone: "", rating: "", availability: "Available today", lat: null, lng: null,
    state: "Andhra Pradesh", district: "", districtOther: "", mandal: "", village: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  // Non-admins should never reach this form, even if they type the URL directly.
  if (!loading && !isAdmin) return <Navigate to="/vets" replace />;

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function toggle(key, value) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value],
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
      setLocError(err.message);
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
        setUploadStatus("Compressing photo...");
        try {
          photoUrl = await compressImageToDataUrl(photoFile);
        } catch (err) {
          setPhotoError(err.message + " You can still save this vet without a photo.");
          setUploadStatus("");
          setBusy(false);
          return;
        }
      }
      const district = form.district === OTHER_DISTRICT ? form.districtOther : form.district;
      const id = await createVetProfile(user.uid, { ...form, district, photoUrl });
      nav(`/vets/${id}`);
    } finally {
      setBusy(false);
      setUploadStatus("");
    }
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>Add vet</h1><div className="sub">Admin only — curated directory entry</div></div>
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Full name</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="field">
            <label>Photo</label>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} />
            {photoPreview && (
              <img src={photoPreview} alt="Preview" style={{ width: "100%", borderRadius: 12, marginTop: 8, maxHeight: 200, objectFit: "cover" }} />
            )}
            {photoError && <div className="error-box" style={{ marginTop: 8 }}>{photoError}</div>}
          </div>
          <div className="row">
            <div className="field"><label>Sector</label>
              <select value={form.sector} onChange={(e) => set("sector", e.target.value)}>
                <option>Government</option><option>Private</option>
              </select>
            </div>
            <div className="field"><label>Designation</label>
              <select value={form.designation} onChange={(e) => set("designation", e.target.value)}>
                <option>Veterinary Officer</option>
                <option>Veterinary Assistant</option>
              </select>
            </div>
          </div>
          <div className="field"><label>Services offered</label>
            <div className="chip-row">
              {ALL_SERVICES.map((s) => (
                <button key={s} type="button" className={`chip ${form.services.includes(s) ? "active" : ""}`} onClick={() => toggle("services", s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="row">
            <div className="field"><label>Years of experience</label>
              <input required type="number" value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} />
            </div>
            <div className="field"><label>Phone number</label>
              <input required type="tel" placeholder="10-digit number" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <LocationPicker value={form} onChange={(next) => setForm((f) => ({ ...f, ...next }))} />
          <div className="field"><label>Languages spoken</label>
            <div className="chip-row">
              {ALL_LANGS.map((lang) => (
                <button key={lang} type="button" className={`chip ${form.languages.includes(lang) ? "active" : ""}`} onClick={() => toggle("languages", lang)}>
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="row">
            <div className="field"><label>Availability</label>
              <select value={form.availability} onChange={(e) => set("availability", e.target.value)}>
                <option>Available today</option>
                <option>Available tomorrow</option>
                <option>Busy this week</option>
              </select>
            </div>
            <div className="field"><label>Rating (optional, 1–5)</label>
              <input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(e) => set("rating", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Location (for "nearby" search)</label>
            <button type="button" className={form.lat ? "btn-primary" : "btn-secondary"} onClick={handleUseLocation} disabled={locating} style={{ width: "100%" }}>
              {locating ? "Getting location..." : form.lat ? `✓ Location captured (${form.lat.toFixed(4)}, ${form.lng.toFixed(4)})` : "📍 Use current location (stand at vet's location)"}
            </button>
            {locError && <div className="error-box" style={{ marginTop: 8 }}>{locError}</div>}
          </div>
          <button className="btn-primary" disabled={busy}>{uploadStatus || (busy ? "Saving..." : "Add to directory")}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
