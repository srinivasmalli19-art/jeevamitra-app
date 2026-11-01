import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createLivestock, getLivestock, updateLivestock } from "./livestockApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../i18n/LanguageContext";
import { livestockLabel, LIVESTOCK_OPTIONS } from "../../i18n/labels";

export default function AddLivestock() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const nav = useNavigate();
  const { t } = useLanguage();
  const showToast = useToast();
  const [type, setType] = useState("Cattle");
  const [customType, setCustomType] = useState("");
  const [count, setCount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    getLivestock(id).then((a) => {
      if (a) {
        setType(a.type);
        setCustomType(a.customType || "");
        setCount(String(a.count));
      }
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isEdit) {
        await updateLivestock(id, { type, customType, count });
        showToast(t("ex_updated"));
      } else {
        await createLivestock(user.uid, { type, customType, count });
        showToast(t("ex_livestock_added"));
      }
      nav("/livestock");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="app-shell"><div className="content"><p className="meta">{t("loading")}</p></div></div>;

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={isEdit ? t("ex_edit_animal") : t("ex_add_animal")} onBack={() => nav(-1)} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>{t("ex_type")}</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {LIVESTOCK_OPTIONS.map((o) => <option key={o} value={o}>{livestockLabel(t, o)}</option>)}
            </select>
          </div>
          {type === "Other" && (
            <div className="field"><label>{t("ex_specify_type")}</label>
              <input required value={customType} onChange={(e) => setCustomType(e.target.value)} />
            </div>
          )}
          <div className="field"><label>{t("ex_count")}</label>
            <input required type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? t("ex_saving") : t("save")}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
