import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./i18n/LanguageContext";
import LanguagePicker from "./i18n/LanguagePicker";
import LanguageSwitcherButton from "./i18n/LanguageSwitcherButton";
import Login from "./features/auth/Login";
import Signup from "./features/auth/Signup";
import Profile from "./features/auth/Profile";
import EditProfile from "./features/auth/EditProfile";
import Notifications from "./features/notifications/Notifications";
import LandsList from "./features/lands/LandsList";
import LandDetail from "./features/lands/LandDetail";
import MyLands from "./features/lands/MyLands";
import AddLand from "./features/lands/AddLand";
import Bookings from "./features/lands/Bookings";
import AlertsList from "./features/alerts/AlertsList";
import AlertDetail from "./features/alerts/AlertDetail";
import ReportAlert from "./features/alerts/ReportAlert";
import VetsList from "./features/vets/VetsList";
import VetDetail from "./features/vets/VetDetail";
import AddVet from "./features/vets/AddVet";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-shell"><div className="content"><p className="meta">Loading...</p></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { lang } = useLanguage();

  // First launch: nobody has picked a language yet — ask before anything else.
  if (!lang) return <LanguagePicker />;

  return (
    <div style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}>
      <LanguageSwitcherButton />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/lands" element={<Protected><LandsList /></Protected>} />
        <Route path="/lands/mine" element={<Protected><MyLands /></Protected>} />
        <Route path="/lands/new" element={<Protected><AddLand /></Protected>} />
        <Route path="/lands/:id" element={<Protected><LandDetail /></Protected>} />
        <Route path="/bookings" element={<Protected><Bookings /></Protected>} />
        <Route path="/alerts" element={<Protected><AlertsList /></Protected>} />
        <Route path="/alerts/new" element={<Protected><ReportAlert /></Protected>} />
        <Route path="/alerts/:id" element={<Protected><AlertDetail /></Protected>} />
        <Route path="/vets" element={<Protected><VetsList /></Protected>} />
        <Route path="/vets/new" element={<Protected><AddVet /></Protected>} />
        <Route path="/vets/:id" element={<Protected><VetDetail /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/profile/edit" element={<Protected><EditProfile /></Protected>} />
        <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="*" element={<Navigate to="/lands" replace />} />
      </Routes>
    </div>
  );
}
