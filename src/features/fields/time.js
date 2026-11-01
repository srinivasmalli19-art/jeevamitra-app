// "just now" / "5 min ago" / "3 hours ago" / "2 days ago" in the user's language.
import { toMillis } from "./fields.logic.js";

export function relTime(ts, tf, now = Date.now()) {
  const ms = toMillis(ts);
  if (!ms) return "";
  const mins = Math.floor((now - ms) / 60000);
  if (mins < 2) return tf("fp_time_just_now");
  if (mins < 60) return tf("fp_time_minutes", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return tf("fp_time_hours", { n: hours });
  return tf("fp_time_days", { n: Math.floor(hours / 24) });
}

/** 0.4 -> "400 మీ.", 3.24 -> "3.2 కి.మీ." in the user's language. */
export function fmtDistance(km, t) {
  if (km === null || km === undefined || !Number.isFinite(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} ${t("fp_m")}`;
  return `${km.toFixed(1)} ${t("fp_km")}`;
}
