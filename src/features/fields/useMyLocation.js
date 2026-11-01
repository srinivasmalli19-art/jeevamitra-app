// Remembers the phone's location for this session so the browse screens can
// sort by distance without asking again on every screen. Only used while the
// app is open (no background location).
import { useState } from "react";
import { getCurrentPosition } from "../../utils/geo";

let sessionLocation = null;

export function getSessionLocation() {
  return sessionLocation;
}
export function setSessionLocation(loc) {
  sessionLocation = loc;
}

export default function useMyLocation() {
  const [loc, setLoc] = useState(sessionLocation);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  async function locate() {
    setLocating(true);
    setError("");
    try {
      const p = await getCurrentPosition();
      sessionLocation = p;
      setLoc(p);
      return p;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLocating(false);
    }
  }
  return { loc, locating, error, locate };
}
