import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { useToast } from "./ToastContext";
import BottomSheet from "./BottomSheet";
import LanguageList from "../i18n/LanguageList";

export default function SettingsSheet({ open, onClose }) {
  const { logout } = useAuth();
  const { lang, setLang, languages, t } = useLanguage();
  const showToast = useToast();
  const nav = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const current = languages.find((l) => l.code === lang) || languages[0];

  async function handleLogout() {
    onClose();
    await logout();
    nav("/login");
  }

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title={t("settings_title")}>
        <div className="settings-row" onClick={() => setLangOpen(true)}>
          {t("settings_language")} <span className="chev">{current.nativeName} ›</span>
        </div>
        <div className="settings-row">{t("settings_notifications")} <span className="chev">On ›</span></div>
        <div className="settings-row">{t("settings_units")} <span className="chev">Metric ›</span></div>
        <div className="settings-row" onClick={handleLogout}>{t("settings_logout")} <span className="chev">›</span></div>
        <div style={{ marginTop: 18 }}>
          <button className="btn-danger" onClick={() => showToast(t("delete_account_confirm_toast"))}>{t("delete_account")}</button>
        </div>
        <p style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: "var(--ink-soft)", marginTop: 16 }}>
          JeevaMitra v1.0.0
        </p>
      </BottomSheet>

      <BottomSheet open={langOpen} onClose={() => setLangOpen(false)} title={`🌐 ${t("settings_language")}`}>
        <LanguageList
          languages={languages}
          current={current.code}
          onSelect={(code) => { setLang(code); setLangOpen(false); }}
        />
      </BottomSheet>
    </>
  );
}
