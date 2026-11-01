import { test } from "node:test";
import assert from "node:assert/strict";
import { geohashForLocation } from "geofire-common";
import { makeFakeDb, makeFakeMessaging, makeFakeBucket } from "./fakeAdmin.js";
import {
  processFieldPostWrite, processMessageCreated, processInteractionCreated, runDailyJobs, deleteUserData,
} from "../src/alerts.js";

const DAY_IST_NOON = Date.parse("2026-11-10T06:30:00Z"); // 12:00 IST
const NIGHT_IST = Date.parse("2026-11-10T17:30:00Z"); // 23:00 IST
const P = (lat, lng, extra) => ({ lat, lng, geohash: geohashForLocation([lat, lng]), status: "available", hidden: false, ...extra });

function world(now = DAY_IST_NOON, extra = {}) {
  const db = makeFakeDb({
    "users/farmerA": { name: "Rama" },
    "users/farmerC": { name: "Lakshmi" },
    "users/herderB": { name: "Venkat" },
    "users/farmerA/devices/d1": { fcmToken: "tokA", lang: "te" },
    "users/farmerC/devices/d1": { fcmToken: "tokC", lang: "hi" },
    "users/herderB/devices/d1": { fcmToken: "tokB", lang: "en" },
    "fieldPosts/r1": P(16.309, 80.44, { kind: "residue", ownerId: "farmerA", crop: "cotton", acres: 3, village: "Ponnur" }),
    "fieldPosts/n1": P(16.34, 80.44, { kind: "nightStayNeed", ownerId: "farmerC", acres: 2, nights: 3, village: "Tenali" }),
    "fieldPosts/far": P(16.62, 80.44, { kind: "residue", ownerId: "farmerD", crop: "paddy", acres: 9, village: "Far" }),
    ...extra,
  });
  const messaging = makeFakeMessaging({ badTokens: ["dead"] });
  const deps = { db, messaging, now: () => now, serverTimestamp: () => ({ __ts: now }) };
  return { db, messaging, deps };
}
const herd = (now) => P(16.30, 80.44, { kind: "herdAvailable", ownerId: "herderB", animalType: "sheep", animalCount: 300, village: "Narasaraopet", locationUpdatedAt: now });

test("new herd: nearby field owners get push in their language + bell entry; herd owner gets summaries", async () => {
  const { db, messaging, deps } = world();
  const res = await processFieldPostWrite(deps, "h1", null, herd(DAY_IST_NOON));
  const toA = messaging.sent.find((m) => m.token === "tokA");
  const toC = messaging.sent.find((m) => m.token === "tokC");
  assert.equal(toA.notification.title, "🐑 మీ పొలం దగ్గర మంద");
  assert.equal(toA.notification.body, "సుమారు 300 గొర్రెలు 1 కి.మీ. దూరంలో ఉన్నాయి. మాట్లాడటానికి నొక్కండి.");
  assert.equal(toA.data.link, "/field-posts/h1");
  assert.equal(toA.android.notification.channelId, "nearby");
  assert.equal(toC.notification.title, "🐑 आपके खेत के पास झुंड");
  assert.ok(!messaging.sent.some((m) => m.token === "tokD"), "farmer 36 km away not alerted");
  const toB = messaging.sent.filter((m) => m.token === "tokB").map((m) => m.notification.body);
  assert.ok(toB.includes("1 crop residue fields within 10 km: cotton. Tap to see."), toB.join(" | "));
  assert.ok(toB.includes("1 farmers within 10 km will pay for night stay. Tap to see."));
  const bells = Object.values(db.dump("notifications/"));
  const bellA = bells.find((b) => b.recipientId === "farmerA");
  assert.equal(bellA.link, "/field-posts/h1");
  assert.equal(bellA.read, false);
  assert.ok(bellA.message.startsWith("🐑 మీ పొలం దగ్గర మంద"), "bell entry in recipient's language");
  assert.equal(res.filter((r) => r.result === "sent").length, 4);
});

test("same herd and field again within 48 h: no repeat", async () => {
  const { messaging, deps } = world();
  await processFieldPostWrite(deps, "h1", null, herd(DAY_IST_NOON));
  const before = messaging.sent.length;
  const moved = { ...herd(DAY_IST_NOON), lat: 16.302, geohash: geohashForLocation([16.302, 80.44]) };
  // reactivation counts as a new trigger, but the same pairs are blocked
  const res = await processFieldPostWrite(deps, "h1", { ...herd(DAY_IST_NOON), status: "full" }, moved);
  assert.ok(res.every((r) => r.result === "skipped:limit"), JSON.stringify(res));
  assert.equal(messaging.sent.length, before);
});

test("daily cap: at most 5 nearby alerts per person per day", async () => {
  const { messaging, deps } = world();
  for (let i = 0; i < 7; i++) {
    const h = { ...herd(DAY_IST_NOON), ownerId: `h${i}` };
    await processFieldPostWrite(deps, `herd${i}`, null, h);
  }
  assert.equal(messaging.sent.filter((m) => m.token === "tokA").length, 5);
});

test("recipient settings: distance and switched-off alerts", async () => {
  const { messaging, deps } = world(DAY_IST_NOON, {
    "notificationSettings/farmerA": { radiusKm: 5, quietHours: true, types: { herdNear: false } },
    "notificationSettings/farmerC": { radiusKm: 5, quietHours: true, types: {} },
  });
  await processFieldPostWrite(deps, "h1", null, herd(DAY_IST_NOON));
  assert.ok(!messaging.sent.some((m) => m.token === "tokA"), "farmer switched herd alerts off");
  assert.ok(messaging.sent.some((m) => m.token === "tokC"), "4.4 km is within 5 km");
});

