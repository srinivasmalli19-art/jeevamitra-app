// v62: Firebase Cloud Messaging on Android via @capacitor/push-notifications.
// On the web (or the test harness) every function is a safe no-op.
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase/init";
import { normalizeSettings } from "./notifSettings.logic";

export const isNative = () => Capacitor.isNativePlatform();

const DEVICE_KEY = "jeevamitra_deviceId";
const ASKED_KEY = "jeevamitra_pushAsked";

/** Stable id for this phone install, so a new token replaces the old one. */
export function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "d-unknown";
  }
}

export const deviceRef = (uid) => doc(db, "users", uid, "devices", deviceId());

export async function saveDeviceToken(uid, token, lang) {
  await setDoc(deviceRef(uid), { fcmToken: token, lang: lang || "en", platform: Capacitor.getPlatform(), updatedAt: serverTimestamp() });
}

export async function saveDeviceLanguage(uid, lang) {
  // Only if this phone already has a token on file.
  const snap = await getDoc(deviceRef(uid));
  if (snap.exists()) await setDoc(deviceRef(uid), { lang, updatedAt: serverTimestamp() }, { merge: true });
}

/** Called before logging out / deleting the account, so this phone stops getting that user's alerts. */
export async function forgetThisDevice(uid) {
  if (!uid) return;
  try { await deleteDoc(deviceRef(uid)); } catch (err) { console.warn("Device cleanup skipped:", err?.message); }
}

export async function permissionState() {
  if (!isNative()) return "unsupported";
  const p = await PushNotifications.checkPermissions();
  return p.receive; // "prompt" | "prompt-with-rationale" | "granted" | "denied"
}

export function wasAsked() {
  try { return localStorage.getItem(ASKED_KEY) === "1"; } catch { return false; }
}
export function markAsked() {
  try { localStorage.setItem(ASKED_KEY, "1"); } catch { /* ignore */ }
}

export async function requestPermissionAndRegister() {
  if (!isNative()) return "unsupported";
  markAsked();
  const p = await PushNotifications.requestPermissions();
  if (p.receive === "granted") await PushNotifications.register();
  return p.receive;
}

/** Android notification channels (sound / vibration; users can mute each in phone settings). */
export async function createChannels(t) {
  if (!isNative() || Capacitor.getPlatform() !== "android") return;
  const channels = [
    { id: "messages", name: t("ns_type_chat"), importance: 5 },
    { id: "nearby", name: t("ns_types"), importance: 4 },
    { id: "reminders", name: t("ns_type_reminder"), importance: 3 },
  ];
  for (const c of channels) {
    await PushNotifications.createChannel({ ...c, visibility: 1, vibration: true, sound: "default" }).catch(() => {});
  }
}

// ---- alert preferences ----------------------------------------------------------
export async function loadSettings(uid) {
  const snap = await getDoc(doc(db, "notificationSettings", uid));
  return normalizeSettings(snap.exists() ? snap.data() : null);
}
export async function saveSettings(uid, settings) {
  await setDoc(doc(db, "notificationSettings", uid), { ...normalizeSettings(settings), updatedAt: serverTimestamp() });
}
