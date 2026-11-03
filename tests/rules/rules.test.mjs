// Security rules tests (Firestore + Storage). Run on a computer with Java:
//   npm run test:rules
// It starts the local Firebase emulator, loads firestore.rules and
// storage.rules, and checks who can read/write what. Nothing touches the live
// project.
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getBytes, deleteObject } from "firebase/storage";

let env;
const PROJECT = "demo-jeevamitra-rules";

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: readFileSync("storage.rules", "utf8"), host: "127.0.0.1", port: 9199 },
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); await env.clearStorage(); });

const as = (uid) => env.authenticatedContext(uid);
const anon = () => env.unauthenticatedContext();
const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore(), ctx.storage()));

function residue(owner, extra = {}) {
  return {
    kind: "residue", ownerId: owner, ownerName: "Rama", ownerPhone: "9876543210", status: "available", hidden: false,
    lat: 16.3, lng: 80.44, geohash: "tfchwrqd7u", state: "Andhra Pradesh", district: "Guntur", mandal: "Ponnur", village: "Ponnur",
    photos: [{ path: `fieldPosts/${owner}/p1/a.jpg`, url: "https://x/a.jpg" }], voiceNote: null, description: "",
    priceType: "perDay", amount: 500, negotiable: false, availableFrom: "2026-11-01", availableUntil: null,
    crop: "cotton", cropOther: "", acres: 3, untilFinished: true, allowNightStay: false, waterNearby: true,
    notSprayed: false, lastSprayDate: "2026-10-20", createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...extra,
  };
}

// ---------------- v61 rules still behave the same (spot checks) ----------------
test("v61: user reads own profile only", async () => {
  await seed((db) => setDoc(doc(db, "users/a"), { name: "A" }));
  await assertSucceeds(getDoc(doc(as("a").firestore(), "users/a")));
  await assertFails(getDoc(doc(as("b").firestore(), "users/a")));
});
test("v61: lands readable by signed-in users, writable by owner", async () => {
  await seed((db) => setDoc(doc(db, "lands/l1"), { ownerId: "a", title: "x", bookedRanges: [] }));
  await assertSucceeds(getDoc(doc(as("b").firestore(), "lands/l1")));
  await assertFails(getDoc(doc(anon().firestore(), "lands/l1")));
  await assertFails(updateDoc(doc(as("b").firestore(), "lands/l1"), { title: "hacked" }));
});
test("v61: interaction creation still works and v62 contextKind is accepted", async () => {
  const id = "pub_p1__req_b__rec_a";
  await assertSucceeds(setDoc(doc(as("b").firestore(), "interactions", id), {
    interactionType: "publication_contact", contextType: "publication", contextKind: "fieldPost", contextId: "p1",
    requesterId: "b", recipientId: "a", publicationOwnerId: "a", publicationTitle: "t", publicationImageUrl: null,
    status: "active", lastMessage: "", lastMessageSenderId: null, lastMessageAt: serverTimestamp(),
    requesterUnreadCount: 0, recipientUnreadCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }));
});

