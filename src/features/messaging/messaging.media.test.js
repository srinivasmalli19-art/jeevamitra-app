import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildVoiceFields, buildImageFields, previewForMedia, normalizeMedia, chatMediaFolder,
  FALLBACK_VOICE, FALLBACK_PHOTOS, MAX_CHAT_IMAGES,
} from "./messaging.media.js";
import { normalizeMessage, validateMessageText } from "./messaging.logic.js";

const img = (i) => ({ path: `chats/I/U/${i}.jpg`, url: `https://x/${i}.jpg` });

test("voice message fields carry a fallback text for version 61", () => {
  const f = buildVoiceFields({ path: "chats/I/U/a.webm", url: "https://x/a", durationSec: 84.4, mimeType: "audio/webm" });
  assert.equal(f.type, "voice");
  assert.equal(f.text, FALLBACK_VOICE);
  assert.equal(f.media.voice.durationSec, 84);
  assert.ok(validateMessageText(f.text).ok, "fallback passes the old app's text rules");
});

test("voice over 2 minutes or empty is rejected", () => {
  assert.throws(() => buildVoiceFields({ path: "p", url: "u", durationSec: 121 }));
  assert.throws(() => buildVoiceFields({ path: "p", url: "u", durationSec: 0 }));
  assert.throws(() => buildVoiceFields({ url: "u", durationSec: 5 }));
});

test("photo message: 1 to 5 photos, caption kept, fallback text", () => {
  const f = buildImageFields([img(1), img(2), img(3)], "  field near the canal  ");
  assert.equal(f.type, "image");
  assert.equal(f.media.images.length, 3);
  assert.equal(f.caption, "field near the canal");
  assert.ok(f.text.startsWith(FALLBACK_PHOTOS));
  assert.ok(f.text.endsWith("field near the canal"));
  assert.throws(() => buildImageFields([], ""));
  assert.throws(() => buildImageFields(Array.from({ length: MAX_CHAT_IMAGES + 1 }, (_, i) => img(i)), ""));
});

test("conversation preview is language-neutral", () => {
  assert.equal(previewForMedia(buildVoiceFields({ path: "p", url: "u", durationSec: 84 })), "🎤 1:24");
  assert.equal(previewForMedia(buildImageFields([img(1)], "")), "📷");
  assert.equal(previewForMedia(buildImageFields([img(1), img(2)], "hi")), "📷 ×2 hi");
});

test("normalizeMessage keeps media and stays backward compatible", () => {
  const old = normalizeMessage("m1", { senderId: "a", text: "hello" });
  assert.equal(old.type, "text");
  assert.equal(old.media, null);
  const v = normalizeMessage("m2", { type: "voice", text: FALLBACK_VOICE, media: { voice: { url: "u", durationSec: 9 } } });
  assert.equal(v.media.voice.durationSec, 9);
  const bad = normalizeMessage("m3", { type: "image", media: { images: [{ nope: 1 }] } });
  assert.equal(bad.media, null);
});

test("chat media folder matches storage.rules", () => {
  assert.equal(chatMediaFolder("pub_X__req_A__rec_B", "A"), "chats/pub_X__req_A__rec_B/A");
  assert.equal(normalizeMedia({ images: [{ url: "u" }] }).images.length, 1);
});
