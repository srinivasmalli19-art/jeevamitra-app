// Google Maps JavaScript API key for the in-app map (Capacitor WebView / browser).
// Set at build time via VITE_GOOGLE_MAPS_API_KEY — never commit the real key.
// See docs/google-maps-setup.md for Cloud Console + Android/iOS restrictions.

export function getGoogleMapsApiKey() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === "string" ? key.trim() : "";
}

export function mapsApiKeyConfigured() {
  return getGoogleMapsApiKey().length > 0;
}
