# Google Maps setup (JeevaMitra)

The Map screen uses the **Google Maps JavaScript API** inside the Capacitor WebView (same React bundle as the web app). Leaflet/OpenStreetMap is no longer used.

## 1. Google Cloud Console (project linked to Firebase `jeeva-575fd`)

1. Open [Google Cloud Console](https://console.cloud.google.com/) → select the Firebase project.
2. **APIs & Services → Library** → enable **Maps JavaScript API**.
3. **APIs & Services → Credentials → Create credentials → API key**.

## 2. Restrict the API key (recommended)

Use **Application restrictions**:

| Build target | Restriction type | Value |
| --- | --- | --- |
| Local dev (`npm run dev`) | HTTP referrers | `http://localhost:*` |
| Capacitor Android/iOS WebView | HTTP referrers | `https://localhost/*` |
| Firebase Hosting (if used) | HTTP referrers | `https://<your-hosting-domain>/*` |

Use **API restrictions** → allow only **Maps JavaScript API**.

Do **not** commit the key in Dart/JS source. Set it via environment variable at build time:

```bash
# .env.production (local only, gitignored)
VITE_GOOGLE_MAPS_API_KEY=your_key_here
npm run build
npm run android:sync
```

## 3. Android / iOS native note

This app renders the map in the **WebView**, so you do **not** need the Android Maps SDK `meta-data` entry unless you add a native Google Maps Capacitor plugin later. The Play Store AAB only needs a valid `VITE_GOOGLE_MAPS_API_KEY` baked into the web bundle at build time.

If you later switch to the native Maps SDK, add the key to:

- Android: `AndroidManifest.xml` → `com.google.android.geo.API_KEY`
- iOS: `AppDelegate` / `Info.plist` → `GMSApiKey`

## 4. Verify

```bash
npm run build
npm run preview
```

Open `/map` — tiles should be Google Maps (no “Leaflet | OpenStreetMap” attribution).
