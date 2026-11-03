import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listVets } from "./vetsApi";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { getCurrentPosition, distanceKm } from "../../utils/geo";
import { vetLabel, errText } from "../../i18n/labels";
import { listMyNotifications } from "../notifications/notificationsApi";
import Avatar from "../../components/Avatar";
import AppBar from "../../components/AppBar";
import BottomSheet from "../../components/BottomSheet";
import BottomNav from "../../components/BottomNav";
import NotificationsSheet from "../notifications/NotificationsSheet";

export default function VetsList() {
  const { user, isAdmin } = useAuth();
  const { t, tf } = useLanguage();
  const nav = useNavigate();
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [designation, setDesignation] = useState("all");
  const [sortByRating, setSortByRating] = useState(false);
  const [myLoc, setMyLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    listVets().then((data) => { setVets(data); setLoading(false); });
  }, []);
  useEffect(() => {
    listMyNotifications(user.uid)
      .then((data) => setUnread(data.filter((n) => !n.read).length))
      .catch(() => setUnread(0));
  }, [user.uid]);

  async function handleFindNearMe() {
    setLocating(true);
    setLocError("");
    try {
      const pos = await getCurrentPosition();
      setMyLoc(pos);
      setSortByRating(false); // distance takes priority when both are on
    } catch (err) {
      setLocError(errText(t, err));
    } finally {
      setLocating(false);
    }
  }

  let filtered = vets.filter((v) => {
    const s = q.toLowerCase();
    const matchQ = !s || v.name.toLowerCase().includes(s) || v.village.toLowerCase().includes(s) || v.district.toLowerCase().includes(s);
    const matchSector = sector === "all" || v.sector === sector;
    const matchDesig = designation === "all" || v.designation === designation;
    return matchQ && matchSector && matchDesig;
  });

  if (myLoc) {
    filtered = filtered
      .map((v) => ({ ...v, _dist: distanceKm(myLoc.lat, myLoc.lng, v.lat, v.lng) }))
      .sort((a, b) => {
        if (a._dist === null) return 1;
        if (b._dist === null) return -1;
        return a._dist - b._dist;
      });
  } else if (sortByRating) {
    filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return (
    <div className="app-shell">
      <AppBar
        variant="top"
        title={t("vets_title")}
        subtitle={t("vets_subtitle")}
        onMap={() => nav("/map")}
        onBell={() => setNotifOpen(true)}
        unread={unread > 0}
      />
      <div className="content">
        {isAdmin && (
          <Link to="/vets/new" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ marginBottom: 14 }}>{t("ex_add_vet_admin")}</button>
          </Link>
        )}

        <div className="searchbar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <input placeholder={t("ex_search_vets")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <button className={myLoc ? "btn-primary" : "btn-secondary"} style={{ marginBottom: 14 }} onClick={handleFindNearMe} disabled={locating}>
          {locating ? t("ex_finding_location") : myLoc ? t("ex_sorted_by_distance") : t("ex_find_vets_near")}
        </button>
        {locError && <div className="error-box">{locError}</div>}

        <p className="meta" style={{ margin: "0 0 6px" }}>{t("ex_sector")}</p>
        <div className="chip-row" style={{ marginBottom: 10 }}>
          {["all", "Government", "Private"].map((s) => (
            <button key={s} className={`chip ${sector === s ? "active" : ""}`} onClick={() => setSector(s)}>
              {s === "all" ? t("ex_all") : vetLabel(t, s)}
            </button>
          ))}
        </div>

        <p className="meta" style={{ margin: "0 0 6px" }}>{t("ex_designation")}</p>
        <div className="chip-row" style={{ marginBottom: 10 }}>
          {["all", "Veterinary Officer", "Veterinary Assistant"].map((d) => (
            <button key={d} className={`chip ${designation === d ? "active" : ""}`} onClick={() => setDesignation(d)}>
              {d === "all" ? t("ex_all") : vetLabel(t, d)}
            </button>
          ))}
        </div>

        {!myLoc && (
          <div className="chip-row" style={{ marginBottom: 14 }}>
            <button className={`chip ${sortByRating ? "active" : ""}`} onClick={() => setSortByRating((v) => !v)}>
              {t("ex_sort_by_rating")} {sortByRating ? "✓" : ""}
            </button>
          </div>
        )}

        {loading && <p className="meta">{t("ex_loading_vets")}</p>}
        {!loading && filtered.length === 0 && (
          <div className="empty-state"><div className="glyph">🩺</div><h3>{t("ex_no_vets_title")}</h3><p>{t("ex_no_vets_body")}</p></div>
        )}
        {filtered.map((v) => (
          <Link key={v.id} to={`/vets/${v.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Avatar name={v.name} photoUrl={v.photoUrl} size={54} />
              <div>
                <div className="card-title">{v.name}</div>
                <div className="meta">{vetLabel(t, v.designation)} · {tf("ex_n_years_exp", { n: v.experienceYears })}</div>
                <div style={{ marginTop: 6 }}>
                  <span className={`pill ${v.sector === "Government" ? "pill-sky" : "pill-gold"}`}>{vetLabel(t, v.sector)}</span>{" "}
                  {v.rating && <span className="pill pill-green">★ {v.rating}</span>}{" "}
                  {myLoc && v._dist !== null && <span className="pill pill-sky">{tf("ex_km_away", { n: v._dist.toFixed(1) })}</span>}{" "}
                  <span className="meta" style={{ display: "inline" }}>{v.village}, {v.district}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <BottomSheet open={notifOpen} onClose={() => setNotifOpen(false)} title={t("notifications_title")}>
        <NotificationsSheet />
      </BottomSheet>
      <BottomNav />
    </div>
  );
}
