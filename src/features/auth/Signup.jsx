import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LocationPicker from "../../components/LocationPicker";
import { OTHER_DISTRICT } from "../../data/indiaLocations";
import AppBar from "../../components/AppBar";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", state: "Andhra Pradesh", district: "", districtOther: "", mandal: "", village: "",
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
      <AppBar variant="top" title="Create your account" subtitle="JeevaMitra" />
      <div className="content">
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Full name</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <LocationPicker value={form} onChange={setLocation} />
          <div className="field"><label>I mainly...</label>
            <select value={form.profileType} onChange={(e) => set("profileType", e.target.value)}>
              <option value="livestock">Own livestock</option>
              <option value="land">Provide grazing/fodder land</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="field"><label>Email</label>
            <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="field"><label>Password</label>
            <input required type="password" minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} />
          </div>
          <button className="btn-primary" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
