// DEVELOPMENT/TEST ONLY. In-memory stand-in for "firebase/firestore", used by
// vite.harness.config.js so the whole app can be clicked through in a browser
// without touching the live project. Data is shared between tabs of the same
// browser through localStorage (so two "users" can chat).
const KEY = "fakeFirestore";
const listeners = new Set();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
let data = load();
function save() {
  localStorage.setItem(KEY, JSON.stringify(data));
  notify();
}
function notify() { for (const l of [...listeners]) l(); }
window.addEventListener("storage", (e) => { if (e.key === KEY) { data = load(); notify(); } });

// ---- timestamps -----------------------------------------------------------
class Ts {
  constructor(ms) { this.ms = ms; this.seconds = Math.floor(ms / 1000); }
  toMillis() { return this.ms; }
  toDate() { return new Date(this.ms); }
}
const SERVER_TS = { __serverTimestamp: true };
export const serverTimestamp = () => SERVER_TS;
function encode(v) {
  if (v === SERVER_TS || v?.__serverTimestamp) return { __ts: Date.now() };
  if (v instanceof Ts) return { __ts: v.ms };
  if (Array.isArray(v)) return v.map(encode);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)]));
  return v;
}
function decode(v) {
  if (v && typeof v === "object" && "__ts" in v) return new Ts(v.__ts);
  if (Array.isArray(v)) return v.map(decode);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decode(x)]));
  return v;
}

// ---- refs -----------------------------------------------------------------------
export function getFirestore() { return { __db: true }; }
export function connectFirestoreEmulator() {}
const autoId = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
function joinPath(base, segs) { return [base, ...segs].filter(Boolean).join("/"); }

export function collection(parent, ...segs) {
  const path = joinPath(parent.__db ? "" : parent.path, segs);
  return { type: "collection", path, id: path.split("/").pop() };
}
export function doc(parent, ...segs) {
  let path;
  if (parent.type === "collection") path = joinPath(parent.path, segs.length ? segs : [autoId()]);
  else path = joinPath(parent.__db ? "" : parent.path, segs);
  return { type: "doc", path, id: path.split("/").pop(), parentPath: path.split("/").slice(0, -1).join("/") };
}
function snapOf(ref) {
  const raw = data[ref.path];
  return { id: ref.id, ref, exists: () => raw !== undefined, data: () => (raw === undefined ? undefined : decode(raw)) };
}

// ---- queries -------------------------------------------------------------------
export const where = (field, op, value) => ({ kind: "where", field, op, value });
export const orderBy = (field, dir = "asc") => ({ kind: "orderBy", field, dir });
export const limit = (n) => ({ kind: "limit", n });
export const startAfter = (snap) => ({ kind: "startAfter", snap });
export const query = (col, ...cons) => ({ type: "query", col, cons });

function val(o, f) { const v = o[f]; return v instanceof Ts ? v.ms : v; }
function runQuery(q) {
  const col = q.type === "collection" ? q : q.col;
  const cons = q.type === "collection" ? [] : q.cons;
  const prefix = col.path + "/";
  let rows = Object.keys(data)
    .filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes("/"))
    .map((p) => snapOf(doc({ __db: true }, p)));
  for (const c of cons.filter((x) => x.kind === "where")) {
    rows = rows.filter((s) => {
      const v = val(s.data(), c.field);
      switch (c.op) {
        case "==": return v === c.value;
        case "!=": return v !== c.value;
        case ">=": return v >= c.value;
        case "<=": return v <= c.value;
        case ">": return v > c.value;
        case "<": return v < c.value;
        case "array-contains": return Array.isArray(v) && v.includes(c.value);
        default: throw new Error("fake firestore: op " + c.op);
      }
    });
  }
  for (const o of cons.filter((x) => x.kind === "orderBy").reverse()) {
    rows.sort((a, b) => {
      const av = val(a.data(), o.field) ?? 0;
      const bv = val(b.data(), o.field) ?? 0;
      return (av > bv ? 1 : av < bv ? -1 : 0) * (o.dir === "desc" ? -1 : 1);
    });
  }
  const sa = cons.find((x) => x.kind === "startAfter");
  if (sa) rows = rows.slice(rows.findIndex((r) => r.id === sa.snap.id) + 1);
  const lim = cons.find((x) => x.kind === "limit");
  if (lim) rows = rows.slice(0, lim.n);
  return { docs: rows, empty: rows.length === 0, size: rows.length, forEach: (fn) => rows.forEach(fn) };
}

// ---- reads / writes --------------------------------------------------------------
const tick = () => new Promise((r) => setTimeout(r, 15));
export async function getDoc(ref) { await tick(); return snapOf(ref); }
export async function getDocs(q) { await tick(); return runQuery(q); }
export async function setDoc(ref, value, opts = {}) {
  await tick();
  data[ref.path] = opts.merge ? { ...(data[ref.path] || {}), ...encode(value) } : encode(value);
  save();
}
export async function addDoc(col, value) { const ref = doc(col); await setDoc(ref, value); return ref; }
export async function updateDoc(ref, patch) {
  await tick();
  if (data[ref.path] === undefined) throw Object.assign(new Error("No document to update: " + ref.path), { code: "not-found" });
  data[ref.path] = { ...data[ref.path], ...encode(patch) };
  save();
}
export async function deleteDoc(ref) { await tick(); delete data[ref.path]; save(); }

export function onSnapshot(target, onNext) {
  const fire = () => onNext(target.type === "doc" ? snapOf(target) : runQuery(target));
  listeners.add(fire);
  setTimeout(fire, 10);
  return () => listeners.delete(fire);
}

export async function runTransaction(_db, fn) {
  const writes = [];
  const tx = {
    get: async (ref) => snapOf(ref),
    set: (ref, v, o) => { writes.push(() => { data[ref.path] = o?.merge ? { ...(data[ref.path] || {}), ...encode(v) } : encode(v); }); return tx; },
    update: (ref, v) => { writes.push(() => { data[ref.path] = { ...data[ref.path], ...encode(v) }; }); return tx; },
    delete: (ref) => { writes.push(() => { delete data[ref.path]; }); return tx; },
  };
  const result = await fn(tx);
  writes.forEach((w) => w());
  save();
  return result;
}
export function writeBatch() {
  const writes = [];
  return {
    set: (ref, v) => writes.push(() => { data[ref.path] = encode(v); }),
    update: (ref, v) => writes.push(() => { data[ref.path] = { ...data[ref.path], ...encode(v) }; }),
    delete: (ref) => writes.push(() => { delete data[ref.path]; }),
    commit: async () => { writes.forEach((w) => w()); save(); },
  };
}

// Test hooks
window.__fakeDb = {
  dump: () => JSON.parse(JSON.stringify(data)),
  put: (path, value) => { data[path] = encode(value); save(); },
  reset: () => { data = {}; save(); },
};
