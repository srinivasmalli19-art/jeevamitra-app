import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLandHolding } from "./landHoldingsApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../i18n/LanguageContext";

export default function AddLandHolding() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { t } = useLanguage();
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
      showToast(t("ex_land_record_saved"));
      nav("/land-holdings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_add_land_record")} onBack={() => nav(-1)} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>{t("ex_survey_number")}</label>
            <input required value={surveyNumber} onChange={(e) => setSurveyNumber(e.target.value)} />
          </div>
          <div className="field"><label>{t("ex_extent_acres")}</label>
            <input required type="number" step="0.1" value={extent} onChange={(e) => setExtent(e.target.value)} />
          </div>
          <div className="field"><label>{t("ex_current_crop")}</label>
            <input value={currentCrop} onChange={(e) => setCurrentCrop(e.target.value)} placeholder={t("ex_optional")} />
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? t("ex_saving") : t("save")}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
