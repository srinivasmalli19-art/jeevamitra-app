export default function BottomSheet({ open, onClose, title, children }) {
  return (
    <div
      className={`sheet-overlay ${open ? "show" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sheet">
        <button className="close-x" onClick={onClose} aria-label="Close">✕</button>
        <div className="sheet-handle" />
        {title && <h3>{title}</h3>}
        <div style={{ marginTop: 10 }}>{children}</div>
      </div>
    </div>
  );
}
