import { test } from "node:test";
import assert from "node:assert/strict";
import {
  triggerFor, planAlerts, isActive, wantsAlert, recentlySent, isQuietTime, istDay, KIND, SEARCH_RADIUS_KM,
} from "../src/matching.js";
import { normalizeSettings } from "../src/settings.js";
import { TEXTS, fmt, distText, cropText, animalText, durText, LANGS } from "../src/texts.js";

const NOW = Date.parse("2026-11-10T06:00:00Z"); // 11:30 IST
const at = (lat, lng, extra) => ({ lat, lng, status: "available", hidden: false, ...extra });
// ~0.009 deg latitude = 1 km
const herd = at(16.30, 80.44, { kind: KIND.HERD, ownerId: "herder", animalType: "sheep", animalCount: 300, locationUpdatedAt: NOW - 3600e3 });

test("trigger: new, reactivated, moved herd; nothing for plain edits", () => {
  assert.equal(triggerFor(null, herd, NOW), "created");
  assert.equal(triggerFor({ ...herd, status: "full" }, herd, NOW), "reactivated");
  assert.equal(triggerFor(herd, { ...herd, lat: 16.32 }, NOW), "moved");
  assert.equal(triggerFor(herd, { ...herd, lat: 16.3005 }, NOW), null, "55 m is GPS jitter");
  assert.equal(triggerFor(herd, { ...herd, status: "full" }, NOW), null, "becoming full alerts nobody");
  assert.equal(triggerFor(null, { ...herd, hidden: true }, NOW), null);
  const residue = at(16.31, 80.44, { kind: KIND.RESIDUE, ownerId: "f1" });
  assert.equal(triggerFor(residue, { ...residue, lat: 16.5 }, NOW), null, "moving a field is not a trigger");
});

test("herd near fields: each field owner alerted once, closest first, own posts skipped", () => {
  const cands = [
    { id: "r1", ...at(16.309, 80.44, { kind: KIND.RESIDUE, ownerId: "f1" }) }, // ~1 km
    { id: "r2", ...at(16.345, 80.44, { kind: KIND.RESIDUE, ownerId: "f1" }) }, // same owner, farther
    { id: "n1", ...at(16.33, 80.44, { kind: KIND.NEED, ownerId: "f2" }) }, // ~3.3 km
    { id: "far", ...at(16.60, 80.44, { kind: KIND.RESIDUE, ownerId: "f3" }) }, // ~33 km
    { id: "full", ...at(16.31, 80.44, { kind: KIND.RESIDUE, ownerId: "f4", status: "full" }) },
    { id: "mine", ...at(16.31, 80.44, { kind: KIND.RESIDUE, ownerId: "herder" }) },
    { id: "otherHerd", ...at(16.31, 80.44, { kind: KIND.HERD, ownerId: "h2", locationUpdatedAt: NOW }) },
  ];
  const plan = planAlerts("h1", herd, cands, NOW);
  const byR = Object.fromEntries(plan.direct.map((d) => [d.recipientId, d]));
  assert.deepEqual(Object.keys(byR).sort(), ["f1", "f2"]);
  assert.equal(byR.f1.pairKey, "h1__r1", "closest field of that owner");
  assert.equal(byR.f1.type, "herdNear");
  assert.equal(byR.f1.link, "/field-posts/h1");
  assert.ok(byR.f1.km > 0.9 && byR.f1.km < 1.1);
  assert.equal(plan.summary.recipientId, "herder");
  assert.deepEqual(plan.summary.residue.map((x) => x.id), ["r1", "r2"]);
  assert.deepEqual(plan.summary.need.map((x) => x.id), ["n1"]);
});

