import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CROPS, DEFAULT_SETTINGS } from "./cropGuides.defaults.js";
import { mergeCrops, mergeSettings, pick, cropName, LANGS, CARD_FIELDS } from "./cropGuides.logic.js";

const TE = /[ఀ-౿]/;
const HI = /[ऀ-ॿ]/;

test("14 built-in crops with unique ids and order", () => {
  assert.equal(DEFAULT_CROPS.length, 14);
  assert.equal(new Set(DEFAULT_CROPS.map((c) => c.id)).size, 14);
  assert.equal(new Set(DEFAULT_CROPS.map((c) => c.order)).size, 14);
});

test("every crop card is complete in all three languages and the right script", () => {
  for (const c of DEFAULT_CROPS) {
    for (const f of CARD_FIELDS) {
      for (const l of LANGS) assert.ok(c[f]?.[l]?.trim(), `${c.id}.${f}.${l} empty`);
      assert.ok(TE.test(c[f].te), `${c.id}.${f}.te not Telugu`);
      assert.ok(HI.test(c[f].hi), `${c.id}.${f}.hi not Devanagari`);
    }
    assert.ok(["sourced", "partly", "vet"].includes(c.basis), `${c.id} basis`);
  }
});

test("general precautions: 7 rules in each language; disclaimer and call-vet present", () => {
  for (const l of LANGS) {
    assert.equal(DEFAULT_SETTINGS.generalPrecautions[l].length, 7, `${l} precautions`);
    assert.ok(DEFAULT_SETTINGS.disclaimer[l]);
    assert.ok(DEFAULT_SETTINGS.callVet[l]);
  }
});

test("numbers in a card are the same in all three languages", () => {
  const digits = (s) => (s.match(/\d+/g) || []).join(",");
  for (const c of DEFAULT_CROPS) {
    for (const f of CARD_FIELDS) {
      assert.equal(digits(c[f].te), digits(c[f].en), `${c.id}.${f} te numbers`);
      assert.equal(digits(c[f].hi), digits(c[f].en), `${c.id}.${f} hi numbers`);
    }
  }
  for (let i = 0; i < 7; i++) {
    const en = DEFAULT_SETTINGS.generalPrecautions.en[i].match(/\d+/g)?.join(",") || "";
    assert.equal(DEFAULT_SETTINGS.generalPrecautions.te[i].match(/\d+/g)?.join(",") || "", en);
    assert.equal(DEFAULT_SETTINGS.generalPrecautions.hi[i].match(/\d+/g)?.join(",") || "", en);
  }
});

test("admin edits override text, add crops, hide crops and reorder", () => {
  const crops = mergeCrops([
    { id: "cotton", risk: { te: "కొత్త వచనం" }, reviewedBy: "Dr. Rao", reviewedOn: "2026-11-05" },
    { id: "paddy", hidden: true },
    { id: "ragi", name: { en: "Ragi", te: "రాగి", hi: "रागी" }, order: 0 },
    { id: "bad id!", name: { en: "x" } },
    { id: "empty" },
  ]);
  const cotton = crops.find((c) => c.id === "cotton");
  assert.equal(cotton.risk.te, "కొత్త వచనం");
  assert.ok(cotton.risk.en.startsWith("Cotton plants"), "untouched languages keep defaults");
  assert.equal(cotton.reviewedBy, "Dr. Rao");
  assert.equal(crops.find((c) => c.id === "paddy"), undefined, "hidden crop removed");
  assert.equal(crops[0].id, "ragi", "order respected");
  assert.equal(crops.find((c) => c.id === "bad id!"), undefined);
  assert.equal(crops.find((c) => c.id === "empty"), undefined);
  assert.ok(mergeCrops([{ id: "paddy", hidden: true }], { includeHidden: true }).find((c) => c.id === "paddy"));
});

test("empty admin text never wipes a default", () => {
  const c = mergeCrops([{ id: "maize", goodFor: { en: "   ", te: "" } }]).find((x) => x.id === "maize");
  assert.equal(c.goodFor.en, "Good dry fodder.");
});

test("settings merge and validation", () => {
  const s = mergeSettings({ sprayWarningDays: 30, generalPrecautions: { hi: ["एक", "  "] }, disclaimer: { en: "Ask a vet." } });
  assert.equal(s.sprayWarningDays, 30);
  assert.deepEqual(s.generalPrecautions.hi, ["एक"]);
  assert.equal(s.generalPrecautions.te.length, 7);
  assert.equal(s.disclaimer.en, "Ask a vet.");
  assert.equal(mergeSettings({ sprayWarningDays: -3 }).sprayWarningDays, 21);
  assert.equal(mergeSettings(null).sprayWarningDays, 21);
});

test("pick falls back to English", () => {
  assert.equal(pick({ en: "A", te: "ఆ" }, "hi"), "A");
  assert.equal(pick({ te: "ఆ" }, "hi"), "ఆ");
  assert.equal(cropName(mergeCrops(), "jowar", "te"), "జొన్న");
  assert.equal(cropName(mergeCrops(), "nope", "te", "Other"), "Other");
});
