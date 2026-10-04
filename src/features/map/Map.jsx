import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { useLanguage } from "../../i18n/LanguageContext";
import { listAllLands } from "../lands/landsApi";
import { listVets } from "../vets/vetsApi";
import { listAlerts } from "../alerts/alertsApi";
import { getCurrentPosition } from "../../utils/geo";
import { getGoogleMapsApiKey, mapsApiKeyConfigured } from "../../config/googleMaps";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

const VIJAYAWADA = { lat: 16.5062, lng: 80.648 };

const MARKER_COLORS = {
  land: "#1F4025",
  vet: "#3E6E8E",
  alert: "#B23A2E",
  you: "#E4A020",
};

function markerIcon(color) {
  if (typeof google === "undefined" || !google.maps?.SymbolPath) return undefined;
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 8,
  };
}

function GoogleMapLayers({ center, layers, lands, vets, alerts, nav }) {
  const [openId, setOpenId] = useState(null);

  const youIcon = useMemo(() => markerIcon(MARKER_COLORS.you), []);
  const landIcon = useMemo(() => markerIcon(MARKER_COLORS.land), []);
  const vetIcon = useMemo(() => markerIcon(MARKER_COLORS.vet), []);
  const alertIcon = useMemo(() => markerIcon(MARKER_COLORS.alert), []);

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={11}
      options={{
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
      }}
    >
      <Marker
        position={center}
        icon={youIcon}
        onClick={() => setOpenId("you")}
      />
      {openId === "you" && (
        <InfoWindow position={center} onCloseClick={() => setOpenId(null)}>
          <span>You are here</span>
        </InfoWindow>
      )}

      {layers.lands && lands.map((l) => (
        <Marker
          key={`l-${l.id}`}
          position={{ lat: l.lat, lng: l.lng }}
          icon={landIcon}
          onClick={() => setOpenId(`l-${l.id}`)}
        />
      ))}
      {layers.lands && lands.map((l) => openId === `l-${l.id}` && (
        <InfoWindow
          key={`lw-${l.id}`}
          position={{ lat: l.lat, lng: l.lng }}
          onCloseClick={() => setOpenId(null)}
        >
          <div style={{ fontSize: 13, lineHeight: 1.35 }}>
            <b>{l.title}</b><br />
            {l.village}, {l.district}<br />
            <a href="#" onClick={(e) => { e.preventDefault(); nav(`/lands/${l.id}`); }}>View</a>
          </div>
        </InfoWindow>
      ))}

      {layers.vets && vets.map((v) => (
        <Marker
          key={`v-${v.id}`}
          position={{ lat: v.lat, lng: v.lng }}
          icon={vetIcon}
          onClick={() => setOpenId(`v-${v.id}`)}
        />
      ))}
      {layers.vets && vets.map((v) => openId === `v-${v.id}` && (
        <InfoWindow
          key={`vw-${v.id}`}
          position={{ lat: v.lat, lng: v.lng }}
          onCloseClick={() => setOpenId(null)}
        >
          <div style={{ fontSize: 13, lineHeight: 1.35 }}>
            <b>{v.name}</b><br />
            {v.designation}<br />
            <a href="#" onClick={(e) => { e.preventDefault(); nav(`/vets/${v.id}`); }}>View</a>
          </div>
        </InfoWindow>
      ))}

      {layers.alerts && alerts.map((a) => (
        <Marker
          key={`a-${a.id}`}
          position={{ lat: a.lat, lng: a.lng }}
          icon={alertIcon}
          onClick={() => setOpenId(`a-${a.id}`)}
        />
      ))}
      {layers.alerts && alerts.map((a) => openId === `a-${a.id}` && (
        <InfoWindow
          key={`aw-${a.id}`}
          position={{ lat: a.lat, lng: a.lng }}
          onCloseClick={() => setOpenId(null)}
        >
          <div style={{ fontSize: 13, lineHeight: 1.35 }}>
            <b>{a.disease}</b><br />
            {a.village}, {a.district}<br />
            <a href="#" onClick={(e) => { e.preventDefault(); nav(`/alerts/${a.id}`); }}>View</a>
          </div>
        </InfoWindow>
      ))}
    </GoogleMap>
  );
}

function GoogleMapPanel(props) {
  const apiKey = getGoogleMapsApiKey();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "jeevamitra-google-map",
    googleMapsApiKey: apiKey,
    preventGoogleFontsLoading: true,
  });

  if (loadError) {
    return (
      <div className="map-wrap map-wrap--placeholder" style={{ height: 420 }}>
        <p className="meta" style={{ padding: 16, textAlign: "center" }}>
          Map could not load. Check the Google Maps API key and enabled APIs.
        </p>
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="map-wrap map-wrap--placeholder" style={{ height: 420 }}>
        <p className="meta" style={{ padding: 16, textAlign: "center" }}>Loading map…</p>
      </div>
    );
  }
  return (
    <div className="map-wrap" style={{ height: 420 }}>
      <GoogleMapLayers {...props} />
    </div>
  );
}

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
    getCurrentPosition().then(setCenter).catch(() => {});
  }, []);

  function toggleLayer(key) {
    setLayers((l) => ({ ...l, [key]: !l[key] }));
  }

  const mapProps = { center, layers, lands, vets, alerts, nav };

  return (
    <div className="app-shell">
      <AppBar variant="top" title={t("map_title")} subtitle={t("map_subtitle")} onMap={() => nav("/map")} />
      <div className="content">
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, marginBottom: 14 }}>Map view</h1>
        {loading && (
          <div className="map-wrap map-wrap--placeholder" style={{ height: 420 }}>
            <p className="meta" style={{ padding: 16, textAlign: "center" }}>{t("loading")}</p>
          </div>
        )}
        {!loading && !mapsApiKeyConfigured() && (
          <div className="map-wrap map-wrap--placeholder" style={{ height: 420 }}>
            <p className="meta" style={{ padding: 16, textAlign: "center" }}>
              Set <code>VITE_GOOGLE_MAPS_API_KEY</code> before building. See docs/google-maps-setup.md.
            </p>
          </div>
        )}
        {!loading && mapsApiKeyConfigured() && <GoogleMapPanel {...mapProps} />}
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center", marginTop: 10 }}>{t("map_caption")}</p>
        <div className="chip-row">
          <button type="button" className={`chip ${layers.lands ? "active" : ""}`} onClick={() => toggleLayer("lands")}>🌾 Lands</button>
          <button type="button" className={`chip ${layers.vets ? "active" : ""}`} onClick={() => toggleLayer("vets")}>🩺 Vets</button>
          <button type="button" className={`chip ${layers.alerts ? "active" : ""}`} onClick={() => toggleLayer("alerts")}>🚨 Alerts</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
