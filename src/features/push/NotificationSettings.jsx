// v62: /settings/notifications
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { ALERT_TYPES, RADIUS_OPTIONS_KM, normalizeSettings } from "./notifSettings.logic";
import { isNative, loadSettings, permissionState, requestPermissionAndRegister, saveSettings } from "./pushApi";

export default function NotificationSettings() {
  const { user } = useAuth();
  const { t, tf } = useLanguage();
  const nav = useNavigate();
  const showToast = useToast();
  const [s, setS] = useState(null);
  const [perm, setPerm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings(user.uid).then(setS).catch(() => setS(normalizeSettings(null)));
    permissionState().then(setPerm).catch(() => setPerm("unsupported"));
  }, [user.uid]);

  async function persist(next) {
    setS(next);
    setSaving(true);
    try { await saveSettings(user.uid, next); showToast(t("ns_saved")); }
    catch { showToast(t("fp_err_generic")); }
    finally { setSaving(false); }
  }

  async function allow() {
    setPerm(await requestPermissionAndRegister());
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ns_title")} onBack={() => nav(-1)} />
      <div className="content">
        {isNative() && perm === "granted" && <div className="card" style={{ cursor: "default" }}>✅ {t("ns_push_on")}</div>}
        {isNative() && (perm === "prompt" || perm === "prompt-with-rationale") && (
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-title">🔔 {t("ns_permission_title")}</div>
            <p className="meta" style={{ fontSize: 13 }}>{t("ns_permission_body")}</p>
            <button className="btn-primary" onClick={allow}>{t("ns_allow")}</button>
          </div>
        )}
        {isNative() && perm === "denied" && <div className="warn-box">{t("ns_blocked")}</div>}

        {!s ? <p className="meta">{t("loading")}</p> : (
          <>
            <div className="field">
              <label>{t("ns_distance")}</label>
              <div className="seg">
                {RADIUS_OPTIONS_KM.map((km) => (
                  <button key={km} type="button" disabled={saving} className={`chip ${s.radiusKm === km ? "active" : ""}`}
                    onClick={() => persist({ ...s, radiusKm: km })}>
                    {tf("fp_filter_within", { n: km })}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>{t("ns_types")}</label>
              <div className="card" style={{ cursor: "default", padding: "4px 14px" }}>
                {ALERT_TYPES.map((k) => (
                  <label key={k} className="check-row settings-row" style={{ cursor: "pointer" }}>
                    <input type="checkbox" data-type={k} checked={s.types[k]} disabled={saving}
                      onChange={(e) => persist({ ...s, types: { ...s.types, [k]: e.target.checked } })} />
                    <span style={{ flex: 1 }}>{t("ns_type_" + k)}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="check-row" style={{ marginBottom: 18 }}>
              <input type="checkbox" data-type="quietHours" checked={s.quietHours} disabled={saving} onChange={(e) => persist({ ...s, quietHours: e.target.checked })} />
              {t("ns_quiet")}
            </label>
          </>
        )}

        <div className="card" style={{ cursor: "default" }}>
          <div className="card-title" style={{ fontSize: 14 }}>🔋 {t("ns_battery_title")}</div>
          <p style={{ fontSize: 13, lineHeight: 1.55, margin: "6px 0 0" }}>{t("ns_battery_body")}</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
