// v62: a simple play / pause bar with progress and length, e.g. "▶ 1:24".
import { useEffect, useRef, useState } from "react";
import { formatDuration } from "../utils/voice.logic";

export default function VoicePlayer({ src, durationSec, light = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return undefined;
    const onTime = () => setPos(a.currentTime || 0);
    const onEnd = () => { setPlaying(false); setPos(0); };
    const onErr = () => { setFailed(true); setPlaying(false); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onErr);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onErr);
    };
  }, [src]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); return; }
    a.play().then(() => setPlaying(true)).catch(() => setFailed(true));
  }

  const total = Number(durationSec) || 0;
  const pct = total ? Math.min(100, (pos / total) * 100) : 0;
  const fg = light ? "var(--paper)" : "var(--pasture)";
  const track = light ? "rgba(246,241,228,0.35)" : "var(--line)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 170 }}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        disabled={failed}
        aria-label={playing ? "Pause" : "Play"}
        style={{
          width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", flex: "0 0 auto",
          background: light ? "var(--paper)" : "var(--pasture)", color: light ? "var(--pasture)" : "var(--paper)",
          fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {failed ? "!" : playing ? "❚❚" : "▶"}
      </button>
      <div style={{ flex: 1, height: 4, borderRadius: 4, background: track, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, borderRadius: 4, background: fg }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: fg, flex: "0 0 auto" }}>
        {formatDuration(playing || pos ? pos : total)}
      </span>
    </div>
  );
}
