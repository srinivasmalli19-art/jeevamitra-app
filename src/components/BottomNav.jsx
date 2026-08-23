import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

export default function BottomNav() {
  const { t } = useLanguage();
  const items = [
    ["/lands", t("nav_lands")],
    ["/lands/mine", t("nav_myLands")],
    ["/bookings", t("nav_bookings")],
    ["/vets", t("nav_vets")],
    ["/alerts", t("nav_alerts")],
    ["/profile", t("nav_profile")],
  ];
  return (
    <nav className="nav">
      {items.map(([to, label]) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")} end>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
