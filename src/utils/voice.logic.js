// Pure helpers for voice recording (testable without a browser).
export const VOICE_MAX_SECONDS = 120;
export const VOICE_BITS_PER_SECOND = 24000; // ~360 KB for 2 minutes

// Android WebView (Capacitor) records Opus in WebM; iOS/Safari uses MP4/AAC.
export const PREFERRED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac", "audio/ogg;codecs=opus"];

/** First type the recorder supports, or "" to let the browser choose. */
export function pickMimeType(isTypeSupported) {
  if (typeof isTypeSupported !== "function") return "";
  return PREFERRED_MIME_TYPES.find((t) => {
    try { return isTypeSupported(t); } catch { return false; }
  }) || "";
}

/** Base content type for upload / storage rules ("audio/webm;codecs=opus" -> "audio/webm"). */
export function baseMime(mime) {
  return (mime || "audio/webm").split(";")[0].trim() || "audio/webm";
}

/** 0 -> "0:00", 84 -> "1:24", 120 -> "2:00" */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Seconds left before the 2-minute limit. */
export function secondsLeft(elapsed, max = VOICE_MAX_SECONDS) {
  return Math.max(0, max - Math.floor(elapsed));
}
