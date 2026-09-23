import {
  collection, doc, getDoc, getDocs, onSnapshot, query, where, orderBy, limit,
  startAfter, serverTimestamp, runTransaction, updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase/init";
import { createNotification } from "../notifications/notificationsApi";
import {
  interactionIdFor, validateMessageText, normalizeInteraction, normalizeMessage,
  myUnreadField, otherUnreadField, mergeInteractions,
} from "./messaging.logic";

export const PAGE_SIZE = 40;

const interactionsCol = collection(db, "interactions");
const interactionRef = (id) => doc(db, "interactions", id);
const messagesColRef = (id) => collection(db, "interactions", id, "messages");

// Best-effort notification (mirrors bookingsApi.tryNotify): a notification
// hiccup must never break sending a message.
async function tryNotify(recipientId, message, extra) {
  try {
    await createNotification(recipientId, message, extra);
  } catch (err) {
    console.warn("Message notification skipped (safe to ignore):", err?.message);
  }
}

/**
 * Get the existing publication interaction between (requester, owner, land)
 * or create exactly one. Uses a deterministic id + transaction so repeated
 * "Contact Publisher" taps can never create duplicates.
 */
export async function getOrCreatePublicationInteraction({
  contextId, requesterId, recipientId, publicationTitle, publicationImageUrl,
}) {
  if (!contextId || !requesterId || !recipientId) {
    throw new Error("Missing publication or participant information.");
  }
  if (requesterId === recipientId) {
    throw new Error("You cannot contact yourself about your own publication.");
  }
  const id = interactionIdFor({ contextId, requesterId, recipientId });
  const ref = interactionRef(id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) return;
    tx.set(ref, {
      interactionType: "publication_contact",
      contextType: "publication",
      contextId,
      requesterId,
      recipientId,
      publicationOwnerId: recipientId,
      publicationTitle: publicationTitle || "",
      publicationImageUrl: publicationImageUrl || null,
      status: "active",
      lastMessage: "",
      lastMessageSenderId: null,
      lastMessageAt: serverTimestamp(),
      requesterUnreadCount: 0,
      recipientUnreadCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  return id;
}

export async function getInteraction(id) {
  const snap = await getDoc(interactionRef(id));
  return snap.exists() ? normalizeInteraction(snap.id, snap.data()) : null;
}

// Realtime interaction document.
export function watchInteraction(id, onData, onError) {
  return onSnapshot(
    interactionRef(id),
    (snap) => onData(snap.exists() ? normalizeInteraction(snap.id, snap.data()) : null),
    (err) => onError?.(err),
  );
}

/**
 * Realtime list of the user's interactions. Two single-field equality
 * listeners (requester + recipient), merged & sorted client-side — this is
 * the same "no composite index" approach the rest of the app uses.
 */
export function watchUserInteractions(uid, onData, onError) {
  let asRequester = [];
  let asRecipient = [];
  const emit = () => onData(mergeInteractions(asRequester, asRecipient));

  const unsub1 = onSnapshot(
    query(interactionsCol, where("requesterId", "==", uid)),
    (snap) => { asRequester = snap.docs.map((d) => normalizeInteraction(d.id, d.data())); emit(); },
    (err) => onError?.(err),
  );
  const unsub2 = onSnapshot(
    query(interactionsCol, where("recipientId", "==", uid)),
    (snap) => { asRecipient = snap.docs.map((d) => normalizeInteraction(d.id, d.data())); emit(); },
    (err) => onError?.(err),
  );
  return () => { unsub1(); unsub2(); };
}

// Realtime sum of the current user's unread counts across all interactions.
export function watchTotalUnread(uid, onData, onError) {
  return watchUserInteractions(
    uid,
    (interactions) => {
      const total = interactions.reduce((sum, it) => {
        if (it.recipientId === uid) return sum + (it.recipientUnreadCount || 0);
        if (it.requesterId === uid) return sum + (it.requesterUnreadCount || 0);
        return sum;
      }, 0);
      onData(total);
    },
    onError,
  );
}

/**
 * Realtime listener over only the latest PAGE_SIZE messages (descending),
 * returned ascending for display. Avoids downloading full history.
 */
export function watchLatestMessages(interactionId, onData, onError, pageSize = PAGE_SIZE) {
  const q = query(messagesColRef(interactionId), orderBy("createdAt", "desc"), limit(pageSize));
  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => normalizeMessage(d.id, d.data())).reverse();
      const oldestDoc = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
      onData(msgs, { oldestDoc, reachedStart: snap.docs.length < pageSize });
    },
    (err) => onError?.(err),
  );
}

