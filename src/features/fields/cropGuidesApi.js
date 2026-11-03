// Loads crop cards edited in Central Admin, falling back to the built-in
// defaults (first launch / offline / not yet edited). Read-only in the app.
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase/init";
import { mergeCrops, mergeSettings } from "./cropGuides.logic";

const CACHE_KEY = "jeevamitra_cropGuides_v1";
let memory = null; // { docs, settings } shared by every screen this session
let inflight = null;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeCache(v) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(v)); } catch { /* storage full or blocked */ }
}

export async function fetchCropGuides() {
  if (memory) return memory;
  if (!inflight) {
    inflight = Promise.all([
      getDocs(collection(db, "cropGuides")).then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      getDoc(doc(db, "cropGuideSettings", "default")).then((s) => (s.exists() ? s.data() : null)),
    ])
      .then(([docs, settings]) => {
        memory = { docs, settings };
        writeCache(memory);
        return memory;
      })
      .catch((err) => {
        console.warn("Crop guides: using saved or built-in cards:", err?.message);
        memory = readCache() || { docs: [], settings: null };
        return memory;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

/** { crops, settings } — available immediately (cache/defaults), refreshed from Firestore. */
export function useCropGuides() {
  const initial = memory || readCache() || { docs: [], settings: null };
  const [data, setData] = useState(() => ({ crops: mergeCrops(initial.docs), settings: mergeSettings(initial.settings) }));
  useEffect(() => {
    let alive = true;
    fetchCropGuides().then((m) => {
      if (alive) setData({ crops: mergeCrops(m.docs), settings: mergeSettings(m.settings) });
    });
    return () => { alive = false; };
  }, []);
  return data;
}
