// Shows a real photo if one exists, otherwise a colored circle with the
// person's initial(s) — used on Profile and Vet cards so the app feels
// less like a bare form and more like it's showing real people.

const COLORS = ["", "gold", "green"]; // "" = default sky blue

function colorFor(name) {
  if (!name) return "";
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

function initials(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, photoUrl, size = 44 }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (photoUrl) {
    return (
      <div className="avatar" style={style}>
        <img src={photoUrl} alt={name || "Avatar"} />
      </div>
    );
  }
  return (
    <div className={`avatar ${colorFor(name)}`} style={style}>
      {initials(name)}
    </div>
  );
}
