import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import BottomSheet from "./BottomSheet";
import LanguageList from "../i18n/LanguageList";

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z" /><path d="M9 7v13M15 4v13" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 004 0" />
    </svg>
  );
}

// Language switching used to be a floating overlay button positioned in the
// top-left corner of every screen — it overlapped the app bar title (long
// greetings on Home) and the back button on detail screens, since it never
// knew how much space the actual content needed. Owning it here instead,
// as a normal icon-btn inside the app bar's icon row, means it's laid out
// in-flow and can never overlap anything.
// v62: the button now shows the CURRENT language (తె / हि / EN) instead of a
// generic globe, so a farmer can see at a glance which language is on and
// tap it to switch. It also appears on detail/form screens (see below).
const LANGUAGE_BADGE = { en: "EN", te: "తె", hi: "हि" };

function LanguageIconButton() {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = languages.find((l) => l.code === lang) || languages[0];
  return (
    <>
      <button
        className="icon-btn lang-badge"
        onClick={() => setOpen(true)}
        aria-label={`Language: ${current.nativeName}. Tap to change`}
        title={current.nativeName}
      >
        {LANGUAGE_BADGE[current.code] || current.code.toUpperCase()}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="🌐 Language / భాష / भाषा">
        <LanguageList
          languages={languages}
          current={current.code}
          onSelect={(code) => { setLang(code); setOpen(false); }}
        />
      </BottomSheet>
    </>
  );
}

// Top-level screens (Home, Lands, Bookings, Vets, Profile, Map) get a title +
// subtitle with map/bell/language icon buttons. Detail/form screens get a
// back button + a fixed generic title instead — the entity's own name lives
// in the page content (a hero banner or heading), not the app bar.
export default function AppBar({ variant = "top", title, subtitle, onMap, onBell, unread, onBack }) {
  if (variant === "detail") {
    return (
      <div className="topbar">
        <div className="back-row">
          <button className="back-btn" onClick={onBack} aria-label="Back"><BackIcon /></button>
          <h1 style={{ fontSize: 18, flex: 1 }}>{title}</h1>
          <LanguageIconButton />
        </div>
      </div>
    );
  }
  return (
    <div className="topbar">
      <div className="appbar-row">
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="sub">{subtitle}</div>}
        </div>
        <div className="appbar-icons">
          {onMap && (
            <button className="icon-btn" onClick={onMap} aria-label="Map"><MapIcon /></button>
          )}
          {onBell && (
            <button className="icon-btn" onClick={onBell} aria-label="Notifications">
              <BellIcon />
              {unread ? <span className="badge-dot" /> : null}
            </button>
          )}
          <LanguageIconButton />
        </div>
      </div>
    </div>
  );
}
