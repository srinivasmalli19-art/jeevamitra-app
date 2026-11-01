import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSettings, DEFAULT_SETTINGS, ALERT_TYPES } from "./notifSettings.logic.js";

test("defaults: 10 km, quiet hours on, every alert on", () => {
  const s = normalizeSettings(null);
  assert.equal(s.radiusKm, 10);
  assert.equal(s.quietHours, true);
  assert.deepEqual(Object.keys(s.types), ALERT_TYPES);
  assert.ok(Object.values(s.types).every(Boolean));
  assert.equal(DEFAULT_SETTINGS.radiusKm, 10);
});

test("valid choices are kept, invalid ones fall back", () => {
  const s = normalizeSettings({ radiusKm: 25, quietHours: false, types: { chat: false, herdNear: "no", hacker: true } });
  assert.equal(s.radiusKm, 25);
  assert.equal(s.quietHours, false);
  assert.equal(s.types.chat, false);
  assert.equal(s.types.herdNear, true);
  assert.equal(s.types.hacker, undefined);
  assert.equal(normalizeSettings({ radiusKm: 100 }).radiusKm, 10);
});
