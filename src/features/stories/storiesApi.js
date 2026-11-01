import {
  collection, addDoc, deleteDoc, doc, getDoc, getDocs,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";

const storiesCol = collection(db, "stories");

export async function createStory(adminUid, { title, body, authorName, photoUrl }) {
  const docRef = await addDoc(storiesCol, {
    addedBy: adminUid,
    title,
    body,
    authorName: authorName || "",
    photoUrl: photoUrl || null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function listStories() {
  const snap = await getDocs(query(storiesCol, orderBy("createdAt", "desc")));
  // v62: items paused from Central Admin (hidden: true) are not shown.
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.hidden !== true);
}

export async function getStory(id) {
  const snap = await getDoc(doc(db, "stories", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function deleteStory(id) {
  await deleteDoc(doc(db, "stories", id));
}
