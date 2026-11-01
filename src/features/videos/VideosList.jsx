import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listVideos, deleteVideo } from "./videosApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../i18n/LanguageContext";

export default function VideosList() {
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const { t } = useLanguage();
  const showToast = useToast();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const data = await listVideos();
    setVideos(data);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function handleDelete(id) {
    if (!confirm(t("ex_remove_video_confirm"))) return;
    await deleteVideo(id);
    showToast(t("ex_video_removed"));
    refresh();
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_videos")} onBack={() => nav(-1)} />
      <div className="content">
        {isAdmin && (
          <Link to="/videos/new" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ marginBottom: 14 }}>{t("ex_add_video_admin")}</button>
          </Link>
        )}
        {loading && <p className="meta">{t("loading")}</p>}
        {!loading && videos.length === 0 && (
          <div className="empty-state"><div className="glyph">🎬</div><h3>{t("ex_no_videos_title")}</h3><p>{t("ex_check_back")}</p></div>
        )}
        {videos.map((v) => (
          <div key={v.id} className="card" style={{ cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="card-title">▶️ {v.title}</div>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <a href={v.youtubeUrl} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: "none" }}>
                <button className="btn-primary" style={{ width: "100%" }}>{t("ex_watch_youtube")}</button>
              </a>
              {isAdmin && (
                <button className="btn-danger" style={{ flex: "0 0 auto", width: "auto", padding: "0 14px" }} onClick={() => handleDelete(v.id)}>{t("delete")}</button>
              )}
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
