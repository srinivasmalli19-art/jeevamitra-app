import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs,
  query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";

const landsCol = collection(db, "lands");

// Create a new land listing. bookedRanges starts empty —
// this array is what booking conflict checks read against.
export async function createLand(ownerId, data) {
  const docRef = await addDoc(landsCol, {
    ownerId,
    title: data.title,
    village: data.village,
    district: data.district,
    acres: Number(data.acres),
    price: Number(data.price),
    unit: data.unit || "month",
    description: data.description || "",
    amenities: data.amenities || [],
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    photoUrl: data.photoUrl || null,
    bookedRanges: [], // [{ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', bookingId }]
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateLand(landId, data) {
  await updateDoc(doc(db, "lands", landId), data);
}

export async function deleteLand(landId) {
  await deleteDoc(doc(db, "lands", landId));
}

export async function getLand(landId) {
  const snap = await getDoc(doc(db, "lands", landId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// All lands (marketplace discovery)
export async function listAllLands() {
  const snap = await getDocs(query(landsCol, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Lands owned by a specific user ("My Lands")
export async function listMyLands(ownerId) {
  const snap = await getDocs(query(landsCol, where("ownerId", "==", ownerId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
