import { test } from "node:test";
import assert from "node:assert/strict";
import {
  KIND, PRICE, STATUS, validatePost, buildPostDoc, isListed, isHerdStale, herdMovedEnough,
  sprayStatus, priceLabel, withDistance, filterPosts, addDaysIso, isoDay, geohashFor, MAX_PHOTOS,
} from "./fields.logic.js";

const t = (k) => ({
  fp_unit_day: "day", fp_unit_week: "week", fp_unit_night: "night", fp_unit_acre: "acre",
  fp_unit_season: "season", fp_unit_full: "one price", fp_unit_lump: "one price",
  fp_price_free_manure: "Free for manure", fp_negotiable: "Negotiable", fp_price_ask: "Ask price",
}[k] || k);

const today = isoDay();
const photo = { path: "fieldPosts/u1/p1/a.jpg", url: "https://x/a.jpg" };
const residue = {
  lat: 16.5, lng: 80.6, village: "Ponnur", district: "Guntur", crop: "cotton", acres: "3",
  availableFrom: today, untilFinished: true, priceType: PRICE.PER_DAY, amount: "500", photos: [photo],
};

test("valid residue post passes", () => {
  assert.deepEqual(validatePost(KIND.RESIDUE, residue), {});
});

test("residue post: required fields are reported", () => {
  const e = validatePost(KIND.RESIDUE, { photos: [] });
  for (const k of ["location", "village", "crop", "acres", "availableFrom", "availableUntil", "photos", "priceType"]) {
    assert.ok(e[k], `expected error for ${k}`);
  }
});

test("residue post: 'other' crop needs a name; end date cannot be before start", () => {
  const e = validatePost(KIND.RESIDUE, { ...residue, crop: "other", untilFinished: false, availableUntil: "2000-01-01" });
  assert.equal(e.cropOther, "fp_err_crop_other");
  assert.equal(e.availableUntil, "fp_err_until_before");
});

test("free-for-manure needs no amount; other price types need a positive amount", () => {
  assert.deepEqual(validatePost(KIND.RESIDUE, { ...residue, priceType: PRICE.FREE_FOR_MANURE, amount: "" }), {});
  assert.equal(validatePost(KIND.RESIDUE, { ...residue, amount: "0" }).amount, "fp_err_amount");
  assert.equal(validatePost(KIND.RESIDUE, { ...residue, priceType: PRICE.LUMP_SUM }).priceType, "fp_err_price_type");
});

test("max 5 photos and a future spray date are rejected", () => {
  const six = Array.from({ length: MAX_PHOTOS + 1 }, () => photo);
  assert.equal(validatePost(KIND.RESIDUE, { ...residue, photos: six }).photos, "fp_err_photos_max");
  assert.equal(validatePost(KIND.RESIDUE, { ...residue, lastSprayDate: "2999-01-01" }).lastSprayDate, "fp_err_spray_future");
});

test("voice note over 2 minutes is rejected", () => {
  assert.equal(validatePost(KIND.RESIDUE, { ...residue, voiceNote: { durationSec: 121 } }).voiceNote, "fp_err_voice_long");
  assert.equal(validatePost(KIND.RESIDUE, { ...residue, voiceNote: { durationSec: 120 } }).voiceNote, undefined);
});

test("need-a-herd post validation", () => {
  const ok = { lat: 1, lng: 1, village: "V", acres: 2, availableFrom: today, nights: 3, animalPreferred: "sheep", priceType: PRICE.PER_NIGHT, amount: 800 };
  assert.deepEqual(validatePost(KIND.NIGHT_STAY_NEED, ok), {});
  assert.equal(validatePost(KIND.NIGHT_STAY_NEED, { ...ok, nights: 2.5 }).nights, "fp_err_nights");
  assert.equal(validatePost(KIND.NIGHT_STAY_NEED, { ...ok, animalPreferred: "camel" }).animalPreferred, "fp_err_animal");
  assert.equal(validatePost(KIND.NIGHT_STAY_NEED, { ...ok, priceType: PRICE.PER_DAY }).priceType, "fp_err_price_type");
});

test("herd post: rate is optional, animals and 'looking for' are required", () => {
  const ok = { lat: 1, lng: 1, village: "V", animalType: "sheep", animalCount: 300, availableFrom: today, lookingFor: ["nightStay"] };
  assert.deepEqual(validatePost(KIND.HERD, ok), {});
  assert.equal(validatePost(KIND.HERD, { ...ok, lookingFor: [] }).lookingFor, "fp_err_looking_for");
  assert.equal(validatePost(KIND.HERD, { ...ok, animalCount: 0 }).animalCount, "fp_err_count");
  assert.equal(validatePost(KIND.HERD, { ...ok, priceType: PRICE.PER_NIGHT, amount: "" }).amount, "fp_err_amount");
});

