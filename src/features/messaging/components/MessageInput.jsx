import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { validateMessageText, MAX_MESSAGE_LENGTH } from "../messaging.logic";

// Fixed-bottom composer. Multiline, trims whitespace, disables send for
// empty/whitespace-only input, prevents duplicate sends while in flight, and
// surfaces a retry for the last failed message.
export default function MessageInput({ onSend, sending, error, onClearError }) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [failedText, setFailedText] = useState("");

  const canSend = validateMessageText(text).ok && !sending;

  async function submit(e) {
    e?.preventDefault();
    const validation = validateMessageText(text);
    if (!validation.ok || sending) return;
    const ok = await onSend(validation.value);
    if (ok) {
      setText("");
      setFailedText("");
    } else {
      setFailedText(validation.value);
    }
  }

  async function retry() {
    if (!failedText || sending) return;
    onClearError?.();
    const ok = await onSend(failedText);
    if (ok) setFailedText("");
  }

  function onKeyDown(e) {
    // Enter sends; Shift+Enter inserts a newline (multiline support).
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto",
        background: "var(--paper-card)", borderTop: "1px solid var(--line)", padding: 10,
      }}
    >
      {error && failedText && (
        <div
          className="error-box"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}
        >
          <span style={{ fontSize: 12 }}>{t("msg_send_failed")}</span>
          <button type="button" className="link-btn" onClick={retry} disabled={sending}>
            {t("msg_retry")}
          </button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("msg_type_message")}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-label={t("msg_type_message")}
          style={{
            flex: 1, padding: "12px 13px", borderRadius: 11, border: "1.3px solid var(--line)",
            fontSize: 13.5, outline: "none", resize: "none", maxHeight: 120,
            fontFamily: "inherit", background: "var(--paper-card)", color: "var(--ink)",
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!canSend}
          aria-label={t("msg_send")}
          style={{ width: "auto", padding: "0 18px", opacity: canSend ? 1 : 0.5 }}
        >
          {sending ? "…" : t("msg_send")}
        </button>
      </div>
    </form>
  );
}
