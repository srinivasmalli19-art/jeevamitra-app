import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createLivestock, getLivestock, updateLivestock } from "./livestockApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";

export default function AddLivestock() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const nav = useNavigate();
  const showToast = useToast();
  const [type, setType] = useState("Cattle");
  const [customType, setCustomType] = useState("");
  const [count, setCount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    getLivestock(id).then((a) => {
      if (a) {
        setType(a.type);
        setCustomType(a.customType || "");
        setCount(String(a.count));
      }
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isEdit) {
        await updateLivestock(id, { type, customType, count });
        showToast("Updated");
      } else {
        await createLivestock(user.uid, { type, customType, count });
        showToast("Added to your livestock");
      }
      nav("/livestock");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="app-shell"><div className="content"><p className="meta">Loading...</p></div></div>;

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={isEdit ? "Edit animal" : "Add animal"} onBack={() => nav(-1)} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>Cattle</option><option>Buffalo</option><option>Goat</option><option>Sheep</option><option>Other</option>
            </select>
          </div>
          {type === "Other" && (
            <div className="field"><label>Specify type</label>
              <input required value={customType} onChange={(e) => setCustomType(e.target.value)} />
            </div>
          )}
          <div className="field"><label>Count</label>
            <input required type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
