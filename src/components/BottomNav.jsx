import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useTotalUnread } from "../features/messaging/useMessaging";

function Icon({ name, active }) {
  const c = active ? "var(--pasture)" : "var(--ink-soft)";
  const common = { fill: "none", stroke: c, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
    case "lands":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><path d="M12 2c3 3 3 7 0 10-3-3-3-7 0-10z" /><path d="M12 12v10" /><path d="M12 17c-3 0-6-2-7-5 3-1 6 0 7 2" /><path d="M12 15c3 0 6-2 7-5-3-1-6 0-7 2" /></svg>;
    case "bookings":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>;
    case "messages":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>;
    case "vets":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="9" /></svg>;
    case "profile":
      return <svg width="21" height="21" viewBox="0 0 24 24" {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" /></svg>;
    default:
      return null;
  }
}

// Which nav item should be highlighted for a given URL. Alerts has no tab of
// its own, so alert routes fall back to highlighting Home (matches the
// prototype's renderBottomNav() fallback chain) — /map matches no tab at all.
function isTabActive(tabTo, pathname) {
  if (tabTo === "/") {
    return pathname === "/" || pathname.startsWith("/alerts");
  }
  if (tabTo === "/lands") {
    return pathname === "/lands" || pathname.startsWith("/lands/");
  }
  if (tabTo === "/bookings") {
    return pathname.startsWith("/bookings");
  }
  if (tabTo === "/messages") {
    return pathname.startsWith("/messages");
  }
  if (tabTo === "/vets") {
    return pathname === "/vets" || pathname.startsWith("/vets/");
  }
  if (tabTo === "/profile") {
    return pathname === "/profile" || pathname === "/profile/edit";
  }
  return pathname === tabTo;
}

export default function BottomNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const unread = useTotalUnread(user?.uid);
  const items = [
    ["/", "home", t("nav_home")],
    ["/lands", "lands", t("nav_lands")],
    ["/messages", "messages", t("nav_messages")],
    ["/bookings", "bookings", t("nav_bookings")],
    ["/vets", "vets", t("nav_vets")],
    ["/profile", "profile", t("nav_profile")],
  ];
  return (
    <nav className="nav">
      {items.map(([to, iconName, label]) => {
        const active = isTabActive(to, location.pathname);
        const showBadge = to === "/messages" && unread > 0;
        return (
          <NavLink
            key={to}
            to={to}
            className={active ? "active" : ""}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}
          >
            <span style={{ position: "relative", display: "inline-flex" }}>
              <Icon name={iconName} active={active} />
              {showBadge && (
                <span
                  aria-label={`${unread} unread messages`}
                  style={{
                    position: "absolute", top: -5, right: -8, minWidth: 15, height: 15, padding: "0 3px",
                    borderRadius: 8, background: "var(--marigold)", color: "#241800", fontSize: 9.5,
                    fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1.5px solid var(--paper-card)",
                  }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </span>
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
