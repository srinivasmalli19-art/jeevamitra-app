// Sends alerts: bell entry (notifications collection, same shape the app
// writes) + phone push to every device of the recipient, in each device's
// language. Dependencies are passed in so this runs in tests with fakes:
//   deps = { db, messaging, now(), serverTimestamp(), bucket? }
import { geohashQueryBounds } from "geofire-common";
import {
  KIND, SEARCH_RADIUS_KM, DAILY_NEARBY_CAP, NEARBY_TYPES, triggerFor, planAlerts, wantsAlert,
  recentlySent, isQuietTime, istDay, isActive, toMillis,
} from "./matching.js";
import { normalizeSettings } from "./settings.js";
import { TEXTS, fmt, langOf, distText, cropText, animalText, durText } from "./texts.js";

const CHANNEL = { chat: "messages", postContact: "messages", reminder: "reminders" };
const INVALID_TOKEN = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token", "messaging/invalid-argument"]);

export async function loadRecipient(db, uid) {
  const [settingsSnap, devSnap] = await Promise.all([
    db.collection("notificationSettings").doc(uid).get(),
    db.collection("users").doc(uid).collection("devices").get(),
  ]);
  const devices = devSnap.docs
    .map((d) => ({ id: d.id, token: d.data().fcmToken, lang: langOf(d.data().lang) }))
    .filter((d) => typeof d.token === "string" && d.token);
  return {
    settings: normalizeSettings(settingsSnap.exists ? settingsSnap.data() : null),
    devices,
    lang: devices[0]?.lang || "en",
  };
}

/** Reserves the 48-hour pair slot and today's nearby-alert quota. Returns false to skip. */
async function reserveNearbySlot(deps, uid, pairKey) {
  const { db, now } = deps;
  const t = now();
  const pairRef = db.collection("alertLog").doc(`pair_${pairKey}__${uid}`.slice(0, 1400));
  const capRef = db.collection("alertLog").doc(`cap_${uid}_${istDay(t)}`);
  return db.runTransaction(async (tx) => {
    const [pair, cap] = await Promise.all([tx.get(pairRef), tx.get(capRef)]);
    if (pair.exists && recentlySent(toMillis(pair.data().sentAt) || pair.data().sentAtMs, t)) return false;
    const count = cap.exists ? cap.data().count || 0 : 0;
    if (count >= DAILY_NEARBY_CAP) return false;
    tx.set(pairRef, { uid, pairKey, sentAtMs: t });
    tx.set(capRef, { uid, day: istDay(t), count: count + 1 });
    return true;
  });
}

/**
 * @param alert { recipientId, type, km?, pairKey?, link, build(lang) -> {title, body}, bell = true, tag? }
 * @returns "sent" | "bell-only" | "skipped:<reason>"
 */
