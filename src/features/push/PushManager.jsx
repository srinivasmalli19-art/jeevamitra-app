// v62: mounted once in App. Registers this phone for push alerts, keeps the
// alert language in sync, shows an in-app banner when an alert arrives while
// the app is open, opens the right screen when a notification is tapped, and
// asks for permission at a helpful moment (after a first post or chat), never
// at app launch.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PushNotifications } from "@capacitor/push-notifications";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import BottomSheet from "../../components/BottomSheet";
import {
  isNative, permissionState, requestPermissionAndRegister, saveDeviceToken, saveDeviceLanguage,
  createChannels, wasAsked, markAsked,
} from "./pushApi";
import { safeLink } from "./links";
import { ASK_PUSH_EVENT, BANNER_EVENT } from "./events";



export default function PushManager() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const nav = useNavigate();
  const [askOpen, setAskOpen] = useState(false);
  const [banner, setBanner] = useState(null);
  const langRef = useRef(lang);
  langRef.current = lang;
  const hideTimer = useRef(null);

  // Native listeners + register when permission was already given.
  useEffect(() => {
    if (!user || !isNative()) return undefined;
    const handles = [];
    (async () => {
      await createChannels(t);
      handles.push(await PushNotifications.addListener("registration", (tok) => {
        saveDeviceToken(user.uid, tok.value, langRef.current).catch((e) => console.warn("Token save failed:", e?.message));
      }));
      handles.push(await PushNotifications.addListener("registrationError", (e) => console.warn("Push registration failed:", e?.error)));
      handles.push(await PushNotifications.addListener("pushNotificationReceived", (n) => {
        window.dispatchEvent(new CustomEvent(BANNER_EVENT, { detail: { title: n.title, body: n.body, link: n.data?.link } }));
      }));
      handles.push(await PushNotifications.addListener("pushNotificationActionPerformed", (a) => {
        nav(safeLink(a.notification?.data?.link));
      }));
      if ((await permissionState()) === "granted") await PushNotifications.register();
    })().catch((e) => console.warn("Push setup skipped:", e?.message));
    return () => handles.forEach((h) => h?.remove?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Keep the alert language in sync with the app language.
  useEffect(() => {
    if (user && isNative()) saveDeviceLanguage(user.uid, lang).catch(() => {});
  }, [lang, user]);

  // Ask once, at a helpful moment.
  useEffect(() => {
    const onAsk = async () => {
      if (!isNative() || wasAsked()) return;
      const state = await permissionState();
      if (state === "prompt" || state === "prompt-with-rationale") setAskOpen(true);
    };
    window.addEventListener(ASK_PUSH_EVENT, onAsk);
    return () => window.removeEventListener(ASK_PUSH_EVENT, onAsk);
  }, []);

  // In-app banner while the app is open.
  useEffect(() => {
    const onBanner = (e) => {
      setBanner(e.detail);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setBanner(null), 6000);
    };
    window.addEventListener(BANNER_EVENT, onBanner);
    return () => { window.removeEventListener(BANNER_EVENT, onBanner); clearTimeout(hideTimer.current); };
  }, []);

  return (
    <>
      {banner && (
        <button type="button" className="push-banner" onClick={() => { setBanner(null); nav(safeLink(banner.link)); }}>
          <span className="pb-icon" aria-hidden="true">🔔</span>
          <span style={{ minWidth: 0 }}>
            <strong className="pb-title">{banner.title}</strong>
            {banner.body && <span className="pb-body">{banner.body}</span>}
          </span>
        </button>
      )}
      <BottomSheet open={askOpen} onClose={() => setAskOpen(false)} title={`🔔 ${t("ns_permission_title")}`}>
        <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 0 }}>{t("ns_permission_body")}</p>
        <div className="row">
          <button className="btn-secondary" onClick={() => { setAskOpen(false); markAsked(); }}>{t("ns_later")}</button>
          <button className="btn-primary" onClick={async () => { setAskOpen(false); await requestPermissionAndRegister(); }}>{t("ns_allow")}</button>
        </div>
      </BottomSheet>
    </>
  );
}