// ---------------- v62: fieldPosts ----------------
test("owner can create a valid post; others and anonymous cannot", async () => {
  await assertSucceeds(setDoc(doc(as("a").firestore(), "fieldPosts/p1"), residue("a")));
  await assertFails(setDoc(doc(as("b").firestore(), "fieldPosts/p2"), residue("a")));
  await assertFails(setDoc(doc(anon().firestore(), "fieldPosts/p3"), residue("a")));
});
test("cannot create a hidden, full or malformed post", async () => {
  const db = as("a").firestore();
  await assertFails(setDoc(doc(db, "fieldPosts/x1"), residue("a", { hidden: true })));
  await assertFails(setDoc(doc(db, "fieldPosts/x2"), residue("a", { status: "full" })));
  await assertFails(setDoc(doc(db, "fieldPosts/x3"), residue("a", { kind: "spam" })));
  await assertFails(setDoc(doc(db, "fieldPosts/x4"), residue("a", { photos: Array(6).fill({ path: "p", url: "u" }) })));
  await assertFails(setDoc(doc(db, "fieldPosts/x5"), residue("a", { amount: -5 })));
  await assertFails(setDoc(doc(db, "fieldPosts/x6"), residue("a", { isAdmin: true })));
  await assertFails(setDoc(doc(db, "fieldPosts/x7"), residue("a", { voiceNote: { url: "u", path: "p", durationSec: 400 } })));
});
test("browse query (kind + hidden == false) is allowed; hidden posts are not readable by others", async () => {
  await seed(async (db) => {
    await setDoc(doc(db, "fieldPosts/v"), residue("a"));
    await setDoc(doc(db, "fieldPosts/h"), residue("a", { hidden: true }));
  });
  const b = as("b").firestore();
  await assertSucceeds(getDocs(query(collection(b, "fieldPosts"), where("kind", "==", "residue"), where("hidden", "==", false))));
  await assertFails(getDocs(query(collection(b, "fieldPosts"), where("kind", "==", "residue"))));
  await assertSucceeds(getDoc(doc(b, "fieldPosts/v")));
  await assertFails(getDoc(doc(b, "fieldPosts/h")));
  await assertSucceeds(getDoc(doc(as("a").firestore(), "fieldPosts/h")), "owner sees own hidden post");
  await assertSucceeds(getDocs(query(collection(as("a").firestore(), "fieldPosts"), where("ownerId", "==", "a"))));
});
test("owner updates status / location; cannot un-hide, change owner or kind", async () => {
  await seed(async (db) => {
    await setDoc(doc(db, "fieldPosts/p"), residue("a"));
    await setDoc(doc(db, "fieldPosts/hid"), residue("a", { hidden: true }));
  });
  const a = as("a").firestore();
  await assertSucceeds(updateDoc(doc(a, "fieldPosts/p"), { status: "full", updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(doc(a, "fieldPosts/p"), { lat: 16.4, lng: 80.5, geohash: "tfchx", updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(a, "fieldPosts/p"), { status: "closed" }));
  await assertFails(updateDoc(doc(a, "fieldPosts/p"), { ownerId: "b" }));
  await assertFails(updateDoc(doc(a, "fieldPosts/p"), { kind: "herdAvailable" }));
  await assertFails(updateDoc(doc(a, "fieldPosts/hid"), { hidden: false }));
  await assertFails(updateDoc(doc(as("b").firestore(), "fieldPosts/p"), { status: "available" }));
});
test("only the owner deletes", async () => {
  await seed((db) => setDoc(doc(db, "fieldPosts/p"), residue("a")));
  await assertFails(deleteDoc(doc(as("b").firestore(), "fieldPosts/p")));
  await assertSucceeds(deleteDoc(doc(as("a").firestore(), "fieldPosts/p")));
});

// ---------------- v62: devices, settings, crop guides, alert log ----------------
test("push tokens: only the user, valid shape", async () => {
  const a = as("a").firestore();
  await assertSucceeds(setDoc(doc(a, "users/a/devices/d1"), { fcmToken: "tok", lang: "te", platform: "android", updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(a, "users/a/devices/d2"), { fcmToken: "tok", lang: "fr" }));
  await assertFails(getDoc(doc(as("b").firestore(), "users/a/devices/d1")));
  await assertFails(setDoc(doc(as("b").firestore(), "users/a/devices/d3"), { fcmToken: "x", lang: "en" }));
});
test("alert settings: only the user, valid distance", async () => {
  const a = as("a").firestore();
  await assertSucceeds(setDoc(doc(a, "notificationSettings/a"), { radiusKm: 25, quietHours: true, types: { chat: false } }));
  await assertFails(setDoc(doc(a, "notificationSettings/a"), { radiusKm: 500, quietHours: true, types: {} }));
  await assertFails(getDoc(doc(as("b").firestore(), "notificationSettings/a")));
});
test("crop guides: read-only in the app; alert log closed", async () => {
  await seed((db) => setDoc(doc(db, "cropGuides/cotton"), { name: { en: "Cotton" } }));
  await assertSucceeds(getDoc(doc(as("a").firestore(), "cropGuides/cotton")));
  await assertFails(setDoc(doc(as("a").firestore(), "cropGuides/cotton"), { name: { en: "x" } }));
  await assertFails(setDoc(doc(as("a").firestore(), "cropGuideSettings/default"), { sprayWarningDays: 1 }));
  await assertFails(getDoc(doc(as("a").firestore(), "alertLog/x")));
});

// ---------------- v62: Storage ----------------
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const audio = new Uint8Array(1000);

test("storage: post media written by owner, read by signed-in users", async () => {
  await assertSucceeds(uploadBytes(ref(as("a").storage(), "fieldPosts/a/p1/x.jpg"), jpeg, { contentType: "image/jpeg" }));
  await assertFails(uploadBytes(ref(as("b").storage(), "fieldPosts/a/p1/y.jpg"), jpeg, { contentType: "image/jpeg" }));
  await assertFails(uploadBytes(ref(as("a").storage(), "fieldPosts/a/p1/z.exe"), jpeg, { contentType: "application/octet-stream" }));
  await assertFails(uploadBytes(ref(as("a").storage(), "fieldPosts/a/p1/big.jpg"), new Uint8Array(2 * 1024 * 1024 + 10), { contentType: "image/jpeg" }));
  await assertSucceeds(getBytes(ref(as("b").storage(), "fieldPosts/a/p1/x.jpg")));
  await assertFails(getBytes(ref(anon().storage(), "fieldPosts/a/p1/x.jpg")));
  await assertFails(deleteObject(ref(as("b").storage(), "fieldPosts/a/p1/x.jpg")));
});
test("storage: chat media only for the two people in the conversation", async () => {
  const id = "pub_p1__req_b__rec_a";
  await seed((db) => setDoc(doc(db, "interactions", id), { requesterId: "b", recipientId: "a" }));
  await assertSucceeds(uploadBytes(ref(as("b").storage(), `chats/${id}/b/v.webm`), audio, { contentType: "audio/webm" }));
  await assertFails(uploadBytes(ref(as("c").storage(), `chats/${id}/c/v.webm`), audio, { contentType: "audio/webm" }));
  await assertFails(uploadBytes(ref(as("a").storage(), `chats/${id}/b/fake.webm`), audio, { contentType: "audio/webm" }));
  await assertSucceeds(getBytes(ref(as("a").storage(), `chats/${id}/b/v.webm`)));
  await assertFails(getBytes(ref(as("c").storage(), `chats/${id}/b/v.webm`)));
});
test("storage: everything else is closed", async () => {
  await assertFails(uploadBytes(ref(as("a").storage(), "random/x.jpg"), jpeg, { contentType: "image/jpeg" }));
});
