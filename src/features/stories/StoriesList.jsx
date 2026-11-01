import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listStories } from "./storiesApi";
import { useAuth } from "../../context/AuthContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../i18n/LanguageContext";

export default function StoriesList() {
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const { t } = useLanguage();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listStories().then((data) => { setStories(data); setLoading(false); });
  }, []);

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_success_stories")} onBack={() => nav(-1)} />
      <div className="content">
        {isAdmin && (
          <Link to="/stories/new" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ marginBottom: 14 }}>{t("ex_add_story_admin")}</button>
          </Link>
        )}
        {loading && <p className="meta">{t("loading")}</p>}
        {!loading && stories.length === 0 && (
          <div className="empty-state"><div className="glyph">📖</div><h3>{t("ex_no_stories_title")}</h3><p>{t("ex_no_stories_body")}</p></div>
        )}
        {stories.map((s) => (
          <Link key={s.id} to={`/stories/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card stub">
              {s.photoUrl && (
                <img src={s.photoUrl} alt={s.title} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10, marginBottom: 10 }} />
              )}
              <div className="card-title">{s.title}</div>
              {s.authorName && <div className="meta">{s.authorName}</div>}
            </div>
          </Link>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
