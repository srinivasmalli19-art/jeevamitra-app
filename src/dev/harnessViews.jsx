// DEVELOPMENT ONLY: sample screens for visual checks (see harness.jsx).
import AppBar from "../components/AppBar";

export const views = {
  appbar: () => (
    <>
      <AppBar variant="top" title="Good morning, Rama" subtitle="JeevaMitra" onMap={() => {}} onBell={() => {}} unread />
      <div style={{ height: 16 }} />
      <AppBar variant="detail" title="Post land" onBack={() => {}} />
    </>
  ),
};
