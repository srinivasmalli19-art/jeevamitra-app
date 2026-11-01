// DEVELOPMENT/TEST ONLY. Stand-in for "firebase/storage": files are kept as
// data URLs in localStorage so another tab (the other chat user) can load them.
const KEY = "fakeStorage";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
export const getStorage = () => ({ __storage: true });
export const ref = (_s, path) => ({ fullPath: path });
export async function uploadBytes(r, blob, meta) {
  const url = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });
  const all = read();
  all[r.fullPath] = { url, contentType: meta?.contentType || blob.type, size: blob.size };
  localStorage.setItem(KEY, JSON.stringify(all));
  window.__fakeStorageLog = [...(window.__fakeStorageLog || []), { path: r.fullPath, contentType: meta?.contentType, size: blob.size }];
  return { ref: r };
}
export async function getDownloadURL(r) {
  const f = read()[r.fullPath];
  if (!f) throw Object.assign(new Error("not found"), { code: "storage/object-not-found" });
  return f.url;
}
export async function deleteObject(r) {
  const all = read();
  if (!all[r.fullPath]) throw Object.assign(new Error("not found"), { code: "storage/object-not-found" });
  delete all[r.fullPath];
  localStorage.setItem(KEY, JSON.stringify(all));
}
window.__fakeStorage = { list: () => Object.keys(read()), info: (p) => read()[p] };
