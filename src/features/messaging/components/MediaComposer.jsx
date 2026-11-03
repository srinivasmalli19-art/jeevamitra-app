// v62: the panel that opens above the chat box for photos (up to 5, camera
// or gallery, optional caption) or a voice message (up to 2 minutes).
import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import PhotoPicker from "../../../components/PhotoPicker";
import VoiceRecorder from "../../../components/VoiceRecorder";
import { MAX_CHAT_IMAGES } from "../messaging.media";

export default function MediaComposer({ mode, onCancel, onSend, sending, progress, error }) {
  const { t, tf } = useLanguage();
  const [photos, setPhotos] = useState([]);
  const [caption, setCaption] = useState("");
  const [voice, setVoice] = useState(null);

  const canSend = !sending && (mode === "photo" ? photos.length > 0 : !!voice);

  async function send() {
    if (!canSend) return;
    const ok = await onSend(
      mode === "photo"
        ? { kind: "image", images: photos.map((p) => ({ blob: p.blob })), caption }
        : { kind: "voice", voice: { blob: voice.blob, mimeType: voice.mimeType, durationSec: voice.durationSec } },
    );
    if (ok) {
      photos.forEach((p) => p.url?.startsWith("blob:") && URL.revokeObjectURL(p.url));
      if (voice?.url?.startsWith("blob:")) URL.revokeObjectURL(voice.url);
      onCancel();
    }
  }

  return (
    <div className="media-composer">
      {mode === "photo" ? (
        <>
          <PhotoPicker items={photos} onChange={setPhotos} max={MAX_CHAT_IMAGES} compact />
          {photos.length > 0 && (
            <input
              className="caption-input"
              placeholder={t("msg_add_caption")}
              value={caption}
              maxLength={500}
              onChange={(e) => setCaption(e.target.value)}
            />
          )}
        </>
      ) : (
        <VoiceRecorder value={voice} onChange={setVoice} />
      )}
      {error && <div className="error-box" style={{ marginTop: 8, marginBottom: 0 }}>{t("msg_upload_failed")}</div>}
      <div className="row" style={{ marginTop: 10 }}>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={sending}>{t("cancel")}</button>
        <button type="button" className="btn-primary" onClick={send} disabled={!canSend}>
          {sending ? (progress ? tf("fp_uploading", { n: progress.n, to: progress.total }) : t("msg_sending")) : t("msg_send")}
        </button>
      </div>
    </div>
  );
}
