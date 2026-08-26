import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLand, deleteLand } from "./landsApi";
import { requestBooking } from "./bookingsApi";
import { useAuth } from "../../context/AuthContext";
import { directionsUrl, whatsappShareUrl } from "../../utils/geo";
import { useToast } from "../../components/ToastContext";
import BottomNav from "../../components/BottomNav";

export default function LandDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const showToast = useToast();
  const [land, setLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getLand(id).then((l) => { setLand(l); setLoading(false); });
  }, [id]);

  if (loading) return <div className="app-shell"><div className="content"><p className="meta">Loading...</p></div></div>;
  if (!land) return <div className="app-shell"><div className="content"><p>Land not found.</p></div></div>;

  const isOwner = land.ownerId === user.uid;

  function overlapsExisting(f, t) {
    return (land.bookedRanges || []).some((r) => f <= r.to && r.from <= t);
  }

  async function handleRequest(e) {
    e.preventDefault();
    setMsg("");
    if (!from || !to || from > to) { setMsg("Pick a valid date range."); return; }
    if (overlapsExisting(from, to)) {
      setMsg("Those dates are already confirmed for another booking. Try different dates.");
      return;
    }
    setBusy(true);
    try {
      await requestBooking({
        landId: land.id, landTitle: land.title, ownerId: land.ownerId,
        requesterId: user.uid, requesterName: profile?.name || "Someone",
        from, to,
      });
      setMsg("Booking request sent to the owner.");
      showToast("Booking request sent!");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this land listing?")) return;
    await deleteLand(land.id);
    showToast("Listing deleted");
    nav("/lands/mine");
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>{land.title}</h1><div className="sub">{land.village}, {land.district}</div></div>
      <div className="content">
        {land.photoUrl ? (
          <img src={land.photoUrl} alt={land.title} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 14, marginBottom: 14 }} />
        ) : (
          <div className="land-thumb-fallback" style={{ width: "100%", height: 140, marginBottom: 14, fontSize: 44 }}>🌾</div>
        )}
        <div className="card" style={{ cursor: "default" }}>
          <div className="meta">Acres: <b>{land.acres}</b></div>
          <div className="meta">Price: <span className="price">₹{land.price}/{land.unit}</span></div>
          {land.description && <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 10 }}>{land.description}</p>}
        </div>

        {(land.bookedRanges || []).length > 0 && (
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-title" style={{ fontSize: 13.5 }}>Confirmed blocked dates</div>
            {land.bookedRanges.map((r, i) => (
              <div key={i} className="meta">{r.from} → {r.to}</div>
            ))}
          </div>
        )}

        <div className="row" style={{ marginBottom: 12 }}>
          {land.lat && land.lng && (
            <a href={directionsUrl(land.lat, land.lng)} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: "none" }}>
              <button className="btn-secondary" style={{ width: "100%" }}>📍 Get directions</button>
            </a>
          )}
          <a
            href={whatsappShareUrl(`Check out this land on JeevaMitra: ${land.title} — ${land.village}, ${land.district} — ₹${land.price}/${land.unit}, ${land.acres} acres.${land.lat ? ` Location: ${directionsUrl(land.lat, land.lng)}` : ""}`)}
            target="_blank"
            rel="noreferrer"
            style={{ flex: 1, textDecoration: "none" }}
          >
            <button className="btn-secondary" style={{ width: "100%" }}>Share on WhatsApp</button>
          </a>
        </div>

        {isOwner ? (
          <div className="row">
            <button className="btn-danger" onClick={handleDelete}>Delete listing</button>
          </div>
        ) : (
          <form onSubmit={handleRequest}>
            <div className="row">
              <div className="field"><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className="field"><label>To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            </div>
            {msg && <div className="error-box">{msg}</div>}
            <button className="btn-primary" disabled={busy}>{busy ? "Sending..." : "Request booking"}</button>
          </form>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
