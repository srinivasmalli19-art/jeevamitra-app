import {
  collection, addDoc, doc, getDocs, updateDoc, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";

const notifCol = collection(db, "notifications");

// Any signed-in user can create a notification FOR someone else — this is
// how the app tells the other party in a booking that something happened,
// since there's no server to do it automatically (see README for why).
export async function createNotification(recipientId, message) {
  await addDoc(notifCol, {
    recipientId,
    message,
    read: false,
    createdAt: serverTimestamp(),
  });
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
