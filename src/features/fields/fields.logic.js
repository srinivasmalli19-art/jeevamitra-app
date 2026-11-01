// Pure, Firebase-free logic for the v62 "Crop Residue" and "Night Stay and
// Herds" features. Kept import-light so it runs under `node --test` and is
// shared by the screens, the data layer and (copied) by Cloud Functions.
import { geohashForLocation } from "geofire-common";
import { distanceKm } from "../../utils/geo.js";

// ---- Post kinds ------------------------------------------------------------
export const KIND = Object.freeze({
  RESIDUE: "residue", //            farmer: harvested field with residue to graze
  NIGHT_STAY_NEED: "nightStayNeed", // farmer: wants a herd overnight for manure
  HERD: "herdAvailable", //         herd owner: herd nearby and available
});
export const KINDS = Object.values(KIND);

// ---- Status (set manually by the owner; "closed" is automatic) -------------
export const STATUS = Object.freeze({
  AVAILABLE: "available",
  PARTLY: "partly",
  FULL: "full",
  CLOSED: "closed",
});
export const OWNER_STATUSES = [STATUS.AVAILABLE, STATUS.PARTLY, STATUS.FULL];

// ---- Pricing ---------------------------------------------------------------
export const PRICE = Object.freeze({
  PER_DAY: "perDay",
  PER_WEEK: "perWeek",
  PER_NIGHT: "perNight",
  PER_ACRE: "perAcre",
  PER_SEASON: "perSeason",
  FULL_COMPLETION: "fullCompletion", // one price until the residue is finished
  LUMP_SUM: "lumpSum",
  FREE_FOR_MANURE: "freeForManure", // residue in exchange for the herd's manure
});
export const PRICE_TYPES_BY_KIND = Object.freeze({
  [KIND.RESIDUE]: [PRICE.PER_DAY, PRICE.PER_WEEK, PRICE.PER_NIGHT, PRICE.PER_ACRE, PRICE.PER_SEASON, PRICE.FULL_COMPLETION, PRICE.FREE_FOR_MANURE],
  [KIND.NIGHT_STAY_NEED]: [PRICE.PER_NIGHT, PRICE.PER_ACRE, PRICE.PER_SEASON, PRICE.LUMP_SUM],
  [KIND.HERD]: [PRICE.PER_NIGHT, PRICE.PER_ACRE, PRICE.PER_SEASON, PRICE.LUMP_SUM],
});
// translation key for the unit shown after the amount, e.g. "₹500 / day"
export const PRICE_UNIT_KEY = Object.freeze({
  [PRICE.PER_DAY]: "fp_unit_day",
  [PRICE.PER_WEEK]: "fp_unit_week",
  [PRICE.PER_NIGHT]: "fp_unit_night",
  [PRICE.PER_ACRE]: "fp_unit_acre",
  [PRICE.PER_SEASON]: "fp_unit_season",
  [PRICE.FULL_COMPLETION]: "fp_unit_full",
  [PRICE.LUMP_SUM]: "fp_unit_lump",
});

// ---- Animals, extras, "looking for" -----------------------------------------
export const ANIMALS = ["sheep", "goat", "cattle", "buffalo", "mixed"];
export const ANIMAL_PREFS = ["sheep", "goat", "cattle", "any"];
export const ANIMAL_EMOJI = { sheep: "🐑", goat: "🐐", cattle: "🐄", buffalo: "🐃", mixed: "🐑🐄", any: "🐾" };
export const EXTRAS = ["food", "water", "rest"]; // offered by farmer to the herder
export const LOOKING_FOR = ["grazing", "nightStay"]; // herd owner wants

// ---- Limits ----------------------------------------------------------------
export const MAX_PHOTOS = 5;
export const MAX_VOICE_SECONDS = 120;
export const MAX_DESCRIPTION = 1000;
export const HERD_MOVE_THRESHOLD_KM = 1; // ignore GPS jitter below this
export const HERD_STALE_DAYS = 7; // herd post inactive after this long without an update
export const DEFAULT_SPRAY_WARNING_DAYS = 21; // placeholder: vet to confirm
export const RADIUS_OPTIONS_KM = [5, 10, 25];
export const DEFAULT_RADIUS_KM = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

// ---- Helpers -----------------------------------------------------------------
export function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") return Date.parse(ts) || 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
}

