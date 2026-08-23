import { createContext, useContext, useState } from "react";
import { translations, LANGUAGES } from "./translations";

const LanguageContext = createContext(null);

function getInitialLanguage() {
  const saved = localStorage.getItem("jeevamitra_lang");
  if (saved && translations[saved]) return saved;
  return null; // null = not chosen yet, triggers first-launch picker
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage);

  function setLang(code) {
    localStorage.setItem("jeevamitra_lang", code);
    setLangState(code);
  }

  function t(key) {
    const dict = translations[lang || "en"];
    return dict?.[key] || translations.en[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
