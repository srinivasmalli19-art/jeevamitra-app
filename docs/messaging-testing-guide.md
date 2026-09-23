# JeevaMitra — Messaging manual testing guide

This feature talks to the **live** Firebase project (`jeeva-575fd`) — there is no emulator
config in the repo. Test with two real accounts.

## Accounts & setup

You need **two** signed-in users and **one** publication:

- **User B (publisher)** — owns a land listing (the "publication").
- **User A (requester)** — a different account that will contact User B.

Create them via the normal signup flow (language picker → "Create an account"). Have User B
post a land from **Lands → My lands → Post new land**.

Two sessions on one machine: use a normal window for User A and an **incognito** window for
User B (Firebase Auth persists per browser profile).

## Local run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pure-logic unit tests (node --test)
npm run lint
npm run build    # production build (the /developer/messaging-qa route is stripped)
```

## Core end-to-end scenario

1. **A → login**, open **Lands**, open User B's publication.
2. **A → Contact publisher** (button on the land detail page). A conversation opens at
   `/messages/:interactionId`. The header shows User B; the **Publication context card** shows
   the listing with **View publication**.
3. **A → send** `Is this publication still available?`
   - Bubble is right-aligned/green with a single ✓ (sent).
4. **B → notification**: open the **bell** on Home. There is a **New message …** row with a
   `›`. Tapping it deep-links to `/messages/:interactionId` (same interaction).
5. **B → conversation**: B sees A's message (left/incoming). Opening it **resets B's unread**
   and stamps read receipts.
6. **B → reply** `Yes, it is still available.`
7. **A → receives reply** in real time; A's original message now shows **✓✓** (read).

## Checks

- **Unread badge**: before B opens the thread, B's **Messages** tab shows a badge; the
  conversation row shows a count. Both clear to zero after B opens it.
- **Read status**: outgoing ✓ → ✓✓ once the other side opens the thread.
- **Duplicate Contact Publisher**: tap **Contact publisher** several times from A → always the
  **same** `interactionId` (deterministic id + transaction). No duplicate threads appear in
  either user's list.
- **Self-contact**: while viewing your **own** publication, **Contact publisher is not shown**
  (owner sees Delete + booking-management UI only).
- **Offline**: toggle DevTools → Network → Offline. The list/thread keep rendering from cache
  and show the offline banner; a queued send flushes on reconnect.
- **Failed send / retry**: force an error (e.g. offline + send, or temporarily tighten rules)
  → the composer shows **Message failed to send** with **Retry**.
- **App restart**: reload the page mid-conversation — history and unread state reload from
  Firestore.
- **Validation**: empty/whitespace-only input keeps **Send** disabled; text is trimmed; a
  2000-char cap is enforced (`MAX_MESSAGE_LENGTH`).
- **Pagination**: in a thread with >40 messages, only the latest 40 load; **Load older
  messages** fetches the previous page.

## Unauthorized-access check (security rules)

As **User C** (a third account that is neither participant), attempt to read the interaction
or its messages:

```js
// In the browser console of a User C session:
import("firebase/firestore").then(async (fs) => {
  const { db } = await import("/src/firebase/init.js");
  try { await fs.getDoc(fs.doc(db, "interactions", "<A_B_interactionId>")); console.log("READ OK (unexpected)"); }
  catch (e) { console.log("DENIED as expected:", e.code); }
});
```

Expected: `permission-denied`. Likewise, User C cannot create a message under that interaction,
and neither participant can change the other's unread count or the interaction's identity
fields (enforced in `firestore.rules`).

## Developer QA screen (debug builds only)

Run `npm run dev` and open **`/developer/messaging-qa`** (this route does **not** exist in a
production `vite build`). It shows auth/connectivity status and lets you pick one of another
user's publications, get/open the interaction, jump into the conversation, and reset your own
unread — without editing Firestore by hand. Full two-party messaging still uses two accounts as
above.

## Deploying the updated security rules

The new `interactions` rules ship in `firestore.rules`. Publish them with the existing process
(Firebase Console → Firestore → Rules → paste/Publish, or `firebase deploy --only
firestore:rules`). Until they are published, reads/writes to `interactions` will be denied and
the messaging UI will show its error/empty states (it fails safe, exactly like the existing
notifications flow).
