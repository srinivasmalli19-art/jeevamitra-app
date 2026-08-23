import {
  collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";

const vetsCol = collection(db, "vets");

// Only an admin account can add/edit vets — see isCurrentUserAdmin().
// This keeps the directory curated and trustworthy instead of self-registered.
export async function createVetProfile(adminUid, data) {
  const docRef = await addDoc(vetsCol, {
    addedBy: adminUid,
    name: data.name,
    sector: data.sector,           // 'Government' | 'Private'
    designation: data.designation, // 'Veterinary Officer' | 'Veterinary Assistant'
    services: data.services,       // array, e.g. ['First Aid', 'Artificial Insemination']
    experienceYears: Number(data.experienceYears) || 0,
    languages: data.languages,
    village: data.village,
    district: data.district,
    phone: data.phone,
    rating: data.rating ? Number(data.rating) : null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    photoUrl: data.photoUrl || null,
    availability: data.availability || "Available today",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateVetProfile(vetId, data) {
  await updateDoc(doc(db, "vets", vetId), data);
}

export async function deleteVetProfile(vetId) {
  await deleteDoc(doc(db, "vets", vetId));
}

export async function listVets() {
  const snap = await getDocs(query(vetsCol, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getVet(vetId) {
  const snap = await getDoc(doc(db, "vets", vetId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Checks the admins/{uid} collection to see if the current user can manage vets.
export async function isCurrentUserAdmin(uid) {
  if (!uid) return false;
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists();
}
