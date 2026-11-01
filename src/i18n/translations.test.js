import { test } from "node:test";
import assert from "node:assert/strict";
import { translations, LANGUAGES } from "./translations.js";

const codes = LANGUAGES.map((l) => l.code);
const enKeys = Object.keys(translations.en);
// Words that are legitimately the same in every language.
const SAME_OK = new Set(["whatsapp"]);

test("every language listed has a translation block", () => {
  for (const code of codes) assert.ok(translations[code], `missing block: ${code}`);
});

test("every English key exists, non-empty, in Telugu and Hindi", () => {
  for (const code of codes.filter((c) => c !== "en")) {
    const missing = enKeys.filter((k) => typeof translations[code][k] !== "string" || !translations[code][k].trim());
    assert.deepEqual(missing, [], `${code} is missing: ${missing.join(", ")}`);
  }
});

test("Telugu and Hindi have no keys that English lacks", () => {
  for (const code of codes.filter((c) => c !== "en")) {
    const extra = Object.keys(translations[code]).filter((k) => !(k in translations.en));
    assert.deepEqual(extra, [], `${code} has extra keys: ${extra.join(", ")}`);
  }
});

test("no Telugu/Hindi value is just the English text (untranslated)", () => {
  for (const code of ["te", "hi"]) {
    const same = enKeys.filter(
      (k) => !SAME_OK.has(k) && translations.en[k].length > 3 && translations[code][k] === translations.en[k],
    );
    assert.deepEqual(same, [], `${code} untranslated: ${same.join(", ")}`);
  }
});

test("placeholders like {n} are kept in every language", () => {
  const ph = (s) => (s.match(/\{[a-z]+\}/gi) || []).sort().join(",");
  for (const k of enKeys) {
    for (const code of ["te", "hi"]) {
      assert.equal(ph(translations[code][k]), ph(translations.en[k]), `${code}.${k} placeholders differ`);
    }
  }
});

test("Telugu values are in Telugu script and Hindi values in Devanagari", () => {
  const te = /[ఀ-౿]/;
  const hi = /[ऀ-ॿ]/;
  for (const k of enKeys) {
    if (SAME_OK.has(k)) continue;
    if (/[A-Za-z]/.test(translations.en[k])) {
      assert.ok(te.test(translations.te[k]), `te.${k} has no Telugu letters: ${translations.te[k]}`);
      assert.ok(hi.test(translations.hi[k]), `hi.${k} has no Devanagari letters: ${translations.hi[k]}`);
    }
  }
});
