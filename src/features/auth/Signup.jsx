import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import LocationPicker from "../../components/LocationPicker";
import { OTHER_DISTRICT } from "../../data/indiaLocations";
import AppBar from "../../components/AppBar";

export default function Signup() {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", phone: "", state: "Andhra Pradesh", district: "", districtOther: "", mandal: "", village: "",
    profileType: "livestock", email: "", password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function setLocation(next) { setForm((f) => ({ ...f, ...next })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const district = form.district === OTHER_DISTRICT ? form.districtOther : form.district;
      await signup({ ...form, district });
      nav("/");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <AppBar variant="top" title={t("signup_title")} subtitle="JeevaMitra" />
      <div className="content">
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><label>{t("fullName")}</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="field"><label>{t("phone")}</label>
            <input required type="tel" placeholder={t("ex_phone_placeholder")} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <LocationPicker value={form} onChange={setLocation} />
          <div className="field"><label>{t("ex_i_mainly")}</label>
            <select value={form.profileType} onChange={(e) => set("profileType", e.target.value)}>
              <option value="livestock">{t("ex_own_livestock")}</option>
              <option value="land">{t("ex_provide_land")}</option>
              <option value="both">{t("ex_both")}</option>
            </select>
          </div>
          <div className="field"><label>{t("email")}</label>
            <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="field"><label>{t("password")}</label>
            <input required type="password" minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} />
          </div>
          <button className="btn-primary" disabled={loading}>{loading ? t("ex_creating_account") : t("signup_button")}</button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
          {t("have_account")} <Link to="/login">{t("login_button")}</Link>
        </p>
      </div>
    </div>
  );
}
