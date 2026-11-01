// v62: pick up to `max` photos from the camera (one at a time, repeatable)
// or the gallery (several at once). Photos are compressed on the phone.
// Items: { key, url, blob? (new, not yet uploaded), path? (already uploaded) }
import { useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { compressImageToBlob } from "../utils/media";

let seq = 0;

export default function PhotoPicker({ items, onChange, max = 5, compact = false }) {
  const { t, tf } = useLanguage();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addFiles(fileList) {
    setError("");
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const room = max - items.length;
    if (room <= 0) { setError(t("fp_err_photos_max")); return; }
    if (files.length > room) setError(t("fp_err_photos_max"));
    setBusy(true);
    const added = [];
    for (const file of files.slice(0, room)) {
      try {
        const { blob } = await compressImageToBlob(file);
        added.push({ key: `p${Date.now()}-${seq++}`, blob, url: URL.createObjectURL(blob) });
      } catch (err) {
        setError(err.message);
      }
    }
    setBusy(false);
    onChange([...items, ...added]);
  }

  function remove(key) {
    const it = items.find((x) => x.key === key);
    if (it?.blob && it.url?.startsWith("blob:")) URL.revokeObjectURL(it.url);
    onChange(items.filter((x) => x.key !== key));
  }

  const full = items.length >= max;

  return (
    <div>
      {items.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 8 }}>
          {items.map((it) => (
            <div key={it.key} style={{ position: "relative", flex: "0 0 auto" }}>
              <img src={it.url} alt="" style={{ width: compact ? 64 : 84, height: compact ? 64 : 84, objectFit: "cover", borderRadius: 10, border: "1px solid var(--line)" }} />
              <button
                type="button"
                onClick={() => remove(it.key)}
                aria-label={t("delete")}
                style={{ position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: "50%", border: "none", background: "var(--alert)", color: "#fff", fontSize: 13, cursor: "pointer", lineHeight: "24px", padding: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="row">
        <button type="button" className="btn-secondary" disabled={full || busy} onClick={() => cameraRef.current?.click()}>
          {t("fp_add_photo_camera")}
        </button>
        <button type="button" className="btn-secondary" disabled={full || busy} onClick={() => galleryRef.current?.click()}>
          {t("fp_add_photo_gallery")}
        </button>
      </div>
      <p className="meta" style={{ marginTop: 6 }}>{busy ? t("loading") : tf("fp_photos_count", { n: items.length })}</p>
      {error && <div className="error-box" style={{ marginTop: 6 }}>{error}</div>}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
    </div>
  );
}
