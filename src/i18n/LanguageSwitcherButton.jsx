import { useState } from "react";
import { useLanguage } from "./LanguageContext";
import BottomSheet from "../components/BottomSheet";
import LanguageList from "./LanguageList";

export default function LanguageSwitcherButton() {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Change language"
        style={{
          position: "absolute", top: 10, left: 10, zIndex: 30,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(0,0,0,0.28)", color: "#fff", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, cursor: "pointer",
        }}
      >
        🌐
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
