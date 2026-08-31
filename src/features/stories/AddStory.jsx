import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { createStory } from "./storiesApi";
import { useAuth } from "../../context/AuthContext";
import { compressImageToDataUrl } from "../../utils/image";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

export default function AddStory() {
  const { user, isAdmin, loading } = useAuth();
  const showToast = useToast();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && !isAdmin) return <Navigate to="/stories" replace />;

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setPhotoError("");
    try {
      let photoUrl = null;
      if (photoFile) {
        try {
          photoUrl = await compressImageToDataUrl(photoFile);
        } catch (err) {
          setPhotoError(err.message + " You can still save without a photo.");
          setBusy(false);
          return;
        }
      }
      const id = await createStory(user.uid, { title, body, authorName, photoUrl });
      showToast("Story published");
      nav(`/stories/${id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <AppBar variant="detail" title="Add story" onBack={() => nav(-1)} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Title</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field"><label>Farmer's name</label>
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Optional" />
          </div>
          <div className="field"><label>Story</label>
            <textarea required value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="field">
            <label>Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {photoPreview && (
              <img src={photoPreview} alt="Preview" style={{ width: "100%", borderRadius: 12, marginTop: 8, maxHeight: 200, objectFit: "cover" }} />
            )}
            {photoError && <div className="error-box" style={{ marginTop: 8 }}>{photoError}</div>}
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? "Publishing..." : "Publish"}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
