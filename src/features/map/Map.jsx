import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { useLanguage } from "../../i18n/LanguageContext";
import { listAllLands } from "../lands/landsApi";
import { listVets } from "../vets/vetsApi";
import { listAlerts } from "../alerts/alertsApi";
import { getCurrentPosition } from "../../utils/geo";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

const VIJAYAWADA = { lat: 16.5062, lng: 80.648 };
const MAP_ZOOM = 11;

const MARKER_COLORS = {
  land: "#1F4025",
  vet: "#3E6E8E",
  alert: "#B23A2E",
  you: "#E4A020",
};

function getMapsApiKey() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === "string" ? key.trim() : "";
}

function mapsApiKeyConfigured() {
  return getMapsApiKey().length > 0;
}

let loaderOptionsSet = false;

function ensureLoaderOptions(key) {
  if (!loaderOptionsSet) {
    setOptions({ key });
    loaderOptionsSet = true;
  }
}

function circleMarkerIcon(color) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 8,
  };
}

function appendViewLink(container, label, onView) {
  container.appendChild(document.createElement("br"));
  const a = document.createElement("a");
  a.href = "#";
  a.textContent = label;
  a.addEventListener("click", (e) => {
    e.preventDefault();
    onView();
  });
  container.appendChild(a);
}

function landInfoContent(land, nav) {
  const div = document.createElement("div");
  div.style.fontSize = "13px";
  div.style.lineHeight = "1.35";
  const title = document.createElement("b");
  title.textContent = land.title || "";
  div.appendChild(title);
  div.appendChild(document.createElement("br"));
  div.appendChild(document.createTextNode(`${land.village || ""}, ${land.district || ""}`));
  appendViewLink(div, "View", () => nav(`/lands/${land.id}`));
  return div;
}

function vetInfoContent(vet, nav) {
  const div = document.createElement("div");
  div.style.fontSize = "13px";
  div.style.lineHeight = "1.35";
  const name = document.createElement("b");
  name.textContent = vet.name || "";
  div.appendChild(name);
  div.appendChild(document.createElement("br"));
  div.appendChild(document.createTextNode(vet.designation || ""));
  appendViewLink(div, "View", () => nav(`/vets/${vet.id}`));
  return div;
}

function alertInfoContent(alert, nav) {
  const div = document.createElement("div");
  div.style.fontSize = "13px";
  div.style.lineHeight = "1.35";
  const title = document.createElement("b");
  title.textContent = alert.disease || "";
  div.appendChild(title);
  div.appendChild(document.createElement("br"));
  div.appendChild(document.createTextNode(`${alert.village || ""}, ${alert.district || ""}`));
  appendViewLink(div, "View", () => nav(`/alerts/${alert.id}`));
  return div;
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
  const [mapStatus, setMapStatus] = useState("idle");

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    Promise.all([listAllLands(), listVets(), listAlerts()]).then(([l, v, a]) => {
      setLands(l.filter((x) => x.lat && x.lng));
      setVets(v.filter((x) => x.lat && x.lng));
      setAlerts(a.filter((x) => x.lat && x.lng));
      setLoading(false);
    });
    getCurrentPosition().then(setCenter).catch(() => {});
  }, []);

  useEffect(() => {
    if (loading || !mapsApiKeyConfigured() || !mapContainerRef.current) return undefined;

    let cancelled = false;
    setMapStatus("loading");

    (async () => {
      try {
        ensureLoaderOptions(getMapsApiKey());
        const { Map: GoogleMapCtor, InfoWindow } = await importLibrary("maps");
        if (cancelled || !mapContainerRef.current) return;

        const map = new GoogleMapCtor(mapContainerRef.current, {
          center,
          zoom: MAP_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;
        infoWindowRef.current = new InfoWindow();
        if (!cancelled) setMapStatus("ready");
      } catch {
        if (!cancelled) setMapStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      for (const marker of markersRef.current) {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      }
      markersRef.current = [];
      mapRef.current = null;
      setMapStatus("idle");
    };
  }, [loading]);

  useEffect(() => {
    mapRef.current?.setCenter(center);
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    if (mapStatus !== "ready" || !map || !infoWindow) return undefined;

    infoWindow.close();
    for (const marker of markersRef.current) {
      google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    }
    markersRef.current = [];

    const youMarker = new google.maps.Marker({
      map,
      position: center,
      icon: circleMarkerIcon(MARKER_COLORS.you),
    });
    youMarker.addListener("click", () => {
      infoWindow.setContent(document.createTextNode("You are here"));
      infoWindow.open({ map, anchor: youMarker });
    });
    markersRef.current.push(youMarker);

    if (layers.lands) {
      for (const l of lands) {
        const marker = new google.maps.Marker({
          map,
          position: { lat: l.lat, lng: l.lng },
          icon: circleMarkerIcon(MARKER_COLORS.land),
        });
        marker.addListener("click", () => {
          infoWindow.setContent(landInfoContent(l, nav));
          infoWindow.open({ map, anchor: marker });
        });
        markersRef.current.push(marker);
      }
    }

    if (layers.vets) {
      for (const v of vets) {
        const marker = new google.maps.Marker({
          map,
          position: { lat: v.lat, lng: v.lng },
          icon: circleMarkerIcon(MARKER_COLORS.vet),
        });
        marker.addListener("click", () => {
          infoWindow.setContent(vetInfoContent(v, nav));
          infoWindow.open({ map, anchor: marker });
        });
        markersRef.current.push(marker);
      }
    }

    if (layers.alerts) {
      for (const a of alerts) {
        const marker = new google.maps.Marker({
          map,
          position: { lat: a.lat, lng: a.lng },
          icon: circleMarkerIcon(MARKER_COLORS.alert),
        });
        marker.addListener("click", () => {
          infoWindow.setContent(alertInfoContent(a, nav));
          infoWindow.open({ map, anchor: marker });
        });
        markersRef.current.push(marker);
      }
    }

    return () => {
      infoWindow.close();
      for (const marker of markersRef.current) {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      }
      markersRef.current = [];
    };
  }, [mapStatus, layers, lands, vets, alerts, center, nav]);

  function toggleLayer(key) {
    setLayers((l) => ({ ...l, [key]: !l[key] }));
  }

  return (
    <div className="app-shell">
      <AppBar variant="top" title={t("map_title")} subtitle={t("map_subtitle")} onMap={() => nav("/map")} />
      <div className="content">
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, marginBottom: 14 }}>Map view</h1>
        <div className="map-wrap" style={{ height: 420 }}>
          {!loading && mapsApiKeyConfigured() && (
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
          )}
          {!loading && !mapsApiKeyConfigured() && (
            <p className="meta" style={{ padding: 16, textAlign: "center" }}>
              Set <code>VITE_GOOGLE_MAPS_API_KEY</code> to enable the map.
            </p>
          )}
          {!loading && mapsApiKeyConfigured() && mapStatus === "error" && (
            <p className="meta" style={{ padding: 16, textAlign: "center" }}>
              Map could not load. Check the Google Maps API key and enabled APIs.
            </p>
          )}
        </div>
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
