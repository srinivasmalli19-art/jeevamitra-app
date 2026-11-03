import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppBar from "../../components/AppBar";
import { useLanguage } from "../../i18n/LanguageContext";

export default function Login() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      nav("/");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <AppBar variant="top" title={t("login_title")} subtitle="JeevaMitra" />
      <div className="content">
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><label>{t("email")}</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field"><label>{t("password")}</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={loading}>{loading ? t("ex_logging_in") : t("login_button")}</button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
          {t("no_account")} <Link to="/signup">{t("signup_button")}</Link>
        </p>
      </div>
    </div>
  );
}
