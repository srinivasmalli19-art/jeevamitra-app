// The "?" card for one crop: good for / daily or heavy eating / precautions /
// when to call a vet, plus the general rules and the disclaimer.
import { useLanguage } from "../../../i18n/LanguageContext";
import { pick } from "../cropGuides.logic";

export default function SafetyCard({ crop, settings, showGeneral = true }) {
  const { t, tf, lang } = useLanguage();
  if (!crop) return null;
  const rules = settings.generalPrecautions[lang] || settings.generalPrecautions.en;
  return (
    <div className="safety-card">
      <Section title={t("fp_good_for")} tone="good">{pick(crop.goodFor, lang)}</Section>
      <Section title={t("fp_risk")} tone="risk">{pick(crop.risk, lang)}</Section>
      <Section title={t("fp_precautions")} tone="info">{pick(crop.precautions, lang)}</Section>
      <Section title={t("fp_call_vet")} tone="risk">{pick(settings.callVet, lang)}</Section>
      {showGeneral && (
        <div style={{ marginTop: 12 }}>
          <div className="card-title" style={{ fontSize: 14 }}>{t("fp_general_rules")}</div>
          <ol style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 13.5, lineHeight: 1.55 }}>
            {rules.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
          </ol>
        </div>
      )}
      <p className="meta" style={{ marginTop: 12 }}>
        {crop.reviewedBy ? tf("fp_reviewed_by", { name: crop.reviewedBy, date: crop.reviewedOn || "" }) : t("fp_not_reviewed")}
      </p>
      <p className="meta" style={{ marginTop: 4 }}>{pick(settings.disclaimer, lang)}</p>
    </div>
  );
}

function Section({ title, tone, children }) {
  const colors = {
    good: ["var(--pasture-pale)", "var(--pasture)"],
    risk: ["var(--alert-pale)", "var(--alert)"],
    info: ["var(--sky-pale)", "var(--sky)"],
  }[tone];
  return (
    <div style={{ background: colors[0], borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors[1], marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)" }}>{children}</div>
    </div>
  );
}
