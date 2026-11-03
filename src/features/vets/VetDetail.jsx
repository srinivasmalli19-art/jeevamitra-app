import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVet, deleteVetProfile } from "./vetsApi";
import { useAuth } from "../../context/AuthContext";
import { directionsUrl } from "../../utils/geo";
import { useToast } from "../../components/ToastContext";
import Avatar from "../../components/Avatar";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../i18n/LanguageContext";
import { vetLabel } from "../../i18n/labels";

export default function VetDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isAdmin } = useAuth();
  const showToast = useToast();
  const { t, tf } = useLanguage();
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVet(id).then((v) => { setVet(v); setLoading(false); });
  }, [id]);

  if (loading) return <div className="app-shell"><div className="content"><p className="meta">{t("loading")}</p></div></div>;
  if (!vet || vet.hidden === true) return <div className="app-shell"><div className="content"><p>{t("ex_vet_not_found")}</p></div></div>;

  async function handleDelete() {
    if (!confirm(t("ex_remove_vet_confirm"))) return;
    await deleteVetProfile(vet.id);
    showToast(t("ex_vet_removed"));
    nav("/vets");
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_vet_profile")} onBack={() => nav(-1)} />
      <div className="content">
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <Avatar name={vet.name} photoUrl={vet.photoUrl} size={64} />
          <div>
            <div className="card-title" style={{ margin: "0 0 4px" }}>{vet.name}</div>
            <div className="meta" style={{ marginBottom: 6 }}>{vetLabel(t, vet.designation)}</div>
            <span className={`pill ${vet.sector === "Government" ? "pill-sky" : "pill-gold"}`}>{vetLabel(t, vet.sector)}</span>{" "}
            {vet.rating && <span className="pill pill-green">★ {vet.rating}</span>}
          </div>
        </div>
        <div className="card" style={{ cursor: "default" }}>
          <div className="kv-row"><span className="k">{t("ex_experience")}</span><span className="v">{tf("ex_n_years", { n: vet.experienceYears })}</span></div>
          <div className="kv-row"><span className="k">{t("ex_languages")}</span><span className="v">{(vet.languages || []).map((l) => vetLabel(t, l)).join(", ")}</span></div>
          <div className="kv-row"><span className="k">{t("ex_availability")}</span><span className="v">{vetLabel(t, vet.availability)}</span></div>
          <div className="kv-row"><span className="k">{t("ex_location")}</span><span className="v">{vet.village}, {vet.district}</span></div>
        </div>
        {vet.services && vet.services.length > 0 && (
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-title" style={{ fontSize: 13.5, marginBottom: 8 }}>{t("ex_services")}</div>
            {vet.services.map((s) => <span key={s} className="pill pill-sky" style={{ marginRight: 6, marginBottom: 6, display: "inline-block" }}>{vetLabel(t, s)}</span>)}
          </div>
        )}
        <div className="row" style={{ marginTop: 10 }}>
          <a href={`tel:${vet.phone}`} style={{ flex: 1, textDecoration: "none" }}>
            <button className="btn-primary" style={{ width: "100%" }}>{t("call")}</button>
          </a>
          <a href={`https://wa.me/91${vet.phone}`} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: "none" }}>
            <button className="btn-secondary" style={{ width: "100%" }}>{t("whatsapp")}</button>
          </a>
        </div>
        {vet.lat && vet.lng && (
          <a href={directionsUrl(vet.lat, vet.lng)} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <button className="btn-secondary" style={{ width: "100%", marginTop: 9 }}>{t("ex_get_directions")}</button>
          </a>
        )}
        {isAdmin && (
          <button className="btn-danger" style={{ marginTop: 12 }} onClick={handleDelete}>{t("ex_remove_vet_admin")}</button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
