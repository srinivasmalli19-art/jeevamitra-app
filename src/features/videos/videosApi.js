import {
  collection, addDoc, deleteDoc, doc, getDocs,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";

const videosCol = collection(db, "videos");

export async function createVideo(adminUid, { title, youtubeUrl }) {
  const docRef = await addDoc(videosCol, {
    addedBy: adminUid,
    title,
    youtubeUrl,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function listVideos() {
  const snap = await getDocs(query(videosCol, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteVideo(id) {
  await deleteDoc(doc(db, "videos", id));
}
