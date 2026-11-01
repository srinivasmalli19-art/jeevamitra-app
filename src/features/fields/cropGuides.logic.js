// Merges the built-in crop cards with admin edits from Firestore and picks
// the user's language. Pure (no Firebase), so it is unit-tested.
import { DEFAULT_CROPS, DEFAULT_SETTINGS } from "./cropGuides.defaults.js";

export const LANGS = ["en", "te", "hi"];
export const CARD_FIELDS = ["name", "goodFor", "risk", "precautions"];

function mergeLocalized(base = {}, override = {}) {
  const out = { ...base };
  for (const l of LANGS) {
    const v = override?.[l];
    if (typeof v === "string" && v.trim()) out[l] = v.trim();
  }
  return out;
}

/**
 * @param {Array<{id:string}>} adminDocs  docs from Firestore `cropGuides` (may be empty)
 * @returns full crop list: defaults updated by admin edits, plus admin-added
 *          crops; hidden crops removed; sorted by `order`.
 */
export function mergeCrops(adminDocs = [], { includeHidden = false } = {}) {
  const byId = new Map(DEFAULT_CROPS.map((c) => [c.id, { ...c, hidden: false }]));
  for (const d of adminDocs) {
    if (!d || !d.id || !/^[A-Za-z0-9_-]{1,64}$/.test(d.id)) continue;
    const base = byId.get(d.id) || { id: d.id, emoji: "🌱", order: 999, basis: "vet", name: {}, goodFor: {}, risk: {}, precautions: {} };
    const merged = { ...base };
    for (const f of CARD_FIELDS) merged[f] = mergeLocalized(base[f], d[f]);
    if (typeof d.emoji === "string" && d.emoji.trim()) merged.emoji = d.emoji.trim().slice(0, 8);
    if (Number.isFinite(d.order)) merged.order = d.order;
    if (typeof d.hidden === "boolean") merged.hidden = d.hidden;
    if (d.reviewedBy) merged.reviewedBy = String(d.reviewedBy);
    if (d.reviewedOn) merged.reviewedOn = String(d.reviewedOn);
    // A brand-new admin crop needs at least an English name to be usable.
    if (!merged.name.en && !merged.name.te && !merged.name.hi) continue;
    byId.set(d.id, merged);
  }
  return [...byId.values()]
    .filter((c) => includeHidden || !c.hidden)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export function mergeSettings(adminSettings) {
  const s = adminSettings || {};
  const out = {
    sprayWarningDays: DEFAULT_SETTINGS.sprayWarningDays,
    generalPrecautions: { ...DEFAULT_SETTINGS.generalPrecautions },
    callVet: mergeLocalized(DEFAULT_SETTINGS.callVet, s.callVet),
    disclaimer: mergeLocalized(DEFAULT_SETTINGS.disclaimer, s.disclaimer),
  };
  const days = Number(s.sprayWarningDays);
  if (Number.isInteger(days) && days >= 0 && days <= 365) out.sprayWarningDays = days;
  for (const l of LANGS) {
    const list = s.generalPrecautions?.[l];
    if (Array.isArray(list)) {
      const clean = list.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim());
      if (clean.length) out.generalPrecautions[l] = clean;
    }
  }
  return out;
}

/** Text in the chosen language, falling back to English, then any language. */
export function pick(localized, lang) {
  if (!localized) return "";
  return localized[lang] || localized.en || localized.te || localized.hi || "";
}

export function cropName(crops, id, lang, fallback = "") {
  const c = crops.find((x) => x.id === id);
  return c ? pick(c.name, lang) : fallback;
}
