// Pure, Firebase-free logic for the contextual messaging feature.
// Kept import-free of Firestore so it can be unit-tested with `node --test`
// and reused from both the data layer and the UI without side effects.

export const MAX_MESSAGE_LENGTH = 2000;

// Deterministic interaction id derived from (context, requester, recipient).
// Because the id is fully determined by these three values, "Contact
// Publisher" always resolves to the same document and can never create a
// duplicate conversation. Direction is significant: A->B and B->A differ.
export function interactionIdFor({ contextId, requesterId, recipientId }) {
  if (!contextId || !requesterId || !recipientId) {
    throw new Error("interactionIdFor requires contextId, requesterId and recipientId");
  }
  return `pub_${contextId}__req_${requesterId}__rec_${recipientId}`;
}

// Validates and normalizes user-typed message text. Returns
// { ok, value } on success or { ok:false, reason } on failure.
export function validateMessageText(raw) {
  if (typeof raw !== "string") return { ok: false, reason: "empty" };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, reason: "empty" };
  if (trimmed.length > MAX_MESSAGE_LENGTH) return { ok: false, reason: "too_long" };
  return { ok: true, value: trimmed };
}

// Which unread field applies to the current user for a given interaction.
export function unreadCountFor(interaction, uid) {
  if (!interaction || !uid) return 0;
  if (interaction.requesterId === uid) return interaction.requesterUnreadCount || 0;
  if (interaction.recipientId === uid) return interaction.recipientUnreadCount || 0;
  return 0;
}

// The unread field name to reset when the current user opens the thread.
export function myUnreadField(interaction, uid) {
  if (interaction?.recipientId === uid) return "recipientUnreadCount";
  return "requesterUnreadCount";
}

// The unread field name to increment for the OTHER party when `uid` sends.
export function otherUnreadField(interaction, uid) {
  if (interaction?.recipientId === uid) return "requesterUnreadCount";
  return "recipientUnreadCount";
}

// The id of the other participant relative to `uid`.
export function otherParticipantId(interaction, uid) {
  if (!interaction) return null;
  return interaction.requesterId === uid ? interaction.recipientId : interaction.requesterId;
}

export function isParticipant(interaction, uid) {
  if (!interaction || !uid) return false;
  return interaction.requesterId === uid || interaction.recipientId === uid;
}

// Normalizes a raw Firestore interaction doc into a stable, frozen shape.
// `raw` is the plain data object; `id` is the document id.
export function normalizeInteraction(id, raw = {}) {
  return Object.freeze({
    id,
    interactionType: raw.interactionType || "publication_contact",
    contextType: raw.contextType || "publication",
    contextId: raw.contextId || null,
    requesterId: raw.requesterId || null,
    recipientId: raw.recipientId || null,
    publicationOwnerId: raw.publicationOwnerId || raw.recipientId || null,
    publicationTitle: raw.publicationTitle || "",
    publicationImageUrl: raw.publicationImageUrl || null,
    status: raw.status || "active",
    lastMessage: raw.lastMessage || "",
    lastMessageSenderId: raw.lastMessageSenderId || null,
    lastMessageAt: raw.lastMessageAt || null,
    requesterUnreadCount: raw.requesterUnreadCount || 0,
    recipientUnreadCount: raw.recipientUnreadCount || 0,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  });
}

export function normalizeMessage(id, raw = {}) {
  return Object.freeze({
    id,
    senderId: raw.senderId || null,
    receiverId: raw.receiverId || null,
    type: raw.type || "text",
    text: raw.text || "",
    createdAt: raw.createdAt || null,
    readAt: raw.readAt || null,
    status: raw.status || "sent",
  });
}

// millis() helper tolerant of Firestore Timestamp | null | plain number.
export function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return 0;
}

// Sorts interactions newest-activity-first (client-side, avoids composite index).
export function sortInteractionsByRecent(list) {
  return [...list].sort(
    (a, b) => toMillis(b.lastMessageAt || b.updatedAt) - toMillis(a.lastMessageAt || a.updatedAt),
  );
}

// Merges two participant-scoped query results, de-duplicating by id.
export function mergeInteractions(a = [], b = []) {
  const byId = new Map();
  for (const it of [...a, ...b]) byId.set(it.id, it);
  return sortInteractionsByRecent([...byId.values()]);
}
