import { STATES, DISTRICTS_BY_STATE, OTHER_DISTRICT } from "../data/indiaLocations";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * A four-level location picker: State and District are real dropdowns
 * (accurate official data, at least for states we've populated). Mandal
 * and Village stay as free-text fields — India has hundreds of thousands
 * of villages and thousands of mandals/tehsils/talukas, so hardcoding
 * those risks presenting wrong or outdated names as authoritative, which
 * would actively mislead a farmer trying to find a real place. Free text
 * under the correct state+district is the honest choice here.
 *
 * Props: value = { state, district, mandal, village }, onChange(next)
 */
export default function LocationPicker({ value, onChange }) {
  const { t, tf } = useLanguage();
  const districtOptions = DISTRICTS_BY_STATE[value.state];

  function set(key, val) {
    const next = { ...value, [key]: val };
    // Changing state invalidates the previously selected district.
    if (key === "state") next.district = "";
    onChange(next);
  }

  return (
    <>
      <div className="field">
        <label>{t("ex_state")}</label>
        <select value={value.state || ""} onChange={(e) => set("state", e.target.value)}>
          <option value="" disabled>{t("ex_select_state")}</option>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="field">
        <label>{t("ex_district")}</label>
        {districtOptions ? (
          <select value={value.district || ""} onChange={(e) => set("district", e.target.value)}>
            <option value="" disabled>{t("ex_select_district")}</option>
            {districtOptions.map((d) => <option key={d}>{d}</option>)}
            <option value={OTHER_DISTRICT}>{OTHER_DISTRICT}</option>
          </select>
        ) : (
          <input
            placeholder={value.state ? t("ex_type_district") : t("ex_select_state_first")}
            disabled={!value.state}
            value={value.district || ""}
            onChange={(e) => set("district", e.target.value)}
          />
        )}
      </div>

      {value.district === OTHER_DISTRICT && (
        <div className="field">
          <label>{t("ex_district_name")}</label>
          <input
            placeholder={t("ex_type_district")}
            value={value.districtOther || ""}
            onChange={(e) => set("districtOther", e.target.value)}
          />
        </div>
      )}

      <div className="row">
        <div className="field">
          <label>{t("ex_mandal")}</label>
          <input placeholder={tf("ex_eg", { x: "Gannavaram" })} value={value.mandal || ""} onChange={(e) => set("mandal", e.target.value)} />
        </div>
        <div className="field">
          <label>{t("ex_village")}</label>
          <input placeholder={tf("ex_eg", { x: "Kandlagunta" })} value={value.village || ""} onChange={(e) => set("village", e.target.value)} />
        </div>
      </div>
    </>
  );
}
