# JeevaMitra — One‑to‑One Contextual Messaging Architecture

## 0. Important: stack reality vs. the task brief

The original task brief was written as if JeevaMitra were a **Flutter** app (Riverpod,
`go_router`, Dart entities/repositories, Gen‑2 Cloud Functions, FCM, `flutter analyze`,
`flutter test`).

The **actual** repository is a **React 19 + Vite + Firebase (JavaScript/JSX)** web app,
packaged for Android with Capacitor. There is **no Flutter, no Dart, no Riverpod, no
`go_router`, no Cloud Functions folder, and no Firebase Cloud Messaging** in the project.

Per the brief's final rule ("inspect and reuse existing JeevaMitra code; do not invent
parallel authentication, navigation, notification, Firebase, or state‑management
systems"), this feature is implemented in the **real** architecture. The table below maps
each Flutter‑worded requirement to what was actually built.

| Brief (Flutter wording) | Actual JeevaMitra implementation |
| --- | --- |
| Riverpod providers | React hooks over Firestore realtime listeners (`useMessaging.js`) |
| `go_router` routes | `react-router-dom` routes in `src/App.jsx` (with existing `Protected` guard) |
| Domain/data/presentation layers | Existing convention: `src/features/<feature>/` + `<feature>Api.js` data module. Messaging lives in `src/features/messaging/`. Pure, testable logic is isolated in `messaging.logic.js`. |
| Dart immutable entities | Plain JS normalizer functions (`normalizeInteraction`, `normalizeMessage`) returning frozen objects |
| Gen‑2 Cloud Function `onMessageCreated` + FCM push | The project has **no** server/Functions and **no** FCM (documented in `README.md`). Reused the existing **client‑written `notifications` Firestore collection** — the same mechanism bookings already use — and extended notifications with a `type` and `link` so a tap deep‑links to the conversation. See §14. |
| `flutter analyze` / `flutter test` | `npm run lint` (oxlint) + `node --test` unit tests (no new test framework dependency added) |
| Firebase Emulator scenario | The repo ships no emulator config (`firebase.json` has only `firestore.rules`). Emulator tests are therefore out of scope; equivalent coverage is provided by unit tests + a live‑Firebase manual E2E in `docs/messaging-testing-guide.md`. |

Nothing about the existing auth, publication, navigation, notification, or Firestore
behaviour is changed or migrated. The Firebase project (`jeeva-575fd`) and Android package
(`com.jeevamitra.app`) are untouched.

## 1. Existing architecture that this feature reuses

- **Authentication**: `src/context/AuthContext.jsx` — `useAuth()` exposes `user` (Firebase
  Auth user) and `profile` (the `users/{uid}` Firestore doc). The authenticated uid is the
  single source of truth for the sender; the UI never supplies `senderId`.
- **User model**: `users/{uid}` = `{ name, phone, state, district, mandal, village,
  profileType, createdAt }`. Read via `getUserProfile(uid)` in `features/auth/profileApi.js`.
- **Publication ("Land") model**: `lands/{landId}` created by `landsApi.createLand` =
  `{ ownerId, title, village, district, acres, price, unit, description, amenities, lat,
  lng, photoUrl, bookedRanges, createdAt }`. `photoUrl` is the (compressed, in‑document)
  image. Read via `getLand(landId)`.
- **Publication detail screen**: `src/features/lands/LandDetail.jsx`. `ownerId` identifies
  the publisher; `isOwner = land.ownerId === user.uid` already gates owner‑only UI.
- **Data‑source pattern**: each feature owns a `*Api.js` that wraps Firestore; widgets call
  those functions rather than Firestore directly. Realtime uses `onSnapshot`; to avoid
  composite indexes the codebase queries by a single equality field and **sorts client‑side**
  (see `messagesApi.js`, `bookingsApi.js`).
- **State conventions**: React Context for cross‑cutting state (`AuthContext`,
  `LanguageContext`, `ToastContext`); local `useState` + `useEffect(onSnapshot)` inside
  screens for feature data. No external state‑management package (kept that way).
- **Routing**: `src/App.jsx` `<Routes>`; `Protected` wraps authenticated routes and
  redirects to `/login`.
- **Navigation**: `src/components/BottomNav.jsx` (tab bar) + `src/components/AppBar.jsx`
  (title/back + bell with `.badge-dot` unread indicator).
