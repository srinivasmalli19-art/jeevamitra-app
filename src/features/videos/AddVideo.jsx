import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { createVideo } from "./videosApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

export default function AddVideo() {
  const { user, isAdmin, loading } = useAuth();
  const showToast = useToast();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && !isAdmin) return <Navigate to="/videos" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await createVideo(user.uid, { title, youtubeUrl });
      showToast("Video added");
      nav("/videos");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title="Add video" onBack={() => nav(-1)} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Title</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field"><label>YouTube link</label>
            <input required type="url" placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Add video"}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
