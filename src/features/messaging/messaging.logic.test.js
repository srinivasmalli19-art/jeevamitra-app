import { test } from "node:test";
import assert from "node:assert/strict";
import {
  interactionIdFor, validateMessageText, MAX_MESSAGE_LENGTH, unreadCountFor,
  myUnreadField, otherUnreadField, otherParticipantId, isParticipant,
  normalizeInteraction, normalizeMessage, mergeInteractions, sortInteractionsByRecent,
  toMillis,
} from "./messaging.logic.js";

test("interactionIdFor is deterministic and direction-sensitive", () => {
  const a = interactionIdFor({ contextId: "L1", requesterId: "A", recipientId: "B" });
  const b = interactionIdFor({ contextId: "L1", requesterId: "A", recipientId: "B" });
  assert.equal(a, b, "same inputs -> same id (prevents duplicates)");
  assert.equal(a, "pub_L1__req_A__rec_B");
  const reversed = interactionIdFor({ contextId: "L1", requesterId: "B", recipientId: "A" });
  assert.notEqual(a, reversed, "A->B differs from B->A");
});

test("interactionIdFor rejects missing parts", () => {
  assert.throws(() => interactionIdFor({ contextId: "", requesterId: "A", recipientId: "B" }));
  assert.throws(() => interactionIdFor({ contextId: "L1", requesterId: "", recipientId: "B" }));
});

test("validateMessageText trims and rejects empty / whitespace / overlong", () => {
  assert.deepEqual(validateMessageText("  hello  "), { ok: true, value: "hello" });
  assert.equal(validateMessageText("").ok, false);
  assert.equal(validateMessageText("    ").ok, false);
  assert.equal(validateMessageText("\n\t ").reason, "empty");
  assert.equal(validateMessageText(null).ok, false);
  const long = "x".repeat(MAX_MESSAGE_LENGTH + 1);
  assert.equal(validateMessageText(long).reason, "too_long");
  const exact = "y".repeat(MAX_MESSAGE_LENGTH);
  assert.equal(validateMessageText(exact).ok, true);
});

test("unread selection uses the correct field per role", () => {
  const it = { requesterId: "A", recipientId: "B", requesterUnreadCount: 3, recipientUnreadCount: 7 };
  assert.equal(unreadCountFor(it, "A"), 3);
  assert.equal(unreadCountFor(it, "B"), 7);
  assert.equal(unreadCountFor(it, "C"), 0, "non-participant sees 0");
  assert.equal(myUnreadField(it, "A"), "requesterUnreadCount");
  assert.equal(myUnreadField(it, "B"), "recipientUnreadCount");
  assert.equal(otherUnreadField(it, "A"), "recipientUnreadCount");
  assert.equal(otherUnreadField(it, "B"), "requesterUnreadCount");
});

test("participant helpers", () => {
  const it = { requesterId: "A", recipientId: "B" };
  assert.equal(otherParticipantId(it, "A"), "B");
  assert.equal(otherParticipantId(it, "B"), "A");
  assert.equal(isParticipant(it, "A"), true);
  assert.equal(isParticipant(it, "C"), false);
});

test("normalizeInteraction fills defaults and is frozen", () => {
  const it = normalizeInteraction("id1", { requesterId: "A", recipientId: "B" });
  assert.equal(it.id, "id1");
  assert.equal(it.interactionType, "publication_contact");
  assert.equal(it.contextType, "publication");
  assert.equal(it.status, "active");
  assert.equal(it.publicationOwnerId, "B", "defaults to recipient when absent");
  assert.equal(it.requesterUnreadCount, 0);
  assert.ok(Object.isFrozen(it));
});

test("normalizeMessage fills defaults", () => {
  const m = normalizeMessage("m1", { senderId: "A", receiverId: "B", text: "hi" });
  assert.equal(m.type, "text");
  assert.equal(m.status, "sent");
  assert.equal(m.readAt, null);
  assert.ok(Object.isFrozen(m));
});

test("toMillis tolerates Timestamp-like, number and null", () => {
  assert.equal(toMillis(null), 0);
  assert.equal(toMillis(1234), 1234);
  assert.equal(toMillis({ toMillis: () => 999 }), 999);
  assert.equal(toMillis({ toDate: () => new Date(500) }), 500);
});

test("mergeInteractions dedupes by id and sorts newest-first", () => {
  const a = [{ id: "1", lastMessageAt: 100 }, { id: "2", lastMessageAt: 300 }];
  const b = [{ id: "2", lastMessageAt: 300 }, { id: "3", lastMessageAt: 200 }];
  const merged = mergeInteractions(a, b);
  assert.deepEqual(merged.map((x) => x.id), ["2", "3", "1"]);
});

test("sortInteractionsByRecent falls back to updatedAt", () => {
  const list = [{ id: "1", updatedAt: 5 }, { id: "2", updatedAt: 9 }];
  assert.deepEqual(sortInteractionsByRecent(list).map((x) => x.id), ["2", "1"]);
});
