import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LocationPicker from "../../components/LocationPicker";
import { OTHER_DISTRICT } from "../../data/indiaLocations";
import BottomNav from "../../components/BottomNav";

export default function EditProfile() {
  const { profile, saveProfile } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState(profile?.name || "");
  const [location, setLocation] = useState({
    state: profile?.state || "Andhra Pradesh",
    district: profile?.district || "",
    districtOther: "",
    mandal: profile?.mandal || "",
    village: profile?.village || "",
  });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const district = location.district === OTHER_DISTRICT ? location.districtOther : location.district;
      await saveProfile({ name, ...location, district });
      nav("/profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>Edit profile</h1></div>
      <div className="content">
        {!profile?.name && (
          <div className="error-box" style={{ background: "var(--pasture-pale)", color: "var(--pasture)" }}>
            Your profile info was never saved (a one-time setup issue). Fill this in once to fix it.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <LocationPicker value={location} onChange={setLocation} />
          <button className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
