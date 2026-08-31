import {
  collection, addDoc, deleteDoc, doc, getDoc, getDocs, updateDoc,
  query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";

const livestockCol = collection(db, "livestock");

export async function createLivestock(ownerId, { type, customType, count }) {
  const docRef = await addDoc(livestockCol, {
    ownerId,
    type, // 'Cattle' | 'Buffalo' | 'Goat' | 'Sheep' | 'Other'
    customType: type === "Other" ? (customType || "") : "",
    count: Number(count) || 1,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function listMyLivestock(ownerId) {
  const snap = await getDocs(query(livestockCol, where("ownerId", "==", ownerId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getLivestock(id) {
  const snap = await getDoc(doc(db, "livestock", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateLivestock(id, { type, customType, count }) {
  await updateDoc(doc(db, "livestock", id), {
    type,
    customType: type === "Other" ? (customType || "") : "",
    count: Number(count) || 1,
  });
}

export async function deleteLivestock(id) {
  await deleteDoc(doc(db, "livestock", id));
}
