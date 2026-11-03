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
import { useLanguage } from "../../i18n/LanguageContext";
import { speciesLabel, severityLabel, errText, SPECIES_OPTIONS } from "../../i18n/labels";

export default function ReportAlert() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const showToast = useToast();
  const { t, tf } = useLanguage();
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
      setLocError(errText(t, err));
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
      showToast(t("ex_alert_reported"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_report_alert_title")} onBack={() => nav(-1)} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>{t("ex_disease")}</label>
            <input required placeholder={tf("ex_eg", { x: t("ex_fmd") })} value={form.disease} onChange={(e) => set("disease", e.target.value)} />
          </div>
          <div className="row">
            <div className="field"><label>{t("ex_species")}</label>
              <select value={form.species} onChange={(e) => set("species", e.target.value)}>
                {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{speciesLabel(t, s)}</option>)}
              </select>
            </div>
            <div className="field"><label>{t("ex_severity")}</label>
              <select value={form.severity} onChange={(e) => set("severity", e.target.value)}>
                {["low", "medium", "high"].map((s) => <option key={s} value={s}>{severityLabel(t, s)}</option>)}
              </select>
            </div>
          </div>
          <LocationPicker value={form} onChange={(next) => setForm((f) => ({ ...f, ...next }))} />
          <div className="field"><label>{t("ex_symptoms")}</label>
            <textarea placeholder={t("ex_describe_symptoms")} value={form.symptoms} onChange={(e) => set("symptoms", e.target.value)} />
          </div>
          <div className="field">
            <label>{t("ex_location_nearby_alerts")}</label>
            <button type="button" className={form.lat ? "btn-primary" : "btn-secondary"} onClick={handleUseLocation} disabled={locating} style={{ width: "100%" }}>
              {locating ? t("ex_getting_location") : form.lat ? tf("ex_location_captured", { lat: form.lat.toFixed(4), lng: form.lng.toFixed(4) }) : t("ex_use_my_location")}
            </button>
            {locError && <div className="error-box" style={{ marginTop: 8 }}>{locError}</div>}
            <p className="meta" style={{ marginTop: 6 }}>{t("ex_alert_location_hint")}</p>
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? t("ex_submitting") : t("ex_submit_report")}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
