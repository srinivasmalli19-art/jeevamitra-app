# Play Store messaging — production checklist

Symptom: **Contact publisher** (or the Messages tab) works when testing with the Firebase **Emulator** or after local rules changes, but fails on the **Play Store** build with **“Missing or insufficient permissions.”**

## Root cause (typical)

The Play Store app talks to the **live** Firebase project (`jeeva-575fd`) using the web config embedded at `vite build` time (`src/firebase/config.js`). Messaging uses the `interactions` collection and subcollection rules in **`firestore.rules`**.

Local emulator tests load **`firestore.rules` from this repo automatically**. The live project does **not** — until you publish those rules, Firestore denies reads/writes and Firebase returns `permission-denied`.

The Contact Publisher flow runs `getOrCreatePublicationInteraction()`, which **reads** the interaction document inside a transaction **before it exists**. Live rules must include `resource == null` on interaction reads (already in this repo since commit `4a99bb0`).

## Fix (required once per rules change)

From a machine logged into Firebase CLI:

```bash
npm run deploy:firestore-rules
```

Or in Firebase Console → **Firestore → Rules** → paste `firestore.rules` → **Publish**.

## Verify same Firebase project

| Check | Expected |
| --- | --- |
| `src/firebase/config.js` → `projectId` | `jeeva-575fd` |
| `.firebaserc` default project | `jeeva-575fd` |
| Android `applicationId` | `com.jeevamitra.app` |
| Play Store AAB built from this repo after `npm run build` | Same embedded `firebaseConfig` |

`google-services.json` (gitignored) affects native Firebase plugins only; **Firestore in this app uses the JS SDK config above**, not `google-services.json`.

## Other checks (if rules are published and it still fails)

- **Authentication**: Play Store users must be signed in (same Email/Password provider enabled in console).
- **App Check**: not used in this repo; if you enable it in console, register the Android app or requests will fail.
- **ProGuard**: `minifyEnabled false` in `android/app/build.gradle` — no release shrinking issue for the web bundle.
- **Data**: land listings must have a valid `ownerId` (recipient) or Contact Publisher cannot create an interaction.

## Quick rule test (browser console, signed in)

```js
import("firebase/firestore").then(async (fs) => {
  const { db } = await import("/src/firebase/init.js");
  const ref = fs.doc(db, "interactions", "pub_test__req_x__rec_y");
  try {
    await fs.getDoc(ref);
    console.log("interaction get allowed (or not found)");
  } catch (e) {
    console.log(e.code, e.message);
  }
});
```

Authenticated users should get a successful get (document may not exist), not `permission-denied`.
