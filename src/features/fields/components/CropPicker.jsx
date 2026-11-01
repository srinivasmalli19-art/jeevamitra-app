// Icon grid of crops; each tile has a "?" that opens its safety card.
import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import BottomSheet from "../../../components/BottomSheet";
import { pick } from "../cropGuides.logic";
import SafetyCard from "./SafetyCard";

export default function CropPicker({ crops, settings, value, onChange, includeOther = true }) {
  const { t, tf, lang } = useLanguage();
  const [infoFor, setInfoFor] = useState(null);
  const info = crops.find((c) => c.id === infoFor);

  return (
    <>
      <div className="crop-grid" role="radiogroup" aria-label={t("fp_crop")}>
        {crops.map((c) => (
          <div key={c.id} className={`crop-tile ${value === c.id ? "active" : ""}`}>
            <button type="button" role="radio" aria-checked={value === c.id} className="crop-main" onClick={() => onChange(c.id)}>
              <span className="crop-emoji" aria-hidden="true">{c.emoji}</span>
              <span className="crop-name">{pick(c.name, lang)}</span>
            </button>
            <button type="button" className="crop-help" onClick={() => setInfoFor(c.id)} aria-label={tf("fp_safety_open", { name: pick(c.name, lang) })}>?</button>
          </div>
        ))}
        {includeOther && (
          <div className={`crop-tile ${value === "other" ? "active" : ""}`}>
            <button type="button" role="radio" aria-checked={value === "other"} className="crop-main" onClick={() => onChange("other")}>
              <span className="crop-emoji" aria-hidden="true">🌱</span>
              <span className="crop-name">{t("fp_crop_other")}</span>
            </button>
          </div>
        )}
      </div>
      <BottomSheet open={!!info} onClose={() => setInfoFor(null)} title={info ? `${info.emoji} ${pick(info.name, lang)} · ${t("fp_safety_title")}` : ""}>
        {info && <SafetyCard crop={info} settings={settings} />}
      </BottomSheet>
    </>
  );
}
