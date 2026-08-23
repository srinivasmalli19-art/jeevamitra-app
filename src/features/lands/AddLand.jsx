import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLand } from "./landsApi";
import { useAuth } from "../../context/AuthContext";
import { getCurrentPosition } from "../../utils/geo";
import { compressImageToDataUrl } from "../../utils/image";
import LocationPicker from "../../components/LocationPicker";
import { OTHER_DISTRICT } from "../../data/indiaLocations";
import BottomNav from "../../components/BottomNav";

export default function AddLand() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "", acres: "", price: "", description: "", lat: null, lng: null,
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
          setPhotoError(err.message + " You can still save the listing without a photo.");
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
    } finally {
      setBusy(false);
      setUploadStatus("");
    }
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>Post new land</h1></div>
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Title</label>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <LocationPicker value={form} onChange={(next) => setForm((f) => ({ ...f, ...next }))} />
          <div className="row">
            <div className="field"><label>Acres</label>
              <input required type="number" step="0.1" value={form.acres} onChange={(e) => set("acres", e.target.value)} />
            </div>
            <div className="field"><label>Price (₹/month)</label>
              <input required type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
          </div>
          <div className="field"><label>Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="field">
            <label>Photo</label>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} />
            {photoPreview && (
              <img src={photoPreview} alt="Preview" style={{ width: "100%", borderRadius: 12, marginTop: 8, maxHeight: 200, objectFit: "cover" }} />
            )}
            {photoError && <div className="error-box" style={{ marginTop: 8 }}>{photoError}</div>}
          </div>
          <div className="field">
            <label>Location (for "nearby" search)</label>
            <button type="button" className={form.lat ? "btn-primary" : "btn-secondary"} onClick={handleUseLocation} disabled={locating} style={{ width: "100%" }}>
              {locating ? "Getting your location..." : form.lat ? `✓ Location captured (${form.lat.toFixed(4)}, ${form.lng.toFixed(4)})` : "📍 Use my current location"}
            </button>
            {locError && <div className="error-box" style={{ marginTop: 8 }}>{locError}</div>}
            <p className="meta" style={{ marginTop: 6 }}>Stand at or near the land when you tap this, so distance search works accurately. Optional, but recommended.</p>
          </div>
          <button className="btn-primary" disabled={busy}>{uploadStatus || (busy ? "Saving..." : "Save listing")}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
