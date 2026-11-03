// /night-stay — two tabs: farmers who need a herd, and herds available.
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import AppBar from "../../components/AppBar";
import BottomNav from "../../components/BottomNav";
import PostList from "./PostList";
import { useCropGuides } from "./cropGuidesApi";
import { KIND } from "./fields.logic";

export default function NightStayScreen() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") === "herds" ? "herds" : "need");
  const { crops, settings } = useCropGuides();

  function switchTab(next) {
    setTab(next);
    setParams({ tab: next }, { replace: true });
  }

  return (
    <div className="app-shell">
      <AppBar variant="top" title={t("fp_nightstay_title")} subtitle={t("fp_nightstay_subtitle")} />
      <div className="content">
        <div className="tabbar" role="tablist">
          <button role="tab" aria-selected={tab === "need"} className={`tabbtn ${tab === "need" ? "active" : ""}`} onClick={() => switchTab("need")}>🌙 {t("fp_tab_need")}</button>
          <button role="tab" aria-selected={tab === "herds"} className={`tabbtn ${tab === "herds" ? "active" : ""}`} onClick={() => switchTab("herds")}>🐑 {t("fp_tab_herds")}</button>
        </div>
        <div className="row" style={{ marginBottom: 8 }}>
          <button className="btn-primary" onClick={() => nav("/night-stay/new?type=need")}>＋ {t("fp_post_need")}</button>
          <button className="btn-primary" onClick={() => nav("/night-stay/new?type=herd")}>＋ {t("fp_post_herd")}</button>
        </div>
        <button className="link-btn" style={{ marginBottom: 12 }} onClick={() => nav("/field-posts/mine")}>{t("fp_my_posts")} ›</button>
        {tab === "need" ? (
          <PostList key="need" kind={KIND.NIGHT_STAY_NEED} crops={crops} settings={settings}
            emptyGlyph="🌙" emptyTitle={t("fp_empty_need")} emptyBody={t("fp_empty_need_body")} />
        ) : (
          <PostList key="herds" kind={KIND.HERD} crops={crops} settings={settings}
            emptyGlyph="🐑" emptyTitle={t("fp_empty_herds")} emptyBody={t("fp_empty_herds_body")} />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