- **Notifications / "FCM"**: `features/notifications/notificationsApi.js` writes
  `notifications/{id}` docs client‑side; `NotificationsSheet.jsx` lists them. There is no
  push layer. Booking actions notify via `createNotification(recipientId, message)`.
- **Existing Cloud Functions**: none.
- **Existing security rules**: `firestore.rules` — per‑collection rules; a booking‑chat
  `messages` rule already duplicates `ownerId`/`requesterId` onto each message so access can
  be checked without a cross‑document read.
- **Theme / design system**: CSS tokens in `src/index.css` (`--pasture`, `--marigold`,
  `--paper-card`, `--line`, `.card`, `.empty-state`, `.badge-dot`, `.pill-*`) and the
  `Avatar` component. Reused throughout the messaging UI.
- **Reusable components**: `Avatar`, `AppBar`, `BottomNav`, `BottomSheet`, `ToastContext`.
- **i18n**: `src/i18n/translations.js` (`en`/`te`/`hi`) + `t(key)`.

## 2. Legacy chat code decision

`features/lands/BookingChat.jsx` + `messagesApi.js` + the top‑level `messages` collection
implement a **booking‑scoped** chat (keyed by `bookingId`, only after a booking exists). It
is **still wired** (route `/bookings/:id/chat`) and functional, so it is **not deleted**.
The new system is **publication‑scoped** (contact a publisher directly from a listing,
before any booking) and lives in a **separate `interactions` collection with a `messages`
subcollection**. The two do not conflict. Retiring the booking chat later would be a
follow‑up migration and is intentionally out of scope here.

## 3. Firestore data model

```
interactions/{interactionId}
interactions/{interactionId}/messages/{messageId}
```

Interaction document:

```jsonc
{
  "interactionType": "publication_contact",
  "contextType": "publication",
  "contextId": "<landId>",
  "requesterId": "<uid A>",
  "recipientId": "<uid B = land owner>",
  "publicationOwnerId": "<uid B>",
  "publicationTitle": "<land.title>",
  "publicationImageUrl": "<land.photoUrl | null>",
  "status": "active",
  "lastMessage": "<preview>",
  "lastMessageSenderId": "<uid>",
  "lastMessageAt": <serverTimestamp>,
  "requesterUnreadCount": 0,
  "recipientUnreadCount": 0,
  "createdAt": <serverTimestamp>,
  "updatedAt": <serverTimestamp>
}
```

Message document:

```jsonc
{
  "senderId": "<auth uid>",
  "receiverId": "<other participant>",
  "type": "text",
  "text": "<message>",
  "createdAt": <serverTimestamp>,
  "readAt": null,
  "status": "sent"
}
```

All timestamps use `serverTimestamp()`. `senderId` is always `auth.currentUser.uid`.

## 4. Interaction uniqueness (no duplicate conversations)

The interaction id is **deterministic**:

```
pub_<contextId>__req_<requesterId>__rec_<recipientId>
```

Because the id is fully derived from `(contextId, requesterId, recipientId)`, tapping
"Contact Publisher" any number of times always resolves to the **same** document.
`getOrCreatePublicationInteraction()` additionally runs inside a `runTransaction` that
creates the doc only if it does not already exist — so even simultaneous double‑taps cannot
create a duplicate. (Direction matters: A→B and B→A are distinct threads by design, which
matches "requester contacts recipient".)

## 5–7. Domain / data / providers (React mapping)

- **Pure logic / models** — `src/features/messaging/messaging.logic.js` (no Firebase import,
  unit‑tested): `interactionIdFor`, `validateMessageText`, `MAX_MESSAGE_LENGTH`,
  `unreadCountFor`, `otherParticipantId`, `normalizeInteraction`, `normalizeMessage`.
- **Data layer** — `src/features/messaging/messagingApi.js`: `getOrCreatePublicationInteraction`,
  `getInteraction`, `watchUserInteractions`, `watchInteraction`, `watchLatestMessages`,
  `fetchOlderMessages`, `sendTextMessage`, `markInteractionRead`, `watchTotalUnread`.
  All Firestore access is confined here.
- **"Providers"** — `src/features/messaging/useMessaging.js`: hooks
  `useUserInteractions`, `useInteraction`, `useMessages` (paginated + realtime),
  `useTotalUnread`, `useSendMessage` (idempotent send with sending/error/retry state).
  Every hook exposes `loading` / `data` / `empty` / `error` and disposes its listener on
  unmount.

## 8–9. UI

