// v62: pure helpers for voice and photo chat messages (no Firebase).
//
// Compatibility with version 61: older apps only read `message.text` and
// `interaction.lastMessage`. Every media message therefore carries a short,
// language-neutral fallback in `text`, so an old app shows a readable line
// ("🎤 Voice message · వాయిస్ సందేశం · वॉइस संदेश …") instead of an empty bubble.
export const MAX_CHAT_IMAGES = 5;
export const MAX_CHAT_VOICE_SECONDS = 120;
export const MAX_CAPTION = 500;

export const FALLBACK_VOICE = "🎤 Voice message · వాయిస్ సందేశం · वॉइस संदेश (update JeevaMitra to listen)";
export const FALLBACK_PHOTOS = "📷 Photos · ఫోటోలు · फ़ोटो (update JeevaMitra to see them)";

export function chatMediaFolder(interactionId, senderId) {
  return `chats/${interactionId}/${senderId}`;
}

function cleanCaption(c) {
  return String(c || "").trim().slice(0, MAX_CAPTION);
}

/** Validates and builds the Firestore fields for a voice message. */
export function buildVoiceFields(voice) {
  const d = Math.round(Number(voice?.durationSec) || 0);
  if (!voice?.path || !voice?.url) throw new Error("msg_upload_failed");
  if (d < 1 || d > MAX_CHAT_VOICE_SECONDS) throw new Error("vr_max_reached");
  return {
    type: "voice",
    text: FALLBACK_VOICE,
    caption: "",
    media: { voice: { path: voice.path, url: voice.url, durationSec: d, mimeType: voice.mimeType || "audio/webm" } },
  };
}

/** Validates and builds the Firestore fields for a photo message (1 to 5 photos). */
export function buildImageFields(images, caption) {
  const list = (images || []).filter((x) => x && x.path && x.url);
  if (list.length < 1) throw new Error("msg_upload_failed");
  if (list.length > MAX_CHAT_IMAGES) throw new Error("fp_err_photos_max");
  const cap = cleanCaption(caption);
  return {
    type: "image",
    text: cap ? `${FALLBACK_PHOTOS}\n${cap}` : FALLBACK_PHOTOS,
    caption: cap,
    media: { images: list.map((x) => ({ path: x.path, url: x.url, w: x.w || null, h: x.h || null })) },
  };
}

/** Conversation-list preview: language-neutral, so it reads in any app language. */
export function previewForMedia(fields) {
  if (fields.type === "voice") {
    const s = fields.media.voice.durationSec;
    return `🎤 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  const n = fields.media.images.length;
  const base = n === 1 ? "📷" : `📷 ×${n}`;
  return fields.caption ? `${base} ${fields.caption}`.slice(0, 140) : base;
}

/** Shape-check used by normalizeMessage. */
export function normalizeMedia(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.voice && raw.voice.url) {
    return { voice: { url: String(raw.voice.url), path: raw.voice.path || null, durationSec: Number(raw.voice.durationSec) || 0 } };
  }
  if (Array.isArray(raw.images)) {
    const images = raw.images.filter((x) => x && x.url).slice(0, MAX_CHAT_IMAGES).map((x) => ({ url: String(x.url), path: x.path || null }));
    return images.length ? { images } : null;
  }
  return null;
}
