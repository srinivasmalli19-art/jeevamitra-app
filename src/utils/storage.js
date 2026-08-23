import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/init";

// Uploads a single image file and returns its public download URL.
// folder should be something like "lands" or "vets" — path becomes
// {folder}/{ownerUid}/{timestamp}-{filename}, which keeps uploads
// organized and matches the Storage security rules (owner-scoped writes).
export async function uploadPhoto(file, folder, ownerUid) {
  if (!file) return null;
  const path = `${folder}/${ownerUid}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
