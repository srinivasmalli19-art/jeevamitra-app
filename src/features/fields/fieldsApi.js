// Firestore data layer for v62 field posts (collection `fieldPosts`).
// Same conventions as the rest of the app: single-field queries only (no
// composite indexes), sorting and filtering on the phone.
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/init";
import { uploadBlob, deleteStoragePath } from "../../utils/media";
import { buildPostDoc, validatePost, isListed, herdMovedEnough, geohashFor, OWNER_STATUSES, STATUS, KIND } from "./fields.logic";

const postsCol = collection(db, "fieldPosts");
const postRef = (id) => doc(db, "fieldPosts", id);

/** Reserve an id before uploading photos, so files live under the post's folder. */
export function newPostId() {
  return doc(postsCol).id;
}

export function mediaFolder(ownerId, postId) {
  return `fieldPosts/${ownerId}/${postId}`;
}

export async function uploadPostPhoto(ownerId, postId, blob) {
  return uploadBlob(mediaFolder(ownerId, postId), blob, "image/jpeg");
}

export async function uploadPostVoice(ownerId, postId, blob, mimeType) {
  return uploadBlob(mediaFolder(ownerId, postId), blob, mimeType || blob.type || "audio/webm");
}

/** Creates (or fully replaces, when editing) a post. Throws with the first validation key. */
export async function savePost({ postId, kind, form, user, profile, isEdit }) {
  const errors = validatePost(kind, form);
  const keys = Object.keys(errors);
  if (keys.length) {
    const err = new Error(errors[keys[0]]);
    err.fieldErrors = errors;
    throw err;
  }
  const body = buildPostDoc(kind, form);
  if (isEdit) {
    await updateDoc(postRef(postId), {
      ...body,
      ...(kind === KIND.HERD ? { locationUpdatedAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    });
    return postId;
  }
  await setDoc(postRef(postId), {
    ...body,
    ownerId: user.uid,
    ownerName: profile?.name || "",
    ownerPhone: profile?.phone || "",
    status: STATUS.AVAILABLE,
    hidden: false,
    ...(kind === KIND.HERD ? { locationUpdatedAt: serverTimestamp() } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return postId;
}

export async function getPost(id) {
  const snap = await getDoc(postRef(id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function watchPost(id, onData, onError) {
  return onSnapshot(postRef(id), (s) => onData(s.exists() ? { id: s.id, ...s.data() } : null), (e) => onError?.(e));
}

/** Browse list for one kind: only listed posts (not hidden / full / expired). */
export async function listPosts(kind) {
  // hidden == false lets the security rules prove the query is allowed.
  // Two equality filters are served by single-field indexes (no composite index).
  const snap = await getDocs(query(postsCol, where("kind", "==", kind), where("hidden", "==", false)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => isListed(p));
}

export async function listMyPosts(uid) {
  const snap = await getDocs(query(postsCol, where("ownerId", "==", uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setPostStatus(id, status) {
  if (!OWNER_STATUSES.includes(status)) throw new Error("Unknown status.");
  await updateDoc(postRef(id), { status, updatedAt: serverTimestamp() });
}

/** Deletes the post and its photos / voice note. */
export async function deletePost(post) {
  const paths = [...(post.photos || []).map((p) => p.path), post.voiceNote?.path].filter(Boolean);
  await deleteDoc(postRef(post.id));
  await Promise.all(paths.map(deleteStoragePath));
}

/**
 * Updates a herd post's location if it moved at least 1 km (or always when
 * `force`, i.e. the "My herd is here now" button). Returns true if saved.
 */
export async function updateHerdLocation(post, { lat, lng }, { force = false } = {}) {
  if (post.kind !== KIND.HERD) return false;
  if (!force && !herdMovedEnough(post, { lat, lng })) return false;
  await updateDoc(postRef(post.id), {
    lat, lng, geohash: geohashFor(lat, lng),
    locationUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return true;
}
