function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z" /><path d="M9 7v13M15 4v13" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 004 0" />
    </svg>
  );
}

// Top-level screens (Home, Lands, Bookings, Vets, Profile, Map) get a title +
// subtitle with map/bell icon buttons. Detail/form screens get a back button
// + a fixed generic title instead — the entity's own name lives in the page
// content (a hero banner or heading), not the app bar.
export default function AppBar({ variant = "top", title, subtitle, onMap, onBell, unread, onBack }) {
  if (variant === "detail") {
    return (
      <div className="topbar">
        <div className="back-row">
          <button className="back-btn" onClick={onBack} aria-label="Back"><BackIcon /></button>
          <h1 style={{ fontSize: 18 }}>{title}</h1>
        </div>
      </div>
    );
  }
  return (
    <div className="topbar">
      <div className="appbar-row">
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="sub">{subtitle}</div>}
        </div>
        {(onMap || onBell) && (
          <div className="appbar-icons">
            {onMap && (
              <button className="icon-btn" onClick={onMap} aria-label="Map"><MapIcon /></button>
            )}
            {onBell && (
              <button className="icon-btn" onClick={onBell} aria-label="Notifications">
                <BellIcon />
                {unread ? <span className="badge-dot" /> : null}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