test("quiet hours: bell entry only, no phone push at night", async () => {
  const { db, messaging, deps } = world(NIGHT_IST);
  const res = await processFieldPostWrite(deps, "h1", null, herd(NIGHT_IST));
  assert.equal(messaging.sent.length, 0);
  assert.ok(res.every((r) => r.result === "bell-only"));
  assert.ok(Object.values(db.dump("notifications/")).some((b) => b.recipientId === "farmerA"));
});

test("new residue field alerts nearby herd owners", async () => {
  const { messaging, deps } = world(DAY_IST_NOON, { "fieldPosts/h1": herd(DAY_IST_NOON) });
  const post = P(16.31, 80.45, { kind: "residue", ownerId: "farmerX", crop: "jowar", acres: 5, village: "Tenali" });
  await processFieldPostWrite(deps, "r9", null, post);
  const toB = messaging.sent.find((m) => m.token === "tokB");
  assert.equal(toB.notification.title, "🆕 New jowar field 2 km from your herd");
  assert.equal(toB.notification.body, "5 acres, Tenali. Tap to see.");
});

test("status change to full or plain edits send nothing", async () => {
  const { messaging, deps } = world();
  const h = herd(DAY_IST_NOON);
  await processFieldPostWrite(deps, "h1", h, { ...h, status: "full" });
  await processFieldPostWrite(deps, "h1", h, { ...h, description: "edited" });
  assert.equal(messaging.sent.length, 0);
});

test("chat push: voice / photos / text, grouped per chat, no bell (app writes it)", async () => {
  const { db, messaging, deps } = world();
  await processMessageCreated(deps, "I1", { senderId: "herderB", receiverId: "farmerA", type: "voice", media: { voice: { durationSec: 84 } } });
  await processMessageCreated(deps, "I1", { senderId: "herderB", receiverId: "farmerA", type: "image", media: { images: [{}, {}, {}] }, caption: "" });
  await processMessageCreated(deps, "I1", { senderId: "herderB", receiverId: "farmerA", type: "text", text: "హలో" });
  assert.deepEqual(messaging.sent.map((m) => m.notification.body), ["🎤 వాయిస్ సందేశం (1:24)", "📷 3 ఫోటోలు", "హలో"]);
  assert.equal(messaging.sent[0].notification.title, "💬 Venkat");
  assert.equal(messaging.sent[0].android.notification.tag, "chat_I1");
  assert.equal(messaging.sent[0].android.notification.channelId, "messages");
  assert.equal(Object.keys(db.dump("notifications/")).length, 0);
});

test("chat push respects 'chat' switched off; dead tokens are removed", async () => {
  const { db, messaging, deps } = world(DAY_IST_NOON, {
    "notificationSettings/farmerC": { types: { chat: false } },
    "users/farmerA/devices/d2": { fcmToken: "dead", lang: "te" },
  });
  await processMessageCreated(deps, "I2", { senderId: "herderB", receiverId: "farmerC", type: "text", text: "x" });
  assert.equal(messaging.sent.length, 0);
  await processMessageCreated(deps, "I3", { senderId: "herderB", receiverId: "farmerA", type: "text", text: "y" });
  assert.equal(db.data.has("users/farmerA/devices/d2"), false, "dead token removed");
  assert.equal(db.data.has("users/farmerA/devices/d1"), true);
});

test("someone asks about a field post: owner told, land chats ignored", async () => {
  const { messaging, deps } = world();
  await processInteractionCreated(deps, "I9", { contextKind: "fieldPost", recipientId: "farmerA", requesterId: "herderB", publicationTitle: "☁️ పత్తి · 3 ఎకరాలు" });
  assert.equal(messaging.sent[0].notification.title, "✅ Venkat మీ పోస్ట్ గురించి అడుగుతున్నారు");
  assert.equal(messaging.sent[0].data.link, "/messages/I9");
  const r = await processInteractionCreated(deps, "I10", { recipientId: "farmerA", requesterId: "herderB" });
  assert.equal(r, "skipped:not-field-post");
});

test("daily jobs: close expired posts, remind herd owners with old location", async () => {
  const old = DAY_IST_NOON - 30 * 3600e3;
  const { db, messaging, deps } = world(DAY_IST_NOON, {
    "fieldPosts/exp": P(16.3, 80.4, { kind: "residue", ownerId: "farmerA", availableUntil: "2026-11-09" }),
    "fieldPosts/h1": { ...herd(old) },
    "fieldPosts/h2": { ...herd(old), ownerId: "herderB" },
  });
  const r = await runDailyJobs(deps);
  assert.equal(db.data.get("fieldPosts/exp").status, "closed");
  assert.equal(r.reminded, 1, "one reminder per owner");
  assert.equal(messaging.sent[0].notification.title, "📍 Where is your herd today?");
  assert.equal(messaging.sent[0].android.notification.channelId, "reminders");
});

test("account deletion removes v62 posts, tokens, settings and files", async () => {
  const { db, deps } = world(DAY_IST_NOON, { "notificationSettings/farmerA": { radiusKm: 5 } });
  const bucket = makeFakeBucket(["fieldPosts/farmerA/r1/a.jpg", "chats/I1/farmerA/v.webm", "chats/I1/herderB/p.jpg", "fieldPosts/herderB/x/b.jpg"]);
  const r = await deleteUserData({ ...deps, bucket }, "farmerA");
  assert.deepEqual(r, { posts: 1, devices: 1, files: 2 });
  assert.equal(db.data.has("fieldPosts/r1"), false);
  assert.equal(db.data.has("notificationSettings/farmerA"), false);
  assert.deepEqual([...bucket.files].sort(), ["chats/I1/herderB/p.jpg", "fieldPosts/herderB/x/b.jpg"]);
});
