import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useLanguage } from "../../i18n/LanguageContext";
import { listAllLands } from "../lands/landsApi";
import { listVets } from "../vets/vetsApi";
import { listAlerts } from "../alerts/alertsApi";
import { getCurrentPosition } from "../../utils/geo";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

const VIJAYAWADA = { lat: 16.5062, lng: 80.648 };

function dotIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}
const ICONS = {
  land: dotIcon("#1F4025"),
  vet: dotIcon("#3E6E8E"),
  alert: dotIcon("#B23A2E"),
  you: dotIcon("#E4A020"),
};

export default function Map() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [layers, setLayers] = useState({ lands: true, vets: true, alerts: true });
  const [lands, setLands] = useState([]);
  const [vets, setVets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [center, setCenter] = useState(VIJAYAWADA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAllLands(), listVets(), listAlerts()]).then(([l, v, a]) => {
      setLands(l.filter((x) => x.lat && x.lng));
      setVets(v.filter((x) => x.lat && x.lng));
      setAlerts(a.filter((x) => x.lat && x.lng));
      setLoading(false);
    });
    getCurrentPosition().then(setCenter).catch(() => {}); // opt-in-ish best-effort; falls back silently
  }, []);

  function toggleLayer(key) {
    setLayers((l) => ({ ...l, [key]: !l[key] }));
  }

  return (
    <div className="app-shell">
      <AppBar variant="top" title={t("map_title")} subtitle={t("map_subtitle")} onMap={() => nav("/map")} />
      <div className="content">
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, marginBottom: 14 }}>Map view</h1>
        <div className="map-wrap" style={{ height: 420 }}>
          {!loading && (
            <MapContainer center={[center.lat, center.lng]} zoom={11} style={{ width: "100%", height: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[center.lat, center.lng]} icon={ICONS.you}>
                <Popup>You are here</Popup>
              </Marker>
              {layers.lands && lands.map((l) => (
                <Marker key={`l-${l.id}`} position={[l.lat, l.lng]} icon={ICONS.land}>
                  <Popup>
                    <b>{l.title}</b><br />{l.village}, {l.district}<br />
                    <a href="#" onClick={(e) => { e.preventDefault(); nav(`/lands/${l.id}`); }}>View</a>
                  </Popup>
                </Marker>
              ))}
              {layers.vets && vets.map((v) => (
                <Marker key={`v-${v.id}`} position={[v.lat, v.lng]} icon={ICONS.vet}>
                  <Popup>
                    <b>{v.name}</b><br />{v.designation}<br />
                    <a href="#" onClick={(e) => { e.preventDefault(); nav(`/vets/${v.id}`); }}>View</a>
                  </Popup>
                </Marker>
              ))}
              {layers.alerts && alerts.map((a) => (
                <Marker key={`a-${a.id}`} position={[a.lat, a.lng]} icon={ICONS.alert}>
                  <Popup>
                    <b>{a.disease}</b><br />{a.village}, {a.district}<br />
                    <a href="#" onClick={(e) => { e.preventDefault(); nav(`/alerts/${a.id}`); }}>View</a>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center", marginTop: 10 }}>{t("map_caption")}</p>
        <div className="chip-row">
          <button className={`chip ${layers.lands ? "active" : ""}`} onClick={() => toggleLayer("lands")}>🌾 Lands</button>
          <button className={`chip ${layers.vets ? "active" : ""}`} onClick={() => toggleLayer("vets")}>🩺 Vets</button>
          <button className={`chip ${layers.alerts ? "active" : ""}`} onClick={() => toggleLayer("alerts")}>🚨 Alerts</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
