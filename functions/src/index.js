// JeevaMitra v62 Cloud Functions (region asia-south1, same as Firestore).
// Deploy: firebase deploy --only functions
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getStorage } from "firebase-admin/storage";
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as v1 from "firebase-functions/v1";
import {
  processFieldPostWrite, processMessageCreated, processInteractionCreated, runDailyJobs, deleteUserData,
} from "./alerts.js";

initializeApp();
const REGION = "asia-south1";
setGlobalOptions({ region: REGION, maxInstances: 10, memory: "256MiB" });

const deps = () => ({
  db: getFirestore(),
  messaging: getMessaging(),
  bucket: getStorage().bucket(),
  now: () => Date.now(),
  serverTimestamp: () => FieldValue.serverTimestamp(),
});

// A field post was created or changed: alert nearby people.
export const onFieldPostWritten = onDocumentWritten("fieldPosts/{postId}", async (event) => {
  const before = event.data?.before?.exists ? event.data.before.data() : null;
  const after = event.data?.after?.exists ? event.data.after.data() : null;
  const results = await processFieldPostWrite(deps(), event.params.postId, before, after);
  if (results.length) console.log("alerts", event.params.postId, JSON.stringify(results));
});

// New chat message (text, voice or photos): push to the other person.
export const onChatMessageCreated = onDocumentCreated("interactions/{interactionId}/messages/{messageId}", async (event) => {
  await processMessageCreated(deps(), event.params.interactionId, event.data?.data());
});

// Someone started a chat about a field post: tell the owner.
export const onFieldPostContacted = onDocumentCreated("interactions/{interactionId}", async (event) => {
  await processInteractionCreated(deps(), event.params.interactionId, event.data?.data());
});

// Every day at 7:30 am India time.
export const dailyJobs = onSchedule({ schedule: "30 7 * * *", timeZone: "Asia/Kolkata" }, async () => {
  const r = await runDailyJobs(deps());
  console.log("dailyJobs", JSON.stringify(r));
});

// Account deleted (from the app's Delete account): remove v62 data and files.
export const onUserDeleted = v1.region(REGION).auth.user().onDelete(async (user) => {
  const r = await deleteUserData(deps(), user.uid);
  console.log("deleted user data", user.uid, JSON.stringify(r));
});
