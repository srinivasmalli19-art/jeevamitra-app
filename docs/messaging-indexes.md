# Messaging — Firestore indexes

## Required composite indexes: **none**

The messaging feature is deliberately designed to avoid composite indexes,
consistent with the rest of JeevaMitra (see `messagesApi.js` / `bookingsApi.js`,
which also sort client-side).

### Conversation list

`watchUserInteractions(uid)` runs two **single-field equality** queries:

```js
query(collection(db, "interactions"), where("requesterId", "==", uid))
query(collection(db, "interactions"), where("recipientId", "==", uid))
```

Single-field equality queries are served by Firestore's automatic single-field
indexes. Results are merged and sorted by `lastMessageAt`/`updatedAt`
**client-side** (`mergeInteractions` / `sortInteractionsByRecent`), so there is no
`where + orderBy` combination that would require a composite index.

### Message list (pagination)

`watchLatestMessages` / `fetchOlderMessages` query a **single subcollection** with a
**single `orderBy`**:

```js
query(collection(db, "interactions", id, "messages"),
      orderBy("createdAt", "desc"), limit(40))            // latest page
      // + startAfter(lastDoc) for older pages
```

A single-field `orderBy` on `createdAt` uses the automatic single-field index. No
composite index is required.

## `firestore.indexes.json`

None needed. If a future change adds a query that combines an equality filter with
an `orderBy` on a different field (Firestore will surface a console link with the
exact index), add it here and to `firebase.json`. As of this feature, `firebase.json`
still only declares `firestore.rules`.
