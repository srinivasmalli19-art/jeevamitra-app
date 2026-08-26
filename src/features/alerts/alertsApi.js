import {
  collection, addDoc, doc, getDoc, getDocs, updateDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";

const alertsCol = collection(db, "alerts");

export async function createAlert(reporterId, reporterName, data) {
  const docRef = await addDoc(alertsCol, {
    reporterId,
    reporterName,
    disease: data.disease,
    species: data.species,
    severity: data.severity, // 'low' | 'medium' | 'high'
    village: data.village,
    district: data.district,
    symptoms: data.symptoms || "",
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    withdrawn: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function listAlerts() {
  const snap = await getDocs(query(alertsCol, orderBy("createdAt", "desc")));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a) => !a.withdrawn);
}

export async function getAlert(alertId) {
  const snap = await getDoc(doc(db, "alerts", alertId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function withdrawAlert(alertId) {
  await updateDoc(doc(db, "alerts", alertId), { withdrawn: true });
}
