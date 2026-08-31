import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBooking } from "./bookingsApi";
import { listenToMessages, sendMessage } from "./messagesApi";
import { getUserProfile } from "../auth/profileApi";
import { useAuth } from "../../context/AuthContext";
import AppBar from "../../components/AppBar";

export default function BookingChat() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const [booking, setBooking] = useState(null);
  const [otherName, setOtherName] = useState("Chat");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    let unsub;
    getBooking(id).then(async (b) => {
      if (!b || (b.ownerId !== user.uid && b.requesterId !== user.uid)) {
        setLoading(false);
        return;
      }
      setBooking(b);
      const otherId = b.ownerId === user.uid ? b.requesterId : b.ownerId;
      const otherProfile = await getUserProfile(otherId);
      setOtherName(otherProfile?.name || (b.ownerId === user.uid ? b.requesterName : "Owner"));
      setLoading(false);
      unsub = listenToMessages(id, setMessages);
    });
    return () => unsub?.();
  }, [id, user.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !booking) return;
    const toSend = text;
    setText("");
    await sendMessage({
      bookingId: id, ownerId: booking.ownerId, requesterId: booking.requesterId,
      senderId: user.uid, senderName: profile?.name || "Someone", text: toSend,
    });
  }

  if (loading) return <div className="app-shell"><div className="content"><p className="meta">Loading...</p></div></div>;
  if (!booking) return <div className="app-shell"><div className="content"><p>Chat not found.</p></div></div>;

  return (
    <div className="app-shell">
      <AppBar variant="detail" title={otherName} onBack={() => nav(-1)} />
      <div className="content" style={{ display: "flex", flexDirection: "column", paddingBottom: 90 }}>
        <div className="meta" style={{ marginBottom: 12 }}>{booking.landTitle} · {booking.from} → {booking.to}</div>
        {messages.map((m) => {
          const mine = m.senderId === user.uid;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 8 }}>
              <div
                className="card"
                style={{
                  cursor: "default", margin: 0, maxWidth: "78%",
                  background: mine ? "var(--pasture)" : "var(--paper-card)",
                  color: mine ? "var(--paper)" : "var(--ink)",
                }}
              >
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>{m.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSend}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto",
          background: "var(--paper-card)", borderTop: "1px solid var(--line)",
          padding: 10, display: "flex", gap: 8,
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "12px 13px", borderRadius: 11, border: "1.3px solid var(--line)", fontSize: 13.5, outline: "none" }}
        />
        <button className="btn-primary" style={{ width: "auto", padding: "0 18px" }}>Send</button>
      </form>
    </div>
  );
}
