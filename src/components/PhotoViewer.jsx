// v62: full-screen photo viewer with previous / next and close.
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

export default function PhotoViewer({ images, startIndex = 0, onClose }) {
  const { t, tf } = useLanguage();
  const [i, setI] = useState(startIndex);
  const n = images.length;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => Math.min(n - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, onClose]);

  return (
    <div className="photo-viewer" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pv-bar">
        <span>{n > 1 ? tf("msg_photo_n_of", { n: i + 1, to: n }) : ""}</span>
        <button type="button" onClick={onClose} aria-label={t("msg_photo_viewer_close")}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 26, cursor: "pointer" }}>✕</button>
      </div>
      <img src={images[i].url} alt="" />
      {i > 0 && <button type="button" className="pv-nav" style={{ left: 10 }} onClick={() => setI(i - 1)} aria-label="Previous">‹</button>}
      {i < n - 1 && <button type="button" className="pv-nav" style={{ right: 10 }} onClick={() => setI(i + 1)} aria-label="Next">›</button>}
    </div>
  );
}
