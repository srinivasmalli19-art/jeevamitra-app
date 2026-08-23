# JeevaMitra — real app (v1: Auth + Lands + Bookings)

This is a working React + Firebase app — real login, real database, real
booking-conflict prevention. It's not the visual prototype anymore; it's
the actual codebase.

## What's built so far
- Email/password signup & login (writes a `users/{uid}` profile doc)
- Post / browse / view land listings (`lands` collection)
- Request a booking, and owners can accept / reject it
- **Real double-booking prevention**: accepting a booking runs inside a
  Firestore transaction that re-checks the land's confirmed date ranges
  before confirming — two people can't get the same dates even if they
  click at the same time.
- Profile screen with the Livestock Owner / Fodder Land Provider / Both
  switcher (matches the "Universal Access" rule — it only reorders things
  later, doesn't restrict features)

## What's NOT built yet (next milestones)
- Vets directory
- Disease alerts
- Maps / geolocation ("nearby" is not calculated yet — it lists everything)
- Notifications
- Photo uploads (Firebase Storage)
- Phone-number auth (currently email/password only)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Open `src/firebase/config.js` and replace the placeholder values with
   your real Firebase project's web app config (Firebase console → Project
   settings → Your apps → Web app → SDK setup and configuration).

3. In the Firebase console, make sure these are turned on:
   - **Authentication** → Sign-in method → Email/Password → Enable
   - **Firestore Database** → Create database → start in test mode

4. Run it locally:
   ```
   npm run dev
   ```
   Open the printed `localhost` URL in your browser.

5. Build for deployment:
   ```
   npm run build
   ```
   This produces a `dist/` folder you can host anywhere (Firebase Hosting,
   Netlify, Vercel, etc).

## Firestore Security Rules