test("new residue field / need-a-herd: herd owners nearby are alerted", () => {
  const field = at(16.30, 80.44, { kind: KIND.RESIDUE, ownerId: "f1", crop: "cotton" });
  const cands = [{ id: "h1", ...herd, ownerId: "h" }, { id: "h2", ...at(16.6, 80.44, { kind: KIND.HERD, ownerId: "hFar", locationUpdatedAt: NOW }) }];
  const p = planAlerts("r9", field, cands, NOW);
  assert.equal(p.direct.length, 1);
  assert.equal(p.direct[0].type, "residueNear");
  assert.equal(p.direct[0].template, "residueNew");
  assert.equal(p.summary, null);
  const need = planAlerts("n9", { ...field, kind: KIND.NEED }, cands, NOW);
  assert.equal(need.direct[0].type, "nightStayWork");
});

test("stale herds (7 days without update) and expired posts are inactive", () => {
  assert.equal(isActive({ ...herd, locationUpdatedAt: NOW - 8 * 864e5 }, NOW), false);
  assert.equal(isActive({ kind: KIND.RESIDUE, status: "available", availableUntil: "2026-11-09" }, NOW), false);
  assert.equal(isActive({ kind: KIND.RESIDUE, status: "partly", availableUntil: "2026-11-10" }, NOW), true);
});

test("recipient distance and on/off choices", () => {
  const s = normalizeSettings({ radiusKm: 5, types: { herdNear: true, residueNear: false } });
  assert.equal(wantsAlert(s, "herdNear", 4.9), true);
  assert.equal(wantsAlert(s, "herdNear", 5.1), false);
  assert.equal(wantsAlert(s, "residueNear", 1), false);
  assert.equal(wantsAlert(s, "chat", 999), true, "chat is not limited by distance");
  assert.equal(SEARCH_RADIUS_KM, 25);
});

test("48-hour repeat window and quiet hours (India time)", () => {
  assert.equal(recentlySent(NOW - 47 * 3600e3, NOW), true);
  assert.equal(recentlySent(NOW - 49 * 3600e3, NOW), false);
  assert.equal(recentlySent(0, NOW), false);
  assert.equal(isQuietTime(Date.parse("2026-11-10T17:00:00Z")), true, "10:30 pm IST");
  assert.equal(isQuietTime(Date.parse("2026-11-10T23:00:00Z")), true, "4:30 am IST");
  assert.equal(isQuietTime(Date.parse("2026-11-10T00:00:00Z")), false, "5:30 am IST");
  assert.equal(istDay(Date.parse("2026-11-10T19:00:00Z")), "2026-11-11", "after midnight IST is the next day");
});

test("texts exist in every language with the same placeholders", () => {
  const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const [key, t] of Object.entries(TEXTS)) {
    const parts = t.title ? [t.title, t.body].filter(Boolean) : [t];
    for (const part of parts) {
      for (const l of LANGS) assert.ok(part[l], `${key} missing ${l}`);
      assert.equal(ph(part.te), ph(part.en), `${key} te placeholders`);
      assert.equal(ph(part.hi), ph(part.en), `${key} hi placeholders`);
    }
  }
});

test("spec sample texts render as designed", () => {
  const vars = { count: 300, animal: animalText("sheep", "te"), dist: distText(3.2, "te") };
  assert.equal(fmt(TEXTS.herdNear.body.te, vars), "సుమారు 300 గొర్రెలు 3 కి.మీ. దూరంలో ఉన్నాయి. మాట్లాడటానికి నొక్కండి.");
  assert.equal(fmt(TEXTS.herdNear.body.en, { count: 300, animal: "sheep", dist: distText(3.2, "en") }), "About 300 sheep are 3 km away. Tap to chat.");
  assert.equal(distText(0.3, "hi"), "1 कि.मी.");
  assert.equal(cropText({ crop: "cotton" }, "hi"), "कपास");
  assert.equal(cropText({ crop: "other", cropOther: "Ragi" }, "te"), "Ragi");
  assert.equal(cropText({ crop: "ragi" }, "te", { ragi: { te: "రాగి" } }), "రాగి");
  assert.equal(durText(84), "1:24");
});
