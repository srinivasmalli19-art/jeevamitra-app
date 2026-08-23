// Haversine formula — great-circle distance between two lat/lng points, in km.
export function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v === null || v === undefined)) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Wraps the browser's Geolocation API in a Promise. Rejects with a
// human-readable message if location is denied or unavailable.
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser doesn't support location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location permission denied. Please allow location access and try again."));
        } else {
          reject(new Error("Couldn't get your location. Please try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function formatDistance(km) {
  if (km === null || km === undefined) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Google Maps' free "universal link" for directions — no API key needed.
// Opens the Maps app on a phone, or maps.google.com in a browser, already
// routed from the person's current location to this destination.
export function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// WhatsApp's free share link — no API key needed. Opens WhatsApp (app or
// web) with this text pre-filled in a new message, ready for the person
// to pick who to send it to.
export function whatsappShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

