import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

function Icon({ name, active }) {
  const c = active ? "var(--pasture)" : "var(--ink-soft)";
  const common = { fill: "none", stroke: c, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "lands":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><path d="M12 2c3 3 3 7 0 10-3-3-3-7 0-10z" /><path d="M12 12v10" /><path d="M12 17c-3 0-6-2-7-5 3-1 6 0 7 2" /><path d="M12 15c3 0 6-2 7-5-3-1-6 0-7 2" /></svg>;
    case "myLands":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><path d="M4 4h11l5 5v11H4z" /><path d="M14 4v6h6" /><path d="M8 13h8M8 17h5" /></svg>;
    case "bookings":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>;
    case "vets":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="9" /></svg>;
    case "alerts":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>;
    case "profile":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" /></svg>;
    default:
      return null;
  }
}

// Which nav item should be highlighted for a given URL, including detail
// and sub-pages (e.g. /lands/abc123 or /profile/edit) that don't exactly
// match a tab's own path.
function isTabActive(tabTo, pathname) {
  if (tabTo === "/lands") {
    if (pathname === "/lands/mine" || pathname === "/lands/new") return false;
    return pathname === "/lands" || pathname.startsWith("/lands/");
  }
  if (tabTo === "/lands/mine") {
    return pathname === "/lands/mine" || pathname === "/lands/new";
  }
  if (tabTo === "/bookings") {
    return pathname.startsWith("/bookings");
  }
  if (tabTo === "/vets") {
    return pathname === "/vets" || (pathname.startsWith("/vets/"));
  }
  if (tabTo === "/alerts") {
    return pathname === "/alerts" || pathname.startsWith("/alerts/");
  }
  if (tabTo === "/profile") {
    return pathname === "/profile" || pathname === "/profile/edit" || pathname === "/notifications";
  }
  return pathname === tabTo;
}

export default function BottomNav() {
  const { t } = useLanguage();
  const location = useLocation();
  const items = [
    ["/lands", "lands", t("nav_lands")],
    ["/lands/mine", "myLands", t("nav_myLands")],
    ["/bookings", "bookings", t("nav_bookings")],
    ["/vets", "vets", t("nav_vets")],
    ["/alerts", "alerts", t("nav_alerts")],
    ["/profile", "profile", t("nav_profile")],
  ];
  return (
    <nav className="nav">
      {items.map(([to, iconName, label]) => {
        const active = isTabActive(to, location.pathname);
        return (
          <NavLink
            key={to}
            to={to}
            className={active ? "active" : ""}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
          >
            <Icon name={iconName} active={active} />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
