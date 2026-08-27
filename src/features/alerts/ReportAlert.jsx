import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAlert } from "./alertsApi";
import { useAuth } from "../../context/AuthContext";
import { getCurrentPosition } from "../../utils/geo";
import LocationPicker from "../../components/LocationPicker";
import { OTHER_DISTRICT } from "../../data/indiaLocations";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

export default function ReportAlert() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const showToast = useToast();
  const [form, setForm] = useState({
    disease: "", species: "Cattle", severity: "medium", symptoms: "",
    lat: null, lng: null,
    state: profile?.state || "Andhra Pradesh",
    district: profile?.district || "", districtOther: "",
    mandal: profile?.mandal || "", village: profile?.village || "",
  });
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

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
    try {
      const district = form.district === OTHER_DISTRICT ? form.districtOther : form.district;
      const id = await createAlert(user.uid, profile?.name || "Someone", { ...form, district });
      nav(`/alerts/${id}`);
      showToast("Alert reported to your community");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title="Report disease alert" onBack={() => nav(-1)} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Disease</label>
            <input required placeholder="e.g. Foot and Mouth Disease" value={form.disease} onChange={(e) => set("disease", e.target.value)} />
          </div>
          <div className="row">
            <div className="field"><label>Species</label>
              <select value={form.species} onChange={(e) => set("species", e.target.value)}>
                <option>Cattle</option><option>Buffalo</option><option>Goat/Sheep</option><option>Other</option>
              </select>
            </div>
            <div className="field"><label>Severity</label>
              <select value={form.severity} onChange={(e) => set("severity", e.target.value)}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
          </div>
          <LocationPicker value={form} onChange={(next) => setForm((f) => ({ ...f, ...next }))} />
          <div className="field"><label>Symptoms</label>
            <textarea placeholder="Describe what you've observed..." value={form.symptoms} onChange={(e) => set("symptoms", e.target.value)} />
          </div>
          <div className="field">
            <label>Location (for "nearby" alerts)</label>
            <button type="button" className={form.lat ? "btn-primary" : "btn-secondary"} onClick={handleUseLocation} disabled={locating} style={{ width: "100%" }}>
              {locating ? "Getting your location..." : form.lat ? `✓ Location captured (${form.lat.toFixed(4)}, ${form.lng.toFixed(4)})` : "📍 Use my current location"}
            </button>
            {locError && <div className="error-box" style={{ marginTop: 8 }}>{locError}</div>}
            <p className="meta" style={{ marginTop: 6 }}>Optional, but lets nearby farmers see how close this outbreak is.</p>
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? "Submitting..." : "Submit report"}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
