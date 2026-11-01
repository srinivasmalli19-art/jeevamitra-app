import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStory, deleteStory } from "./storiesApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { useLanguage } from "../../i18n/LanguageContext";

export default function StoryDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const showToast = useToast();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStory(id).then((s) => { setStory(s); setLoading(false); });
  }, [id]);

  if (loading) return <div className="app-shell"><div className="content"><p className="meta">{t("loading")}</p></div></div>;
  if (!story || story.hidden === true) return <div className="app-shell"><div className="content"><p>{t("ex_story_not_found")}</p></div></div>;

  async function handleDelete() {
    if (!confirm(t("ex_delete_story_confirm"))) return;
    await deleteStory(story.id);
    showToast(t("ex_story_deleted"));
    nav("/stories");
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("ex_story")} onBack={() => nav(-1)} />
      <div className="content">
        {story.photoUrl && (
          <img src={story.photoUrl} alt={story.title} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 14, marginBottom: 14 }} />
        )}
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, margin: "0 0 4px" }}>{story.title}</h1>
        {story.authorName && <div className="meta" style={{ marginBottom: 14 }}>{story.authorName}</div>}
        <p style={{ fontSize: 13.5, lineHeight: 1.65 }}>{story.body}</p>
        {isAdmin && <button className="btn-danger" style={{ marginTop: 12 }} onClick={handleDelete}>{t("ex_delete_story_admin")}</button>}
      </div>
      <BottomNav />
    </div>
  );
}
