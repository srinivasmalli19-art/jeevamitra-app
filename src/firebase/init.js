import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Opt-in local testing against the Firebase Emulator. Enabled only when
// VITE_USE_EMULATOR=1 (see `npm run dev:emulator` and
// docs/messaging-testing-guide.md). This never activates in a normal
// `vite build` / production run, so the live project is unaffected. It lets
// you exercise messaging (which needs the new firestore.rules) without
// deploying rules to the live project.
if (import.meta.env.VITE_USE_EMULATOR === "1") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export default app;
