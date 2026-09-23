import { toMillis } from "../messaging.logic";

function clockTime(ts) {
  const ms = toMillis(ts);
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// A single chat bubble. Outgoing (mine) bubbles are pasture-green and
// right-aligned; incoming bubbles use the paper-card surface. Outgoing
// bubbles also show a sent/read receipt.
export default function MessageBubble({ message, mine }) {
  const time = clockTime(message.createdAt);
  const read = message.status === "read" || !!message.readAt;

  return (
    <div
      style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 8 }}
    >
      <div
        className="card"
        style={{
          cursor: "default", margin: 0, maxWidth: "78%", padding: "9px 12px",
          background: mine ? "var(--pasture)" : "var(--paper-card)",
          color: mine ? "var(--paper)" : "var(--ink)",
        }}
      >
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {message.text}
        </p>
        <div
          style={{
            display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 5, marginTop: 3,
            fontSize: 10, opacity: 0.8, color: mine ? "var(--pasture-pale)" : "var(--ink-soft)",
          }}
        >
          {time && <span>{time}</span>}
          {mine && (
            <span aria-label={read ? "Read" : "Sent"} title={read ? "Read" : "Sent"}>
              {read ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