test("buildPostDoc keeps only fields of the kind and adds a geohash", () => {
  const doc = buildPostDoc(KIND.RESIDUE, { ...residue, animalCount: 99, notSprayed: true, lastSprayDate: "2026-01-01" });
  assert.equal(doc.kind, "residue");
  assert.equal(doc.acres, 3);
  assert.equal(doc.amount, 500);
  assert.equal(doc.animalCount, undefined);
  assert.equal(doc.lastSprayDate, null, "not-sprayed clears the spray date");
  assert.equal(doc.availableUntil, null, "until finished = no end date");
  assert.equal(doc.geohash, geohashFor(16.5, 80.6));
  assert.equal(typeof doc.geohash, "string");
  const free = buildPostDoc(KIND.RESIDUE, { ...residue, priceType: PRICE.FREE_FOR_MANURE, amount: "999" });
  assert.equal(free.amount, null);
});

test("need-a-herd end date = start + nights", () => {
  const doc = buildPostDoc(KIND.NIGHT_STAY_NEED, { lat: 1, lng: 1, village: "V", availableFrom: "2026-11-01", nights: 3, acres: 1, animalPreferred: "any" });
  assert.equal(doc.availableUntil, "2026-11-04");
  assert.equal(addDaysIso("2026-12-30", 3), "2027-01-02");
});

test("listing visibility: hidden, full, closed, expired, stale herd", () => {
  const now = Date.parse("2026-11-10T10:00:00");
  const base = { kind: KIND.RESIDUE, status: STATUS.AVAILABLE, availableUntil: null };
  assert.equal(isListed(base, now), true);
  assert.equal(isListed({ ...base, status: STATUS.PARTLY }, now), true);
  assert.equal(isListed({ ...base, hidden: true }, now), false);
  assert.equal(isListed({ ...base, status: STATUS.FULL }, now), false);
  assert.equal(isListed({ ...base, status: STATUS.CLOSED }, now), false);
  assert.equal(isListed({ ...base, availableUntil: "2026-11-09" }, now), false);
  assert.equal(isListed({ ...base, availableUntil: "2026-11-10" }, now), true);
  const herd = { kind: KIND.HERD, status: STATUS.AVAILABLE, locationUpdatedAt: now - 8 * 864e5 };
  assert.equal(isHerdStale(herd, now), true);
  assert.equal(isListed(herd, now), false);
  assert.equal(isListed({ ...herd, locationUpdatedAt: now - 2 * 864e5 }, now), true);
});

test("herd location is saved only after moving at least 1 km", () => {
  assert.equal(herdMovedEnough(null, { lat: 16, lng: 80 }), true);
  assert.equal(herdMovedEnough({ lat: 16, lng: 80 }, { lat: 16.001, lng: 80 }), false); // ~110 m
  assert.equal(herdMovedEnough({ lat: 16, lng: 80 }, { lat: 16.02, lng: 80 }), true); // ~2.2 km
});

test("spray status", () => {
  const now = new Date("2026-11-21T09:00:00");
  assert.deepEqual(sprayStatus({ notSprayed: true }, 21, now), { status: "ok", daysAgo: null });
  assert.deepEqual(sprayStatus({}, 21, now), { status: "unknown", daysAgo: null });
  assert.deepEqual(sprayStatus({ lastSprayDate: "2026-11-11" }, 21, now), { status: "recent", daysAgo: 10 });
  assert.deepEqual(sprayStatus({ lastSprayDate: "2026-10-01" }, 21, now), { status: "ok", daysAgo: 51 });
});

test("price labels", () => {
  assert.equal(priceLabel({ priceType: PRICE.PER_DAY, amount: 500 }, t), "₹500 / day");
  assert.equal(priceLabel({ priceType: PRICE.FULL_COMPLETION, amount: 12000, negotiable: true }, t), "₹12,000 (one price) · Negotiable");
  assert.equal(priceLabel({ priceType: PRICE.FREE_FOR_MANURE }, t), "Free for manure");
  assert.equal(priceLabel({}, t), "Ask price");
});

test("distance sort and filters", () => {
  const posts = [
    { id: "far", lat: 16.3, lng: 80.6, crop: "paddy", priceType: PRICE.PER_DAY },
    { id: "near", lat: 16.51, lng: 80.6, crop: "cotton", priceType: PRICE.FREE_FOR_MANURE },
    { id: "noloc", crop: "cotton" },
  ];
  const sorted = withDistance(posts, { lat: 16.5, lng: 80.6 });
  assert.deepEqual(sorted.map((p) => p.id), ["near", "far", "noloc"]);
  assert.deepEqual(filterPosts(sorted, { maxKm: 10 }).map((p) => p.id), ["near"]);
  assert.deepEqual(filterPosts(sorted, { crop: "cotton" }).map((p) => p.id), ["near", "noloc"]);
  assert.deepEqual(filterPosts(sorted, { priceType: PRICE.PER_DAY }).map((p) => p.id), ["far"]);
  const herds = [{ kind: KIND.HERD, animalType: "sheep" }, { kind: KIND.HERD, animalType: "mixed" }, { kind: KIND.HERD, animalType: "cattle" }];
  assert.equal(filterPosts(herds, { animal: "sheep" }).length, 2);
});
