import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import { listAllLands } from "../lands/landsApi";
import {
  getOrCreatePublicationInteraction, getInteraction, markInteractionRead,
} from "./messagingApi";
import { interactionIdFor, unreadCountFor } from "./messaging.logic";

function Kv({ k, v }) {
  return (
    <div className="kv-row">
      <span className="k">{k}</span>
      <span className="v" style={{ wordBreak: "break-all", textAlign: "right" }}>{v}</span>
    </div>
  );
}

// Development-only QA harness. Rendered only when import.meta.env.DEV is true
// (see the route guard in App.jsx), so it never ships in `vite build`.
// It exercises the full Contact -> interaction -> conversation flow as the
// current authenticated user (User A) against a chosen publication (whose
// owner is User B), without hand-editing Firestore. It never creates fake
// production users. Two-account testing uses two browser sessions (see
// docs/messaging-testing-guide.md).
export default function MessagingQA() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [lands, setLands] = useState([]);
  const [selected, setSelected] = useState(null);
  const [interactionId, setInteractionId] = useState("");
  const [interaction, setInteraction] = useState(null);
  const [firestoreOk, setFirestoreOk] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = (line) => setLog((prev) => [`${new Date().toLocaleTimeString()} — ${line}`, ...prev].slice(0, 12));

  useEffect(() => {
    listAllLands()
      .then((all) => { setLands(all); setFirestoreOk(true); addLog(`Loaded ${all.length} publications.`); })
      .catch((e) => { setFirestoreOk(false); addLog(`Firestore read failed: ${e.message}`); });
  }, []);

  const contactableLands = lands.filter((l) => l.ownerId !== user.uid);

  async function createOrOpen() {
    if (!selected) return;
    try {
      const id = await getOrCreatePublicationInteraction({
        contextId: selected.id,
        requesterId: user.uid,
        recipientId: selected.ownerId,
        publicationTitle: selected.title,
        publicationImageUrl: selected.photoUrl || null,
      });
      setInteractionId(id);
      const it = await getInteraction(id);
      setInteraction(it);
      addLog(`getOrCreate -> ${id}`);
    } catch (e) {
      addLog(`getOrCreate failed: ${e.message}`);
    }
  }

  async function resetMyUnread() {
    if (!interactionId) return;
    await markInteractionRead({ interactionId, uid: user.uid, unreadIncomingIds: [] }).catch((e) => addLog(e.message));
    const it = await getInteraction(interactionId);
    setInteraction(it);
    addLog("Reset my unread count.");
  }

  const predictedId = selected
    ? interactionIdFor({ contextId: selected.id, requesterId: user.uid, recipientId: selected.ownerId })
    : "";

  return (
    <div className="app-shell">
      <AppBar variant="detail" title="Messaging QA (dev)" onBack={() => nav(-1)} />
      <div className="content">
        <div className="card" style={{ cursor: "default" }}>
          <div className="card-title" style={{ fontSize: 13.5, marginBottom: 8 }}>Environment</div>
          <Kv k="Authenticated" v={user ? "yes" : "no"} />
          <Kv k="Current user id" v={user?.uid || "—"} />
          <Kv k="Current user name" v={profile?.name || "—"} />
          <Kv k="Firestore connectivity" v={firestoreOk == null ? "checking…" : firestoreOk ? "ok" : "failed"} />
          <Kv k="Push (FCM) token" v="n/a — project has no FCM (see docs)" />
          <Kv k="Browser online" v={typeof navigator !== "undefined" && navigator.onLine ? "yes" : "no"} />
        </div>

        <div className="card" style={{ cursor: "default" }}>
          <div className="card-title" style={{ fontSize: 13.5, marginBottom: 8 }}>1. Pick a publication (owned by someone else = User B)</div>
          {contactableLands.length === 0 && <p className="meta">No publications owned by other users are available. Post one from a second account first.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflow: "auto" }}>
            {contactableLands.map((l) => (
              <button
                key={l.id}
                className={selected?.id === l.id ? "chip active" : "chip"}
                style={{ textAlign: "left" }}
                onClick={() => { setSelected(l); setInteraction(null); setInteractionId(""); }}
              >
                {l.title} — {l.village}, {l.district} · owner {l.ownerId.slice(0, 6)}…
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-title" style={{ fontSize: 13.5, marginBottom: 8 }}>2. Interaction</div>
            <Kv k="Publication id" v={selected.id} />
            <Kv k="Publisher (User B) id" v={selected.ownerId} />
            <Kv k="Deterministic id" v={predictedId} />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn-primary" onClick={createOrOpen}>Create / open interaction</button>
            </div>
          </div>
        )}

        {interaction && (
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-title" style={{ fontSize: 13.5, marginBottom: 8 }}>3. Interaction state</div>
            <Kv k="Interaction id" v={interaction.id} />
            <Kv k="Status" v={interaction.status} />
            <Kv k="Last message" v={interaction.lastMessage || "—"} />
            <Kv k="My unread" v={unreadCountFor(interaction, user.uid)} />
            <Kv k="Requester unread" v={interaction.requesterUnreadCount} />
            <Kv k="Recipient unread" v={interaction.recipientUnreadCount} />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn-primary" onClick={() => nav(`/messages/${interaction.id}`)}>Open conversation</button>
            </div>
            <div className="row">
              <button className="btn-secondary" onClick={resetMyUnread}>Reset my unread</button>
            </div>
          </div>
        )}

        <div className="card" style={{ cursor: "default" }}>
          <div className="card-title" style={{ fontSize: 13.5, marginBottom: 8 }}>Log</div>
          {log.length === 0 && <p className="meta">No actions yet.</p>}
          {log.map((line, i) => (
            <div key={i} className="meta" style={{ fontFamily: "monospace", fontSize: 11, marginBottom: 2 }}>{line}</div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
