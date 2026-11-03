// Alert preferences: same defaults as the app (src/features/push/notifSettings.logic.js).
export const ALERT_TYPES = ["herdNear", "residueNear", "nightStayWork", "postContact", "chat", "reminder"];
export const RADIUS_OPTIONS_KM = [5, 10, 25];

export function normalizeSettings(raw) {
  const r = raw || {};
  const types = {};
  for (const k of ALERT_TYPES) types[k] = typeof r.types?.[k] === "boolean" ? r.types[k] : true;
  return {
    radiusKm: RADIUS_OPTIONS_KM.includes(r.radiusKm) ? r.radiusKm : 10,
    quietHours: typeof r.quietHours === "boolean" ? r.quietHours : true,
    types,
  };
}