Test mode / `if request.auth != null` for everything leaves your database
too open once real users touch it. Go to Firestore → Rules in the Firebase
console, replace everything with this, and click Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Each user can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Anyone signed in can browse lands. Only the owner can create,
    // edit, or delete their own listing. A special case lets ANY signed-in
    // user update just the `bookedRanges` field, because both the owner
    // (accepting a request) and the requester (cancelling a confirmed
    // booking) need to touch that field — see note below.
    match /lands/{landId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.ownerId == request.auth.uid;
      allow update: if request.auth != null
                    && (
                      resource.data.ownerId == request.auth.uid
                      || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['bookedRanges'])
                    );
      allow delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
    }

    // A booking is only visible/actionable by its requester or the land owner
    match /bookings/{bookingId} {
      allow read: if request.auth != null
                  && (resource.data.requesterId == request.auth.uid
                      || resource.data.ownerId == request.auth.uid);
      allow create: if request.auth != null
                    && request.resource.data.requesterId == request.auth.uid;
      allow update: if request.auth != null
                    && (resource.data.ownerId == request.auth.uid
                        || resource.data.requesterId == request.auth.uid);
      allow delete: if false;
    }
    // Any signed-in user can read alerts (public safety info). Only the
    // reporter can create one under their own name, and only they can
    // update it (used for withdrawing).
    match /alerts/{alertId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.reporterId == request.auth.uid;
      allow update: if request.auth != null
                    && resource.data.reporterId == request.auth.uid;
      allow delete: if false;
    }

    // Any signed-in user can browse the vet directory. Only an admin
    // (see the admins/{uid} check) can add, edit, or remove entries —
    // this keeps the directory curated instead of self-registered.
    match /vets/{vetId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Admin allowlist. Nobody can write to this from the app — you add
    // admins manually from the Firebase console's Firestore Data tab.
    match /admins/{adminId} {
      allow read: if request.auth != null && request.auth.uid == adminId;
      allow write: if false;
    }

    // Notifications: only the recipient can read, mark-read, or delete
    // their own notifications. Any signed-in user can CREATE one for
    // someone else — that's how the app tells the other party in a
    // booking that something happened, since there's no server to do
    // it automatically. Low risk: a notification is just a text message,
    // not something that grants access to anything.
    match /notifications/{notifId} {
      allow read: if request.auth != null && resource.data.recipientId == request.auth.uid;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.recipientId == request.auth.uid;
    }
  }
}
```

**Known trade-off:** the `bookedRanges` exception on `lands` means any
signed-in user can technically edit that one field on someone else's land
document (not the rest of it). This is a common, pragmatic limitation for
apps without a server-side function layer. The proper long-term fix is to
move booking accept/cancel logic into a **Cloud Function** that runs with
admin privileges and validates the request server-side — worth doing
before a real public launch, but reasonable to defer for now.

## Photos: how they're stored (and why)

Photos for lands and vets are **compressed in the browser and stored as
part of the Firestore document itself** — not in Firebase Storage.

This was a deliberate choice: Firebase Storage now requires upgrading to
the paid "Blaze" plan (which means linking a credit card) even to turn it
on at all, even though actual usage for an app this size would cost $0.
To avoid that requirement, photos are resized and compressed down to a
small JPEG and saved as a data URL string directly on the `lands` or
`vets` document.

**Trade-offs to know about:**
- Firestore documents have a hard 1MB size limit, so this only supports
  **one, fairly compressed photo per listing** — not a full-resolution
  gallery.
- If you later want multiple higher-quality photos per listing, revisit
  Firebase Storage (once ready to add billing) or a free third-party
  image host — either is a small, self-contained change since photo
  storage is isolated to `src/utils/image.js`.

## Android app (via Capacitor)

This project is wrapped with **Capacitor**, which packages the same React
web app into a real, installable Android app — no rewrite. The app ID is
`com.jeevamitra.app`, and the Android project lives in `android/`.

**Why Capacitor instead of Flutter/React Native:** this reuses 100% of the
already-working, tested code (Firebase, security rules, every screen)
instead of a from-scratch rewrite in a different language. For a
forms-and-lists app like this (not a game or animation-heavy app), there's
no real performance downside — and it keeps the exact same debugging
workflow (same terminal commands, same React code) rather than requiring
an entirely new toolchain.

### One-time setup (do this once)

1. Install **Android Studio** (free): https://developer.android.com/studio
2. Open Android Studio at least once and let it finish its first-time
   setup (it downloads the Android SDK automatically).

### Every time you want to build/test the Android app

```
npm run android:sync
```
This builds the web app fresh and copies it into the Android project.
Then:
```
npm run android:open
```
This opens the project in Android Studio. From there:
- Plug your Android phone in via USB (enable "Developer options" →
  "USB debugging" on the phone first), or use Android Studio's built-in
  emulator.
- Click the green ▶ Run button. It installs and launches the real app.

### Permissions already configured

`android/app/src/main/AndroidManifest.xml` already declares the
permissions this app needs:
- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` — for "nearby" search,
  directions, and tagging a land/alert with GPS coordinates.
- `CAMERA` — for taking a photo directly when posting a land or vet.

These use the same web APIs (`navigator.geolocation`, a file input with
`capture`) as the browser version, which generally work fine inside
Android's WebView. If location or camera prompts don't behave reliably on
a real device once you test, the fix is to switch to the official
`@capacitor/geolocation` and `@capacitor/camera` plugins, which handle
Android permissions more robustly — a contained change, not a rewrite.

### iOS

Deliberately not set up yet. Rural Indian farmers overwhelmingly use
Android; iOS needs a Mac, Xcode, and a $99/year Apple Developer account —
not worth it until there's real demand. Adding it later is
`npx cap add ios` on a Mac — same low-effort pattern as Android.

### Publishing to the Play Store (when ready)

Not needed for personal/device testing (the steps above sideload a
working app directly). When ready for the public: a one-time $25 Google
Play Developer account, then Android Studio can generate a signed release
build to upload. Ask when you're at that point — it's a distinct process
from everyday development.


