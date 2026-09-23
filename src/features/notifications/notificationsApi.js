import {
  collection, addDoc, doc, getDocs, updateDoc, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";

const notifCol = collection(db, "notifications");

// Any signed-in user can create a notification FOR someone else — this is
// how the app tells the other party in a booking that something happened,
// since there's no server to do it automatically (see README for why).
//
// `extra` may carry an optional `type` (e.g. "new_message") and `link`
// (an in-app route such as "/messages/<id>"). When a `link` is present the
// notifications sheet turns the row into a deep link. Backward compatible:
// existing callers pass only (recipientId, message).
export async function createNotification(recipientId, message, extra = {}) {
  const doc = {
    recipientId,
    message,
    read: false,
    createdAt: serverTimestamp(),
  };
  if (extra.type) doc.type = extra.type;
  if (extra.link) doc.link = extra.link;
  await addDoc(notifCol, doc);
}

export async function listMyNotifications(uid) {
  const snap = await getDocs(query(notifCol, where("recipientId", "==", uid), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, "notifications", id), { read: true });
}

export async function markAllRead(notifications) {
  await Promise.all(notifications.filter((n) => !n.read).map((n) => markNotificationRead(n.id)));
}
