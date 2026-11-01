// v62: tap to start, tap to stop, preview, then the caller decides to send /
// keep. Stops automatically at 2 minutes. Used by post forms and chat.
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { pickMimeType, baseMime, formatDuration, VOICE_MAX_SECONDS, VOICE_BITS_PER_SECOND } from "../utils/voice.logic";
import VoicePlayer from "./VoicePlayer";

/**
 * Props:
 *  - value: { blob, mimeType, durationSec, url } | null  (current recording)
 *  - onChange(next | null)
 *  - compact: smaller layout for the chat bar
 */
export default function VoiceRecorder({ value, onChange, compact = false }) {
  const { t } = useLanguage();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }

  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") {
      setError(t("vr_not_supported"));
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setError(t("vr_mic_denied"));
      return;
    }
    streamRef.current = stream;
    const mimeType = pickMimeType((m) => window.MediaRecorder.isTypeSupported(m));
    let rec;
    try {
      rec = new window.MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: VOICE_BITS_PER_SECOND });
    } catch {
      rec = new window.MediaRecorder(stream);
    }
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const durationSec = Math.min(VOICE_MAX_SECONDS, Math.round((Date.now() - startRef.current) / 1000));
      const type = baseMime(rec.mimeType || mimeType);
      const blob = new Blob(chunksRef.current, { type });
      cleanup();
      setRecording(false);
      if (blob.size > 0 && durationSec >= 1) {
        onChange({ blob, mimeType: type, durationSec, url: URL.createObjectURL(blob) });
      }
    };
    recRef.current = rec;
    startRef.current = Date.now();
    setElapsed(0);
    rec.start(1000);
    setRecording(true);
    timerRef.current = setInterval(() => {
      const secs = (Date.now() - startRef.current) / 1000;
      setElapsed(secs);
      if (secs >= VOICE_MAX_SECONDS) {
        setError(t("vr_max_reached"));
        stop();
      }
    }, 250);
  }

  function stop() {
    clearInterval(timerRef.current);
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
  }

  function remove() {
    if (value?.url?.startsWith("blob:")) URL.revokeObjectURL(value.url);
    onChange(null);
    setError("");
  }

  const btnStyle = compact ? { width: "auto", padding: "10px 14px" } : undefined;

  return (
    <div>
      {!recording && !value && (
        <button type="button" className="btn-secondary" style={btnStyle} onClick={start} aria-label={t("msg_record_voice")}>
          {t("vr_record")}
        </button>
      )}
      {recording && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="rec-dot" aria-hidden="true" />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
            {formatDuration(elapsed)} / {formatDuration(VOICE_MAX_SECONDS)}
          </span>
          <span className="meta" style={{ flex: 1 }}>{t("vr_recording")}</span>
          <button type="button" className="btn-primary" style={{ width: "auto", padding: "10px 16px" }} onClick={stop}>
            {t("vr_stop")}
          </button>
        </div>
      )}
      {!recording && value && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}><VoicePlayer src={value.url} durationSec={value.durationSec} /></div>
          <button type="button" className="link-btn" onClick={remove}>{t("vr_delete")}</button>
        </div>
      )}
      {error && <div className="error-box" style={{ marginTop: 8, marginBottom: 0 }}>{error}</div>}
    </div>
  );
}
