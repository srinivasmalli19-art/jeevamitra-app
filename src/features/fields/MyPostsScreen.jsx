// /field-posts/mine — everything this user posted (all three kinds),
// including full / closed / hidden ones, newest first.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import PostCard from "./components/PostCard";
import { useCropGuides } from "./cropGuidesApi";
import { listMyPosts } from "./fieldsApi";
import { sortNewestFirst } from "./fields.logic";

export default function MyPostsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const { crops, settings } = useCropGuides();
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    listMyPosts(user.uid).then((p) => setPosts(sortNewestFirst(p))).catch(() => setPosts([]));
  }, [user.uid]);

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={t("fp_my_posts_title")} onBack={() => nav(-1)} />
      <div className="content">
        {posts === null && <p className="meta">{t("loading")}</p>}
        {posts && posts.length === 0 && (
          <div className="empty-state">
            <div className="glyph">🌾</div>
            <p>{t("fp_empty_mine")}</p>
            <div className="row">
              <button className="btn-secondary" onClick={() => nav("/residue/new")}>{t("home_qa_cropResidue")}</button>
              <button className="btn-secondary" onClick={() => nav("/night-stay")}>{t("home_qa_nightStay")}</button>
            </div>
          </div>
        )}
        {(posts || []).map((p) => <PostCard key={p.id} post={{ ...p, _dist: null }} crops={crops} settings={settings} />)}
      </div>
      <BottomNav />
    </div>
  );
}
