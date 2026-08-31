import {
  collection, addDoc, onSnapshot, query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";

const messagesCol = collection(db, "messages");

// ownerId/requesterId are duplicated onto every message (not just the
// parent booking) so Firestore rules can check access without a
// cross-document read.
export async function sendMessage({ bookingId, ownerId, requesterId, senderId, senderName, text }) {
  await addDoc(messagesCol, {
    bookingId, ownerId, requesterId, senderId, senderName, text,
    createdAt: serverTimestamp(),
  });
}

// No orderBy in the query itself (that'd need a composite index) — sort
// client-side after every snapshot instead.
export function listenToMessages(bookingId, callback) {
  const q = query(messagesCol, where("bookingId", "==", bookingId));
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    msgs.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
    callback(msgs);
  });
}
