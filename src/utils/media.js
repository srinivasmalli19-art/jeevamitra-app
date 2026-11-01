// v62 media helpers: compress photos on the phone and upload photos / voice
// recordings to Firebase Storage. (Existing land photos keep using
// utils/image.js, which stores a small data URL in Firestore; unchanged.)
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase/init";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // must match storage.rules
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // must match storage.rules

/**
 * Resize to at most `maxSide` px on the long side and re-encode as JPEG.
 * Lowers quality step by step until the file is under ~450 KB, so uploads
 * stay quick on weak rural networks.
 */
export function compressImageToBlob(file, { maxSide = 1280, targetBytes = 450 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error("No photo selected.")); return; }
    if (!/^image\//.test(file.type || "image/")) { reject(new Error("That file is not a photo.")); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read that photo.")); };
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      let quality = 0.78;
      let blob = await toBlob(canvas, quality);
      while (blob && blob.size > targetBytes && quality > 0.4) {
        quality -= 0.1;
        blob = await toBlob(canvas, quality);
      }
      if (!blob) { reject(new Error("Couldn't process that photo.")); return; }
      if (blob.size > MAX_IMAGE_BYTES) { reject(new Error("That photo is too large even after compression.")); return; }
      resolve({ blob, width: canvas.width, height: canvas.height });
    };
    img.src = url;
  });
}

function toBlob(canvas, quality) {
  return new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
}

function safeName(ext) {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/** Uploads a blob under `folder` and returns { path, url }. */
export async function uploadBlob(folder, blob, contentType) {
  const ext = contentType.startsWith("audio/") ? (contentType.includes("mp4") || contentType.includes("aac") ? "m4a" : "webm") : "jpg";
  const path = `${folder}/${safeName(ext)}`;
  const r = ref(storage, path);
  await uploadBytes(r, blob, { contentType });
  return { path, url: await getDownloadURL(r) };
}

export async function deleteStoragePath(path) {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    // Already gone is fine; anything else is logged but never blocks the caller.
    if (err?.code !== "storage/object-not-found") console.warn("Storage delete skipped:", err?.code || err?.message);
  }
}