- `ConversationsScreen` → `/messages` (list; loading/empty/error/offline; pull‑to‑refresh
  affordance via a Refresh action).
- `ConversationScreen` → `/messages/:interactionId` (context card, paginated realtime
  message list, input with validation/sending/retry, read receipts on open).
- Widgets: `PublicationContextCard`, `MessageBubble`, `MessageInput`.

## 10. Contact Publisher

`LandDetail.jsx` gains a **Contact Publisher** button, shown only when the viewer is **not**
the owner (self‑contact is structurally impossible). On tap it calls
`getOrCreatePublicationInteraction({...})` and navigates to `/messages/:interactionId`.

## 12–13. Read receipts & unread counts

- Opening a conversation resets the current user's unread field
  (`requesterUnreadCount` if requester, else `recipientUnreadCount`) to `0` and stamps
  `readAt` on the incoming messages that were unread.
- Sending increments the **receiver's** unread field and updates `lastMessage*`.
- All count mutations run in a transaction with **concrete** numeric values so the security
  rules can validate them (see §16). V1 message status is `sent` → `read` (no typing
  indicator).

## 14. Notifications ("FCM" adaptation)

No push infrastructure exists. On send, `sendTextMessage` also writes a `notifications` doc
for the receiver via the existing `createNotification(recipientId, message, { type:
"new_message", link: "/messages/<interactionId>" })`. `NotificationsSheet` now navigates to
`link` on tap (deep‑link), reusing the existing notification UI. Senders are never notified.
Failures are swallowed (notifications are best‑effort, exactly like bookings).

## 16. Security rules (added to `firestore.rules`)

- `interactions/{id}` readable/updatable **only** by `requesterId` or `recipientId`.
- Create requires `requesterId == auth.uid` and `recipientId != auth.uid` (no self‑contact)
  and the correct `interactionType`/`contextType`.
- Update forbids changing identity/ownership fields (`requesterId`, `recipientId`,
  `publicationOwnerId`, `contextId`, `contextType`, `interactionType`, `createdAt`), and
  enforces that a participant may only **lower/keep their own** unread count and only
  **raise/keep the other party's** — so no one can tamper with the other side's badge.
- `interactions/{id}/messages/{mid}` readable only by the two participants; create requires
  `senderId == auth.uid` and the sender to be a participant; the receiver may set `readAt`/
  `status` (read receipts) but not rewrite content.
- All pre‑existing rules are preserved verbatim.

## 17. Indexes

Queries use single‑field equality only (`requesterId == uid`, `recipientId == uid`) and sort
client‑side; the message list uses a single `orderBy(createdAt)` within one subcollection.
**No composite indexes are required.** Documented in `docs/messaging-indexes.md`.

## 18. Offline / retry

Firestore's built‑in offline cache serves reads offline and queues writes. The message input
surfaces a **failed** state with a **Retry** action if a send rejects; the list keeps working
from cache. No second offline DB is introduced.

## 20. Message list performance

The conversation listens to only the latest `PAGE_SIZE` (40) messages
(`orderBy(createdAt,'desc')` + `limit`). Scrolling to the top loads the previous page via
`fetchOlderMessages(startAfter)`. History is never downloaded wholesale.

## 22/31. Developer QA screen

`/developer/messaging-qa`, rendered **only** when `import.meta.env.DEV` is true (never in the
production `vite build`). It shows auth status, current uid/name, connectivity, and lets a
developer pick one of their own lands, get/open an interaction with its owner, jump into the
conversation, and reset the current user's unread — without hand‑editing Firestore. It never
fabricates production users.

## 32. File organization (adapted to existing conventions)

```
src/features/messaging/
  messaging.logic.js        # pure, unit-tested
  messaging.logic.test.js   # node --test
  messagingApi.js           # Firestore data layer
  useMessaging.js           # hooks ("providers")
  ConversationsScreen.jsx   # /messages
  ConversationScreen.jsx    # /messages/:interactionId
  MessagingQA.jsx           # /developer/messaging-qa (DEV only)
  components/
    PublicationContextCard.jsx
    MessageBubble.jsx
    MessageInput.jsx
docs/
  messaging-architecture.md
  messaging-indexes.md
  messaging-testing-guide.md
```

## 34. Implementation order

Followed the brief's phase order, adapted to React (audit → logic/models → data layer →
interaction get/create → send/receive → hooks → list UI → conversation UI → Contact
Publisher → unread/read receipts → notifications → rules/indexes → QA screen → tests → lint/
build/manual E2E).