/** YYYY-MM-DD for a Date in the phone's local time. */
export function isoDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function geohashFor(lat, lng) {
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;
  return geohashForLocation([lat, lng]);
}

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function num(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---- Validation ----------------------------------------------------------------
// Returns an object of { field: translationKey } for every problem; empty = valid.
export function validatePost(kind, d) {
  const e = {};
  if (!KINDS.includes(kind)) e.kind = "fp_err_kind";
  if (!isFiniteNumber(d.lat) || !isFiniteNumber(d.lng)) e.location = "fp_err_location";
  if (!d.village || !String(d.village).trim()) e.village = "fp_err_village";

  const photos = d.photos || [];
  if (photos.length > MAX_PHOTOS) e.photos = "fp_err_photos_max";
  if (d.voiceNote && num(d.voiceNote.durationSec) > MAX_VOICE_SECONDS) e.voiceNote = "fp_err_voice_long";
  if (d.description && String(d.description).length > MAX_DESCRIPTION) e.description = "fp_err_description_long";

  const priceTypes = PRICE_TYPES_BY_KIND[kind] || [];
  const priceRequired = kind !== KIND.HERD; // herd owners may leave the rate for chat
  if (d.priceType || priceRequired) {
    if (!priceTypes.includes(d.priceType)) e.priceType = "fp_err_price_type";
    else if (d.priceType !== PRICE.FREE_FOR_MANURE) {
      const amt = num(d.amount);
      if (amt === null || amt <= 0) e.amount = "fp_err_amount";
      else if (amt > 10_000_000) e.amount = "fp_err_amount_high";
    }
  }

  if (kind === KIND.RESIDUE) {
    if (!d.crop) e.crop = "fp_err_crop";
    if (d.crop === "other" && !String(d.cropOther || "").trim()) e.cropOther = "fp_err_crop_other";
    const acres = num(d.acres);
    if (acres === null || acres <= 0 || acres > 10000) e.acres = "fp_err_acres";
    if (!d.availableFrom) e.availableFrom = "fp_err_from";
    if (!d.untilFinished) {
      if (!d.availableUntil) e.availableUntil = "fp_err_until";
      else if (d.availableFrom && d.availableUntil < d.availableFrom) e.availableUntil = "fp_err_until_before";
    }
    if (photos.length < 1) e.photos = e.photos || "fp_err_photos_min";
    if (d.lastSprayDate && d.lastSprayDate > isoDay()) e.lastSprayDate = "fp_err_spray_future";
  }

  if (kind === KIND.NIGHT_STAY_NEED) {
    const acres = num(d.acres);
    if (acres === null || acres <= 0 || acres > 10000) e.acres = "fp_err_acres";
    if (!d.availableFrom) e.availableFrom = "fp_err_from";
    const nights = num(d.nights);
    if (nights === null || nights < 1 || nights > 365 || !Number.isInteger(nights)) e.nights = "fp_err_nights";
    if (!ANIMAL_PREFS.includes(d.animalPreferred)) e.animalPreferred = "fp_err_animal";
    if ((d.extras || []).some((x) => !EXTRAS.includes(x))) e.extras = "fp_err_extras";
  }

  if (kind === KIND.HERD) {
    if (!ANIMALS.includes(d.animalType)) e.animalType = "fp_err_animal";
    const count = num(d.animalCount);
    if (count === null || count < 1 || count > 100000 || !Number.isInteger(count)) e.animalCount = "fp_err_count";
    if (!d.availableFrom) e.availableFrom = "fp_err_from";
    if (d.availableUntil && d.availableFrom && d.availableUntil < d.availableFrom) e.availableUntil = "fp_err_until_before";
    const lf = d.lookingFor || [];
    if (lf.length === 0 || lf.some((x) => !LOOKING_FOR.includes(x))) e.lookingFor = "fp_err_looking_for";
  }
  return e;
}

/**
 * Builds the Firestore document body from form data: keeps only the fields
 * that belong to this kind, converts numbers, and adds the geohash. Server
 * timestamps / owner fields are added by the data layer.
 */
export function buildPostDoc(kind, d) {
  const base = {
    kind,
    lat: d.lat,
    lng: d.lng,
    geohash: geohashFor(d.lat, d.lng),
    state: d.state || "",
    district: d.district || "",
    mandal: d.mandal || "",
    village: String(d.village || "").trim(),
    photos: (d.photos || []).slice(0, MAX_PHOTOS).map((p) => ({ path: p.path, url: p.url })),
    voiceNote: d.voiceNote ? { path: d.voiceNote.path, url: d.voiceNote.url, durationSec: num(d.voiceNote.durationSec) || 0 } : null,
    description: String(d.description || "").trim().slice(0, MAX_DESCRIPTION),
    priceType: d.priceType || null,
    amount: d.priceType && d.priceType !== PRICE.FREE_FOR_MANURE ? num(d.amount) : null,
    negotiable: !!d.negotiable,
    availableFrom: d.availableFrom || null,
  };
  if (kind === KIND.RESIDUE) {
    return {
      ...base,
      crop: d.crop,
      cropOther: d.crop === "other" ? String(d.cropOther || "").trim() : "",
      acres: num(d.acres),
      untilFinished: !!d.untilFinished,
      availableUntil: d.untilFinished ? null : d.availableUntil || null,
      allowNightStay: !!d.allowNightStay,
      waterNearby: d.waterNearby === true ? true : d.waterNearby === false ? false : null,
      notSprayed: !!d.notSprayed,
      lastSprayDate: d.notSprayed ? null : d.lastSprayDate || null,
    };
  }
  if (kind === KIND.NIGHT_STAY_NEED) {
    return {
      ...base,
      acres: num(d.acres),
      nights: num(d.nights),
      availableUntil: addDaysIso(d.availableFrom, num(d.nights)),
      animalPreferred: d.animalPreferred,
      extras: (d.extras || []).filter((x) => EXTRAS.includes(x)),
      linkedResiduePostId: d.linkedResiduePostId || null,
    };
  }
  return {
    ...base,
    animalType: d.animalType,
    animalCount: num(d.animalCount),
    headingTo: String(d.headingTo || "").trim().slice(0, 200),
    availableUntil: d.availableUntil || null,
    lookingFor: (d.lookingFor || []).filter((x) => LOOKING_FOR.includes(x)),
  };
}

export function addDaysIso(iso, days) {
  if (!iso || !Number.isFinite(days)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// ---- Visibility --------------------------------------------------------------
/** A post shows in browse lists only when not hidden, not full/closed and not expired. */
export function isListed(post, now = Date.now()) {
  if (!post || post.hidden) return false;
  if (post.status === STATUS.FULL || post.status === STATUS.CLOSED) return false;
  if (post.availableUntil && post.availableUntil < isoDay(new Date(now))) return false;
  if (post.kind === KIND.HERD && isHerdStale(post, now)) return false;
  return true;
}

export function isHerdStale(post, now = Date.now()) {
  const at = toMillis(post.locationUpdatedAt) || toMillis(post.updatedAt) || toMillis(post.createdAt);
  if (!at) return false;
  return now - at > HERD_STALE_DAYS * DAY_MS;
}

/** True when the herd moved far enough to be worth saving (and alerting). */
export function herdMovedEnough(prev, next) {
  if (!prev || !isFiniteNumber(prev.lat) || !isFiniteNumber(prev.lng)) return true;
  const km = distanceKm(prev.lat, prev.lng, next.lat, next.lng);
  return km === null || km >= HERD_MOVE_THRESHOLD_KM;
}

// ---- Spray warning -------------------------------------------------------------
/**
 * "unknown"  – no spray date and not marked as unsprayed
 * "recent"   – sprayed within the warning window
 * "ok"       – sprayed longer ago, or marked not sprayed
 */
export function sprayStatus(post, warningDays = DEFAULT_SPRAY_WARNING_DAYS, now = new Date()) {
  if (post.notSprayed) return { status: "ok", daysAgo: null };
  if (!post.lastSprayDate) return { status: "unknown", daysAgo: null };
  const sprayed = Date.parse(post.lastSprayDate + "T00:00:00");
  const today = Date.parse(isoDay(now) + "T00:00:00");
  const daysAgo = Math.max(0, Math.round((today - sprayed) / DAY_MS));
  return { status: daysAgo < warningDays ? "recent" : "ok", daysAgo };
}

// ---- Price label ---------------------------------------------------------------
/** e.g. "₹500 / day", "₹12,000 (one price)", "Free for manure". `t` is the translator. */
export function priceLabel(post, t) {
  if (!post.priceType) return t("fp_price_ask");
  if (post.priceType === PRICE.FREE_FOR_MANURE) return t("fp_price_free_manure");
  const amount = Number(post.amount || 0).toLocaleString("en-IN");
  const unit = t(PRICE_UNIT_KEY[post.priceType]);
  const neg = post.negotiable ? ` · ${t("fp_negotiable")}` : "";
  if (post.priceType === PRICE.FULL_COMPLETION || post.priceType === PRICE.LUMP_SUM) return `₹${amount} (${unit})${neg}`;
  return `₹${amount} / ${unit}${neg}`;
}

// ---- Distance sorting ------------------------------------------------------------
export function withDistance(posts, origin) {
  if (!origin) return posts.map((p) => ({ ...p, _dist: null }));
  return posts
    .map((p) => ({ ...p, _dist: distanceKm(origin.lat, origin.lng, p.lat, p.lng) }))
    .sort((a, b) => (a._dist ?? Infinity) - (b._dist ?? Infinity));
}

export function sortNewestFirst(posts) {
  return [...posts].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

/** Filters for the browse screens. Every filter is optional. */
export function filterPosts(posts, { crop, priceType, maxKm, animal, availableNow } = {}, now = Date.now()) {
  const today = isoDay(new Date(now));
  return posts.filter((p) => {
    if (crop && p.crop !== crop) return false;
    if (priceType && p.priceType !== priceType) return false;
    if (maxKm && (p._dist === null || p._dist === undefined || p._dist > maxKm)) return false;
    if (animal) {
      const a = p.kind === KIND.HERD ? p.animalType : p.animalPreferred;
      if (a !== animal && a !== "any" && a !== "mixed") return false;
    }
    if (availableNow && p.availableFrom && p.availableFrom > today) return false;
    return true;
  });
}

// ---- Titles shown in chat headers / notifications -----------------------------------
export function postTitle(post, t, cropName) {
  if (post.kind === KIND.RESIDUE) {
    return `${cropName || post.cropOther || t("fp_crop_other")} · ${post.acres} ${t("fp_acres")}`;
  }
  if (post.kind === KIND.NIGHT_STAY_NEED) {
    return `${t("fp_need_herd_title")} · ${post.acres} ${t("fp_acres")}`;
  }
  return `${ANIMAL_EMOJI[post.animalType] || ""} ${t("fp_animal_" + post.animalType)} · ${post.animalCount}`.trim();
}
