import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLandHolding } from "./landHoldingsApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

export default function AddLandHolding() {
  const { user } = useAuth();
  const nav = useNavigate();
  const showToast = useToast();
  const [surveyNumber, setSurveyNumber] = useState("");
  const [extent, setExtent] = useState("");
  const [currentCrop, setCurrentCrop] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await createLandHolding(user.uid, { surveyNumber, extent, currentCrop });
      showToast("Land record saved");
      nav("/land-holdings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title="Add land record" onBack={() => nav(-1)} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Survey number</label>
            <input required value={surveyNumber} onChange={(e) => setSurveyNumber(e.target.value)} />
          </div>
          <div className="field"><label>Extent (acres)</label>
            <input required type="number" step="0.1" value={extent} onChange={(e) => setExtent(e.target.value)} />
          </div>
          <div className="field"><label>Current crop</label>
            <input value={currentCrop} onChange={(e) => setCurrentCrop(e.target.value)} placeholder="Optional" />
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
