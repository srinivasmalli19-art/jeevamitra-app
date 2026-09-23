import { useEffect, useState } from "react";

// Tracks browser connectivity so messaging screens can show an offline
// banner. Firestore keeps serving cached data and queues writes regardless.
export function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}