// One-shot fetch of the page older than `beforeDoc` (a Firestore QueryDocumentSnapshot).
export async function fetchOlderMessages(interactionId, beforeDoc, pageSize = PAGE_SIZE) {
  if (!beforeDoc) return { messages: [], oldestDoc: null, reachedStart: true };
  const q = query(
    messagesColRef(interactionId),
    orderBy("createdAt", "desc"),
    startAfter(beforeDoc),
    limit(pageSize),
  );
  const snap = await getDocs(q);
  const messages = snap.docs.map((d) => normalizeMessage(d.id, d.data())).reverse();
  const oldestDoc = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { messages, oldestDoc, reachedStart: snap.docs.length < pageSize };
}

/**
 * Send a text message. Runs in a transaction that (1) creates the message
 * with the authenticated senderId, (2) updates the interaction preview, and
 * (3) increments ONLY the receiver's unread count with a concrete value the
 * security rules can validate. Then fires a best-effort notification.
 */
export async function sendTextMessage({ interactionId, senderId, text }) {
  const validation = validateMessageText(text);
  if (!validation.ok) {
    throw new Error(validation.reason === "too_long" ? "Message is too long." : "Message is empty.");
  }
  const clean = validation.value;
  const ref = interactionRef(interactionId);
  let receiverId = null;
  let publicationTitle = "";

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("This conversation no longer exists.");
    const it = normalizeInteraction(snap.id, snap.data());
    if (it.requesterId !== senderId && it.recipientId !== senderId) {
      throw new Error("You are not a participant in this conversation.");
    }
    receiverId = it.requesterId === senderId ? it.recipientId : it.requesterId;
    publicationTitle = it.publicationTitle;

    const msgRef = doc(messagesColRef(interactionId));
    tx.set(msgRef, {
      senderId,
      receiverId,
      type: "text",
      text: clean,
      createdAt: serverTimestamp(),
      readAt: null,
      status: "sent",
    });

    const field = otherUnreadField(it, senderId);
    const current = field === "recipientUnreadCount" ? it.recipientUnreadCount : it.requesterUnreadCount;
    tx.update(ref, {
      lastMessage: clean.slice(0, 140),
      lastMessageSenderId: senderId,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [field]: (current || 0) + 1,
    });
  });

  if (receiverId) {
    await tryNotify(receiverId, `New message about "${publicationTitle || "your publication"}".`, {
      type: "new_message",
      link: `/messages/${interactionId}`,
    });
  }
  return true;
}

/**
 * Mark the conversation read for `uid`: reset their unread count to 0 and
 * stamp readAt on incoming messages that were unread. Unread-count reset is
 * done in a transaction (concrete value for the rules); readAt stamping uses
 * a batch over the currently-loaded unread incoming messages.
 */
export async function markInteractionRead({ interactionId, uid, unreadIncomingIds = [] }) {
  const ref = interactionRef(interactionId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const it = normalizeInteraction(snap.id, snap.data());
    if (it.requesterId !== uid && it.recipientId !== uid) return;
    const field = myUnreadField(it, uid);
    const current = field === "recipientUnreadCount" ? it.recipientUnreadCount : it.requesterUnreadCount;
    if (!current) return; // nothing to reset
    tx.update(ref, { [field]: 0, updatedAt: serverTimestamp() });
  });

  if (unreadIncomingIds.length) {
    const batch = writeBatch(db);
    for (const mid of unreadIncomingIds) {
      batch.update(doc(db, "interactions", interactionId, "messages", mid), {
        readAt: serverTimestamp(),
        status: "read",
      });
    }
    await batch.commit();
  }
}

// Explicit single-message read stamp (used by QA / edge flows).
export async function markMessageAsRead(interactionId, messageId) {
  await updateDoc(doc(db, "interactions", interactionId, "messages", messageId), {
    readAt: serverTimestamp(),
    status: "read",
  });
}
