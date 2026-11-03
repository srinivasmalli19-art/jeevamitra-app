// v62: when a herd owner with an active herd post opens the app, update the
// herd's location once (only if it moved at least 1 km). Location is read only
// while the app is open; there is no background tracking.
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCurrentPosition } from "../../utils/geo";
import { listMyPosts, updateHerdLocation } from "./fieldsApi";
import { KIND, STATUS } from "./fields.logic";
import { setSessionLocation } from "./useMyLocation";

let doneForUid = null; // once per app open

export default function HerdLocationSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user || doneForUid === user.uid) return;
    doneForUid = user.uid;
    (async () => {
      try {
        const herds = (await listMyPosts(user.uid)).filter(
          (p) => p.kind === KIND.HERD && !p.hidden && p.status !== STATUS.FULL && p.status !== STATUS.CLOSED,
        );
        if (!herds.length) return;
        const pos = await getCurrentPosition();
        setSessionLocation(pos);
        await Promise.all(herds.map((h) => updateHerdLocation(h, pos)));
      } catch (err) {
        // Permission denied or no GPS: the "My herd is here now" button still works.
        console.warn("Herd location sync skipped:", err?.message);
      }
    })();
  }, [user]);
  return null;
}
