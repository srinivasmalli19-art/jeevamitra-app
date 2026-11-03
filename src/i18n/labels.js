// v62: show stored English values (land unit, amenities, booking status) in the
// chosen language. Stored data is not changed; unknown values are shown as-is.
import { translations } from "./translations";

const UNIT = { month: "ex_unit_month" };
const AMENITY = {
  "Water source": "ex_am_water", Shade: "ex_am_shade", Fenced: "ex_am_fenced",
  Borewell: "ex_am_borewell", Electricity: "ex_am_electricity", "Road access": "ex_am_road",
};
const SPECIES = { Cattle: "ex_sp_cattle", Buffalo: "ex_sp_buffalo", "Goat/Sheep": "ex_sp_goat_sheep", Other: "ex_sp_other" };
const SEVERITY = { low: "ex_sev_low", medium: "ex_sev_medium", high: "ex_sev_high" };
const STATUS = { pending: "ex_st_pending", confirmed: "ex_st_confirmed", rejected: "ex_st_rejected", cancelled: "ex_st_cancelled" };

function via(map, t, value) {
  const key = map[value];
  return key && translations.en[key] ? t(key) : value;
}
export const unitLabel = (t, unit) => via(UNIT, t, unit);
export const amenityLabel = (t, a) => via(AMENITY, t, a);
export const bookingStatusLabel = (t, s) => via(STATUS, t, s) || "";

// Errors from utils/geo.js and utils/image.js carry an i18nKey.
export const errText = (t, err) => (err?.i18nKey && translations.en[err.i18nKey] ? t(err.i18nKey) : err?.message || "");
export const speciesLabel = (t, s) => via(SPECIES, t, s);
export const severityLabel = (t, s) => via(SEVERITY, t, s);
export const SPECIES_OPTIONS = Object.keys(SPECIES);

// Vet directory values (sector, designation, services, languages, availability).
const VET = {
  Government: "ex_vet_gov", Private: "ex_vet_private",
  "Veterinary Officer": "ex_vet_officer", "Veterinary Assistant": "ex_vet_assistant",
  "General Checkup": "ex_svc_checkup", Vaccination: "ex_svc_vaccination", "First Aid": "ex_svc_first_aid",
  "Artificial Insemination": "ex_svc_ai", Surgery: "ex_svc_surgery", "Epidemic Response": "ex_svc_epidemic",
  Telugu: "ex_lang_te", English: "ex_lang_en", Hindi: "ex_lang_hi",
  "Available today": "ex_av_today", "Available tomorrow": "ex_av_tomorrow", "Busy this week": "ex_av_busy",
};
export const vetLabel = (t, v) => via(VET, t, v);

// Livestock record types.
const LIVESTOCK = { Cattle: "ex_sp_cattle", Buffalo: "ex_sp_buffalo", Goat: "ex_ls_goat", Sheep: "ex_ls_sheep", Other: "ex_sp_other" };
export const livestockLabel = (t, v) => via(LIVESTOCK, t, v);
export const LIVESTOCK_OPTIONS = Object.keys(LIVESTOCK);
