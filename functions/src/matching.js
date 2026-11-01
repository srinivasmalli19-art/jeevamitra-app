// Pure matching rules for nearby alerts (unit-tested, no Firebase).
import { distanceBetween } from "geofire-common";

export const KIND = { RESIDUE: "residue", NEED: "nightStayNeed", HERD: "herdAvailable" };
export const SEARCH_RADIUS_KM = 25; // largest distance a user can choose
export const DEDUPE_HOURS = 48;
export const DAILY_NEARBY_CAP = 5;
export const HERD_MOVE_KM = 1;
export const HERD_STALE_DAYS = 7;
export const NEARBY_TYPES = ["herdNear", "residueNear", "nightStayWork"];

const IST_OFFSET_MS = 5.5 * 3600e3;
const DAY_MS = 864e5;

export function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
}

/** YYYY-MM-DD in India time. */
export function istDay(ms = Date.now()) {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}
export function istHour(ms = Date.now()) {
  return new Date(ms + IST_OFFSET_MS).getUTCHours();
}
/** Quiet hours for nearby alerts: 10 pm to 5 am India time. */
export function isQuietTime(ms = Date.now()) {
  const h = istHour(ms);
  return h >= 22 || h < 5;
}

export function hasLocation(p) {
  return p && typeof p.lat === "number" && typeof p.lng === "number";
}

export function distanceKm(a, b) {
  if (!hasLocation(a) || !hasLocation(b)) return Infinity;
  return distanceBetween([a.lat, a.lng], [b.lat, b.lng]);
}

/** Same visibility rule as the app (src/features/fields/fields.logic.js isListed). */
export function isActive(post, now = Date.now()) {
  if (!post || post.hidden) return false;
  if (post.status === "full" || post.status === "closed") return false;
  if (post.availableUntil && post.availableUntil < istDay(now)) return false;
  if (post.kind === KIND.HERD) {
    const at = toMillis(post.locationUpdatedAt) || toMillis(post.updatedAt) || toMillis(post.createdAt);
    if (at && now - at > HERD_STALE_DAYS * DAY_MS) return false;
  }
  return true;
}

/**
 * Decides whether a write to fieldPosts/{id} should trigger nearby alerts.
 * Returns "created" | "reactivated" | "moved" | null.
 */
export function triggerFor(before, after, now = Date.now()) {
  if (!after || !hasLocation(after) || !isActive(after, now)) return null;
  if (!before) return "created";
  if (!isActive(before, now)) return "reactivated";
  if (after.kind === KIND.HERD && distanceKm(before, after) >= HERD_MOVE_KM) return "moved";
  return null;
}

/**
 * Plans the alerts for one post write. `candidates` are nearby posts (any
 * kind) with ids. Returns { direct: [...], summary: {...} | null }:
 *   direct  — one alert per other post owner
 *   summary — for a herd: counts of residue fields / need-a-herd requests
 *             near the herd, sent to the herd owner (filtered by their radius later)
 */
export function planAlerts(postId, post, candidates, now = Date.now()) {
  const others = candidates
    .filter((c) => c.id !== postId && c.ownerId && c.ownerId !== post.ownerId && isActive(c, now))
    .map((c) => ({ ...c, _km: distanceKm(post, c) }))
    .filter((c) => c._km <= SEARCH_RADIUS_KM)
    .sort((a, b) => a._km - b._km);

  const direct = [];
  if (post.kind === KIND.HERD) {
    for (const c of others.filter((x) => x.kind === KIND.RESIDUE || x.kind === KIND.NEED)) {
      direct.push({ recipientId: c.ownerId, type: "herdNear", template: "herdNear", km: c._km, aboutId: postId, link: `/field-posts/${postId}`, pairKey: `${postId}__${c.id}` });
    }
    const residue = others.filter((x) => x.kind === KIND.RESIDUE);
    const need = others.filter((x) => x.kind === KIND.NEED);
    return { direct: dedupeRecipients(direct), summary: { recipientId: post.ownerId, residue, need } };
  }
  const herds = others.filter((x) => x.kind === KIND.HERD);
  for (const h of herds) {
    if (post.kind === KIND.RESIDUE) {
      direct.push({ recipientId: h.ownerId, type: "residueNear", template: "residueNew", km: h._km, aboutId: postId, link: `/field-posts/${postId}`, pairKey: `${postId}__${h.id}` });
    } else if (post.kind === KIND.NEED) {
      direct.push({ recipientId: h.ownerId, type: "nightStayWork", template: "nightStayWorkNew", km: h._km, aboutId: postId, link: `/field-posts/${postId}`, pairKey: `${postId}__${h.id}` });
    }
  }
  return { direct: dedupeRecipients(direct), summary: null };
}

/** One alert per recipient per event: keep the closest. */
function dedupeRecipients(list) {
  const best = new Map();
  for (const a of list) {
    const cur = best.get(a.recipientId);
    if (!cur || a.km < cur.km) best.set(a.recipientId, a);
  }
  return [...best.values()];
}

/** Recipient's own distance and on/off choice. */
export function wantsAlert(settings, type, km) {
  if (!settings.types?.[type]) return false;
  if (NEARBY_TYPES.includes(type) && km > settings.radiusKm) return false;
  return true;
}

/** Was this pair alerted within the last 48 hours? */
export function recentlySent(sentAtMs, now = Date.now()) {
  return !!sentAtMs && now - sentAtMs < DEDUPE_HOURS * 3600e3;
}
