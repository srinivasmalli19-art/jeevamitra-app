// In-memory stand-in for firebase-admin Firestore / Messaging / Storage (tests only).
export function makeFakeDb(initial = {}) {
  const data = new Map(Object.entries(initial)); // "col/id" or "col/id/sub/id" -> object
  const snap = (path) => {
    const v = data.get(path);
    return { id: path.split("/").pop(), exists: v !== undefined, data: () => (v === undefined ? undefined : structuredClone(v)), ref: docRef(path) };
  };
  function docRef(path) {
    return {
      path,
      id: path.split("/").pop(),
      get: async () => snap(path),
      set: async (v, o) => { data.set(path, o?.merge ? { ...(data.get(path) || {}), ...v } : structuredClone(v)); },
      update: async (v) => { if (!data.has(path)) throw new Error("NOT_FOUND " + path); data.set(path, { ...data.get(path), ...v }); },
      delete: async () => { data.delete(path); },
      collection: (name) => colRef(`${path}/${name}`),
    };
  }
  function colRef(path, filters = [], order = null, start = null, end = null) {
    const run = () => {
      const prefix = path + "/";
      let rows = [...data.keys()].filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes("/")).map(snap);
      for (const [f, v] of filters) rows = rows.filter((r) => r.data()[f] === v);
      if (order) {
        rows = rows.filter((r) => r.data()[order] !== undefined).sort((a, b) => (a.data()[order] < b.data()[order] ? -1 : 1));
        if (start !== null) rows = rows.filter((r) => r.data()[order] >= start);
        if (end !== null) rows = rows.filter((r) => r.data()[order] <= end);
      }
      return { docs: rows, size: rows.length, empty: rows.length === 0 };
    };
    return {
      doc: (id) => docRef(`${path}/${id ?? Math.random().toString(36).slice(2)}`),
      add: async (v) => { const r = docRef(`${path}/${Math.random().toString(36).slice(2)}`); await r.set(v); return r; },
      where: (f, op, v) => { if (op !== "==") throw new Error("fake: only =="); return colRef(path, [...filters, [f, v]], order, start, end); },
      orderBy: (f) => colRef(path, filters, f, start, end),
      startAt: (v) => colRef(path, filters, order, v, end),
      endAt: (v) => colRef(path, filters, order, start, v),
      get: async () => run(),
    };
  }
  return {
    data,
    collection: (name) => colRef(name),
    runTransaction: async (fn) => {
      const writes = [];
      const tx = { get: async (ref) => ref.get(), set: (ref, v) => writes.push(() => ref.set(v)), update: (ref, v) => writes.push(() => ref.update(v)) };
      const out = await fn(tx);
      for (const w of writes) await w();
      return out;
    },
    dump: (prefix) => Object.fromEntries([...data.entries()].filter(([k]) => k.startsWith(prefix))),
  };
}

export function makeFakeMessaging({ badTokens = [] } = {}) {
  const sent = [];
  return {
    sent,
    send: async (msg) => {
      if (badTokens.includes(msg.token)) throw Object.assign(new Error("gone"), { code: "messaging/registration-token-not-registered" });
      sent.push(msg);
      return "id";
    },
  };
}

export function makeFakeBucket(names) {
  const files = new Set(names);
  return {
    files,
    getFiles: async ({ prefix }) => [[...files].filter((n) => n.startsWith(prefix)).map((name) => ({ name, delete: async () => files.delete(name) }))],
  };
}
