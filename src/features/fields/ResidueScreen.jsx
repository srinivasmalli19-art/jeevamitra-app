// /residue — browse harvested fields with crop residue.
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import PostList from "./PostList";
import { useCropGuides } from "./cropGuidesApi";
import { KIND } from "./fields.logic";

export default function ResidueScreen() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const { crops, settings } = useCropGuides();
  return (
    <div className="app-shell">
      <AppBar variant="top" title={t("fp_residue_title")} subtitle={t("fp_residue_subtitle")} />
      <div className="content">
        <div className="row" style={{ marginBottom: 12 }}>
          <button className="btn-primary" onClick={() => nav("/residue/new")}>＋ {t("fp_post_residue")}</button>
        </div>
        <button className="link-btn" style={{ marginBottom: 12 }} onClick={() => nav("/field-posts/mine")}>{t("fp_my_posts")} ›</button>
        <PostList kind={KIND.RESIDUE} crops={crops} settings={settings}
          emptyGlyph="🌾" emptyTitle={t("fp_empty_residue")} emptyBody={t("fp_empty_residue_body")} />
      </div>
      <BottomNav />
    </div>
  );
}
