import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listStories } from "./storiesApi";
import { useAuth } from "../../context/AuthContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

export default function StoriesList() {
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listStories().then((data) => { setStories(data); setLoading(false); });
  }, []);

  return (
    <div className="app-shell">
      <AppBar variant="detail" title="Success stories" onBack={() => nav(-1)} />
      <div className="content">
        {isAdmin && (
          <Link to="/stories/new" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ marginBottom: 14 }}>+ Add story (admin)</button>
          </Link>
        )}
        {loading && <p className="meta">Loading...</p>}
        {!loading && stories.length === 0 && (
          <div className="empty-state"><div className="glyph">📖</div><h3>No stories yet</h3><p>Check back soon for farmer success stories.</p></div>
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
