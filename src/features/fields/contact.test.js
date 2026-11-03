import { test } from "node:test";
import assert from "node:assert/strict";
import { phoneDigits, telUrl, whatsappChatUrl } from "./contact.js";
import { relTime, fmtDistance } from "./time.js";

test("Indian phone numbers become international digits", () => {
  assert.equal(phoneDigits("98765 43210"), "919876543210");
  assert.equal(phoneDigits("09876543210"), "919876543210");
  assert.equal(phoneDigits("+91 98765-43210"), "919876543210");
  assert.equal(phoneDigits("123"), "");
  assert.equal(telUrl(""), "");
  assert.equal(telUrl("9876543210"), "tel:+919876543210");
  assert.equal(whatsappChatUrl("9876543210", "Hi"), "https://wa.me/919876543210?text=Hi");
});

test("relative time and local distance", () => {
  const tf = (k, v = {}) => `${k}:${v.n ?? ""}`;
  const now = Date.parse("2026-11-01T12:00:00Z");
  assert.equal(relTime(now - 30e3, tf, now), "fp_time_just_now:");
  assert.equal(relTime(now - 15 * 60e3, tf, now), "fp_time_minutes:15");
  assert.equal(relTime(now - 5 * 3600e3, tf, now), "fp_time_hours:5");
  assert.equal(relTime(now - 3 * 86400e3, tf, now), "fp_time_days:3");
  assert.equal(relTime(null, tf, now), "");
  const t = (k) => ({ fp_km: "కి.మీ.", fp_m: "మీ." }[k]);
  assert.equal(fmtDistance(0.42, t), "420 మీ.");
  assert.equal(fmtDistance(3.24, t), "3.2 కి.మీ.");
  assert.equal(fmtDistance(null, t), "");
});
