import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listMyLivestock, deleteLivestock } from "./livestockApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../i18n/LanguageContext";
import { livestockLabel } from "../../i18n/labels";

const ICONS = { Cattle: "🐄", Buffalo: "🐃", Goat: "🐐", Sheep: "🐑", Other: "🐾" };

export default function LivestockList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { t, tf } = useLanguage();
  const showToast = useToast();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const data = await listMyLivestock(user.uid);
    setAnimals(data);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [user.uid]);

  async function handleDelete(id) {
    if (!confirm(t("ex_remove_entry"))) return;
    await deleteLivestock(id);
    showToast(t("ex_removed"));
    refresh();
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_my_livestock")} onBack={() => nav(-1)} />
      <div className="content">
        <Link to="/livestock/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ marginBottom: 14 }}>{t("ex_add_animal_btn")}</button>
        </Link>
        {loading && <p className="meta">{t("loading")}</p>}
        {!loading && animals.length === 0 && (
          <div className="empty-state"><div className="glyph">🐄</div><h3>{t("ex_no_livestock_title")}</h3><p>{t("ex_no_livestock_body")}</p></div>
        )}
        {animals.map((a) => (
          <div key={a.id} className="card" style={{ cursor: "default", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="card-title">{ICONS[a.type] || "🐾"} {a.type === "Other" ? a.customType || livestockLabel(t, "Other") : livestockLabel(t, a.type)}</div>
              <div className="meta">{tf("ex_count_n", { n: a.count })}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to={`/livestock/${a.id}/edit`} style={{ textDecoration: "none" }}>
                <button className="btn-secondary" style={{ width: "auto", padding: "8px 14px" }}>{t("edit")}</button>
              </Link>
              <button className="btn-danger" style={{ width: "auto", padding: "8px 14px" }} onClick={() => handleDelete(a.id)}>{t("delete")}</button>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
