import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVet, deleteVetProfile } from "./vetsApi";
import { useAuth } from "../../context/AuthContext";
import { directionsUrl } from "../../utils/geo";
import BottomNav from "../../components/BottomNav";

export default function VetDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isAdmin } = useAuth();
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVet(id).then((v) => { setVet(v); setLoading(false); });
  }, [id]);

  if (loading) return <div className="app-shell"><div className="content"><p className="meta">Loading...</p></div></div>;
  if (!vet) return <div className="app-shell"><div className="content"><p>Vet not found.</p></div></div>;

  async function handleDelete() {
    if (!confirm("Remove this vet from the directory?")) return;
    await deleteVetProfile(vet.id);
    nav("/vets");
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{vet.name}</h1><div className="sub">{vet.designation}</div></div>
      <div className="content">
        {vet.photoUrl && (
          <img src={vet.photoUrl} alt={vet.name} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 14, marginBottom: 14 }} />
        )}
        <div style={{ marginBottom: 10 }}>
          <span className={`pill ${vet.sector === "Government" ? "pill-sky" : "pill-gold"}`}>{vet.sector}</span>{" "}
          {vet.rating && <span className="pill pill-green">★ {vet.rating}</span>}
        </div>
        <div className="card" style={{ cursor: "default" }}>
          <div className="meta">Experience: <b>{vet.experienceYears} years</b></div>
          <div className="meta">Languages: <b>{(vet.languages || []).join(", ")}</b></div>
          <div className="meta">Availability: <b>{vet.availability}</b></div>
          <div className="meta">Location: <b>{vet.village}, {vet.district}</b></div>
        </div>
        {vet.services && vet.services.length > 0 && (
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-title" style={{ fontSize: 13.5, marginBottom: 8 }}>Services offered</div>
            {vet.services.map((s) => <span key={s} className="pill pill-sky" style={{ marginRight: 6, marginBottom: 6, display: "inline-block" }}>{s}</span>)}
          </div>
        )}
        <div className="row" style={{ marginTop: 10 }}>
          <a href={`tel:${vet.phone}`} style={{ flex: 1, textDecoration: "none" }}>
            <button className="btn-primary" style={{ width: "100%" }}>Call</button>
          </a>
          <a href={`https://wa.me/91${vet.phone}`} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: "none" }}>
            <button className="btn-secondary" style={{ width: "100%" }}>WhatsApp</button>
          </a>
        </div>
        {vet.lat && vet.lng && (
          <a href={directionsUrl(vet.lat, vet.lng)} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <button className="btn-secondary" style={{ width: "100%", marginTop: 9 }}>📍 Get directions</button>
          </a>
        )}
        {isAdmin && (
          <button className="btn-danger" style={{ marginTop: 12 }} onClick={handleDelete}>Remove from directory (admin)</button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
