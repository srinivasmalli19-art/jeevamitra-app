import {
  collection, addDoc, deleteDoc, doc, getDocs,
  query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";

const landHoldingsCol = collection(db, "landHoldings");

// A farmer's own land record (survey number, extent, current crop) —
// distinct from `lands`, which is land posted for others to rent.
export async function createLandHolding(ownerId, { surveyNumber, extent, currentCrop }) {
  const docRef = await addDoc(landHoldingsCol, {
    ownerId,
    surveyNumber,
    extent: Number(extent) || 0,
    currentCrop: currentCrop || "",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function listMyLandHoldings(ownerId) {
  const snap = await getDocs(query(landHoldingsCol, where("ownerId", "==", ownerId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteLandHolding(id) {
  await deleteDoc(doc(db, "landHoldings", id));
}