export async function deliver(deps, alert) {
  const { db, messaging, now, serverTimestamp } = deps;
  const r = await loadRecipient(db, alert.recipientId);
  if (!wantsAlert(r.settings, alert.type, alert.km ?? 0)) return "skipped:settings";
  const nearby = NEARBY_TYPES.includes(alert.type);
  if (nearby && alert.pairKey && !(await reserveNearbySlot(deps, alert.recipientId, alert.pairKey))) return "skipped:limit";

  if (alert.bell !== false) {
    const t = alert.build(r.lang);
    await db.collection("notifications").add({
      recipientId: alert.recipientId,
      message: `${t.title}\n${t.body}`,
      type: alert.type,
      link: alert.link,
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  if (nearby && r.settings.quietHours && isQuietTime(now())) return "bell-only";
  if (!r.devices.length) return alert.bell !== false ? "bell-only" : "skipped:no-device";

  await Promise.all(r.devices.map(async (d) => {
    const t = alert.build(d.lang);
    try {
      await messaging.send({
        token: d.token,
        notification: { title: t.title, body: t.body },
        data: { link: alert.link, type: alert.type },
        android: {
          priority: "high",
          notification: {
            channelId: CHANNEL[alert.type] || "nearby",
            icon: "ic_stat_jeevamitra",
            color: "#1F4025",
            ...(alert.tag ? { tag: alert.tag } : {}),
          },
        },
      });
    } catch (err) {
      if (INVALID_TOKEN.has(err?.code)) {
        await db.collection("users").doc(alert.recipientId).collection("devices").doc(d.id).delete();
      } else {
        console.warn("Push failed", alert.recipientId, err?.code || err?.message);
      }
    }
  }));
  return "sent";
}

// ---------------------------------------------------------------------------
async function nearbyPosts(db, center) {
  const bounds = geohashQueryBounds([center.lat, center.lng], SEARCH_RADIUS_KM * 1000);
  const snaps = await Promise.all(bounds.map(([a, b]) => db.collection("fieldPosts").orderBy("geohash").startAt(a).endAt(b).get()));
  const byId = new Map();
  for (const s of snaps) for (const d of s.docs) byId.set(d.id, { id: d.id, ...d.data() });
  return [...byId.values()];
}

async function adminCropNames(db) {
  const snap = await db.collection("cropGuides").get();
  return Object.fromEntries(snap.docs.map((d) => [d.id, d.data().name || {}]));
}

/** fieldPosts/{postId} was written. Returns a list of delivery results (for logs/tests). */
export async function processFieldPostWrite(deps, postId, before, after) {
  const trigger = triggerFor(before, after, deps.now());
  if (!trigger) return [];
  const { db } = deps;
  const candidates = await nearbyPosts(db, after);
  const plan = planAlerts(postId, after, candidates, deps.now());
  const crops = after.kind === KIND.RESIDUE || plan.summary ? await adminCropNames(db) : {};
  const results = [];

  for (const a of plan.direct) {
    let build;
    if (a.template === "herdNear") {
      build = (l) => ({
        title: TEXTS.herdNear.title[l],
        body: fmt(TEXTS.herdNear.body[l], { count: after.animalCount, animal: animalText(after.animalType, l), dist: distText(a.km, l) }),
      });
    } else if (a.template === "residueNew") {
      build = (l) => ({
        title: fmt(TEXTS.residueNew.title[l], { crop: cropText(after, l, crops), dist: distText(a.km, l) }),
        body: fmt(TEXTS.residueNew.body[l], { acres: after.acres, village: after.village }),
      });
    } else {
      build = (l) => ({
        title: TEXTS.nightStayWorkNew.title[l],
        body: fmt(TEXTS.nightStayWorkNew.body[l], { dist: distText(a.km, l), nights: after.nights }),
      });
    }
    results.push({ to: a.recipientId, type: a.type, result: await deliver(deps, { ...a, build }) });
  }

  if (plan.summary) {
    const owner = await loadRecipient(db, plan.summary.recipientId);
    const r = owner.settings.radiusKm;
    const residue = plan.summary.residue.filter((x) => x._km <= r);
    const need = plan.summary.need.filter((x) => x._km <= r);
    const day = istDay(deps.now());
    if (residue.length) {
      const build = (l) => {
        const names = [...new Set(residue.map((x) => cropText(x, l, crops)).filter(Boolean))].slice(0, 3).join(", ");
        return { title: TEXTS.residueNearSummary.title[l], body: fmt(TEXTS.residueNearSummary.body[l], { n: residue.length, r, crops: names }) };
      };
      results.push({ to: plan.summary.recipientId, type: "residueNear", result: await deliver(deps, { recipientId: plan.summary.recipientId, type: "residueNear", km: residue[0]._km, pairKey: `sumR_${postId}_${day}`, link: "/residue", build }) });
    }
    if (need.length) {
      const build = (l) => ({ title: TEXTS.nightStayWorkSummary.title[l], body: fmt(TEXTS.nightStayWorkSummary.body[l], { n: need.length, r }) });
      results.push({ to: plan.summary.recipientId, type: "nightStayWork", result: await deliver(deps, { recipientId: plan.summary.recipientId, type: "nightStayWork", km: need[0]._km, pairKey: `sumN_${postId}_${day}`, link: "/night-stay", build }) });
    }
  }
  return results;
}

/** interactions/{iid}/messages/{mid} created: push to the receiver (the app already writes the bell entry). */
export async function processMessageCreated(deps, interactionId, msg) {
  if (!msg?.receiverId || !msg?.senderId) return "skipped:bad-message";
  const sender = await deps.db.collection("users").doc(msg.senderId).get();
  const name = (sender.exists && sender.data().name) || null;
  const body = (l) => {
    if (msg.type === "voice") return fmt(TEXTS.chatVoice[l], { dur: durText(msg.media?.voice?.durationSec) });
    if (msg.type === "image") {
      const n = msg.media?.images?.length || 1;
      const label = n === 1 ? TEXTS.chatPhoto[l] : fmt(TEXTS.chatPhotos[l], { n });
      return msg.caption ? `${label} ${msg.caption}`.slice(0, 160) : label;
    }
    return String(msg.text || "").slice(0, 160);
  };
  return deliver(deps, {
    recipientId: msg.receiverId,
    type: "chat",
    link: `/messages/${interactionId}`,
    bell: false,
    tag: `chat_${interactionId}`,
    build: (l) => ({ title: fmt(TEXTS.chat.title[l], { name: name || TEXTS.someone[l] }), body: body(l) }),
  });
}

/** interactions/{iid} created about a field post: tell the post owner. */
export async function processInteractionCreated(deps, interactionId, it) {
  if (it?.contextKind !== "fieldPost" || !it.recipientId || !it.requesterId) return "skipped:not-field-post";
  const requester = await deps.db.collection("users").doc(it.requesterId).get();
  const name = (requester.exists && requester.data().name) || null;
  return deliver(deps, {
    recipientId: it.recipientId,
    type: "postContact",
    link: `/messages/${interactionId}`,
    build: (l) => ({
      title: fmt(TEXTS.postContact.title[l], { name: name || TEXTS.someone[l] }),
      body: fmt(TEXTS.postContact.body[l], { title: it.publicationTitle || "" }),
    }),
  });
}

/** Every morning: close expired posts, remind herd owners whose location is over a day old. */
export async function runDailyJobs(deps) {
  const { db, now, serverTimestamp } = deps;
  const t = now();
  const today = istDay(t);
  const snap = await db.collection("fieldPosts").where("hidden", "==", false).get();
  let closed = 0;
  let reminded = 0;
  const remindedOwners = new Set();
  for (const d of snap.docs) {
    const p = { id: d.id, ...d.data() };
    if (p.status !== "closed" && p.availableUntil && p.availableUntil < today) {
      await d.ref.update({ status: "closed", updatedAt: serverTimestamp() });
      closed += 1;
      continue;
    }
    if (p.kind === KIND.HERD && isActive(p, t) && !remindedOwners.has(p.ownerId)) {
      const updated = toMillis(p.locationUpdatedAt) || toMillis(p.updatedAt);
      if (updated && t - updated > 24 * 3600e3) {
        remindedOwners.add(p.ownerId);
        const res = await deliver(deps, {
          recipientId: p.ownerId,
          type: "reminder",
          link: `/field-posts/${p.id}`,
          bell: false,
          build: (l) => ({ title: TEXTS.reminder.title[l], body: TEXTS.reminder.body[l] }),
        });
        if (res === "sent") reminded += 1;
      }
    }
  }
  return { closed, reminded };
}

/** An account was deleted: remove the user's v62 data and files. */
export async function deleteUserData(deps, uid) {
  const { db, bucket } = deps;
  const posts = await db.collection("fieldPosts").where("ownerId", "==", uid).get();
  for (const d of posts.docs) await d.ref.delete();
  const devices = await db.collection("users").doc(uid).collection("devices").get();
  for (const d of devices.docs) await d.ref.delete();
  await db.collection("notificationSettings").doc(uid).delete();
  let files = 0;
  if (bucket) {
    const [postFiles] = await bucket.getFiles({ prefix: `fieldPosts/${uid}/` });
    const [chatFiles] = await bucket.getFiles({ prefix: "chats/" });
    const mine = [...postFiles, ...chatFiles.filter((f) => f.name.split("/")[2] === uid)];
    await Promise.all(mine.map((f) => f.delete().catch(() => {})));
    files = mine.length;
  }
  return { posts: posts.size, devices: devices.size, files };
}
