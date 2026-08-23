import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
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
      nav("/lands");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="topbar"><h1>Welcome back</h1><div className="sub">JeevaMitra</div></div>
      <div className="content">
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field"><label>Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
