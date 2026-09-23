import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../i18n/LanguageContext";

// Shows which publication a conversation is about, with a jump-to-listing
// action. Uses the interaction's denormalized title/image so it renders even
// if the underlying land was later edited or removed.
export default function PublicationContextCard({ interaction }) {
  const nav = useNavigate();
  const { t } = useLanguage();
  if (!interaction) return null;

  return (
    <div
      className="card"
      style={{ cursor: "default", display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          backgroundColor: "var(--pasture-pale)",
          backgroundImage: interaction.publicationImageUrl ? `url(${interaction.publicationImageUrl})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        }}
      >
        {!interaction.publicationImageUrl && "🌾"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="meta" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".05em" }}>
          {t("msg_about_publication")}
        </div>
        <div className="card-title" style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {interaction.publicationTitle || t("msg_publication")}
        </div>
      </div>
      {interaction.contextId && (
        <button
          className="link-btn"
          style={{ flexShrink: 0 }}
          onClick={() => nav(`/lands/${interaction.contextId}`)}
        >
          {t("msg_view_publication")}
        </button>
      )}
    </div>
  );
}
