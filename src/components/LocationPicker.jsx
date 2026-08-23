import { STATES, DISTRICTS_BY_STATE, OTHER_DISTRICT } from "../data/indiaLocations";

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
        <label>State</label>
        <select value={value.state || ""} onChange={(e) => set("state", e.target.value)}>
          <option value="" disabled>Select state</option>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="field">
        <label>District</label>
        {districtOptions ? (
          <select value={value.district || ""} onChange={(e) => set("district", e.target.value)}>
            <option value="" disabled>Select district</option>
            {districtOptions.map((d) => <option key={d}>{d}</option>)}
            <option value={OTHER_DISTRICT}>{OTHER_DISTRICT}</option>
          </select>
        ) : (
          <input
            placeholder={value.state ? "Type your district" : "Select a state first"}
            disabled={!value.state}
            value={value.district || ""}
            onChange={(e) => set("district", e.target.value)}
          />
        )}
      </div>

      {value.district === OTHER_DISTRICT && (
        <div className="field">
          <label>District name</label>
          <input
            placeholder="Type your district"
            value={value.districtOther || ""}
            onChange={(e) => set("districtOther", e.target.value)}
          />
        </div>
      )}

      <div className="row">
        <div className="field">
          <label>Mandal / Tehsil / Taluka</label>
          <input placeholder="e.g. Gannavaram" value={value.mandal || ""} onChange={(e) => set("mandal", e.target.value)} />
        </div>
        <div className="field">
          <label>Village</label>
          <input placeholder="e.g. Kandlagunta" value={value.village || ""} onChange={(e) => set("village", e.target.value)} />
        </div>
      </div>
    </>
  );
}
