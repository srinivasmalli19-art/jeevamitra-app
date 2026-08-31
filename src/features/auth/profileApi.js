import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/init";

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
