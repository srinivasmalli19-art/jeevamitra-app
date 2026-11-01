// v62: per-user alert preferences (Firestore `notificationSettings/{uid}`).
// The same defaults are used by Cloud Functions (functions/src/settings.js).
export const ALERT_TYPES = ["herdNear", "residueNear", "nightStayWork", "postContact", "chat", "reminder"];
export const RADIUS_OPTIONS_KM = [5, 10, 25];

export const DEFAULT_SETTINGS = Object.freeze({
  radiusKm: 10,
  quietHours: true, // 10 pm to 5 am IST, nearby alerts only
  types: Object.freeze(Object.fromEntries(ALERT_TYPES.map((k) => [k, true]))),
});

/** Fills gaps with defaults and drops anything unknown. */
export function normalizeSettings(raw) {
  const r = raw || {};
  const types = {};
  for (const k of ALERT_TYPES) types[k] = typeof r.types?.[k] === "boolean" ? r.types[k] : true;
  return {
    radiusKm: RADIUS_OPTIONS_KM.includes(r.radiusKm) ? r.radiusKm : DEFAULT_SETTINGS.radiusKm,
    quietHours: typeof r.quietHours === "boolean" ? r.quietHours : DEFAULT_SETTINGS.quietHours,
    types,
  };
}
