import {
  collection, addDoc, doc, getDoc, getDocs, query, where, runTransaction,
  serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/init";
import { createNotification } from "../notifications/notificationsApi";

const bookingsCol = collection(db, "bookings");

// Notifications are a "nice to have" — if the notifications Firestore rule
// hasn't been published yet (or any other notification hiccup happens),
// that must NEVER stop the real booking action from succeeding. This
// wrapper swallows any notification error so it can't break bookings.
async function tryNotify(recipientId, message) {
  try {
    await createNotification(recipientId, message);
  } catch (err) {
    console.warn("Notification skipped (this is safe to ignore):", err.message);
  }
}

function rangesOverlap(aFrom, aTo, bFrom, bTo) {
  // date strings are 'YYYY-MM-DD' so string comparison works
  return aFrom <= bTo && bFrom <= aTo;
}

/**
 * Request a booking. This does NOT block the dates yet — it only
 * blocks them once the owner accepts (see acceptBooking below).
 * This mirrors the spec: owners review requests, then accept/reject.
 */
export async function requestBooking({ landId, landTitle, ownerId, requesterId, requesterName, from, to }) {
  const docRef = await addDoc(bookingsCol, {
    landId, landTitle, ownerId, requesterId, requesterName,
    from, to, status: "pending", createdAt: serverTimestamp(),
  });
  await tryNotify(ownerId, `${requesterName} requested to book "${landTitle}" (${from} → ${to}).`);
  return docRef.id;
}

/**
 * Accept a booking request. This is the critical section: it re-checks
 * the land's confirmed bookedRanges for a real conflict *inside* a
 * Firestore transaction, so two owners (or double-clicks) can't both
 * confirm overlapping dates. If a conflict is found, it throws instead
 * of silently succeeding.
 */
export async function acceptBooking(bookingId, booking) {
  const landRef = doc(db, "lands", booking.landId);
  const bookingRef = doc(db, "bookings", bookingId);

  await runTransaction(db, async (tx) => {
    const landSnap = await tx.get(landRef);
    if (!landSnap.exists()) throw new Error("Land no longer exists.");
    const land = landSnap.data();
    const ranges = land.bookedRanges || [];

    const conflict = ranges.some((r) => rangesOverlap(r.from, r.to, booking.from, booking.to));
    if (conflict) {
      throw new Error("These dates were just booked by someone else. Please reject or propose new dates.");
    }

    tx.update(landRef, {
      bookedRanges: [...ranges, { from: booking.from, to: booking.to, bookingId }],
    });
    tx.update(bookingRef, { status: "confirmed" });
  });

  await tryNotify(booking.requesterId, `Your booking for "${booking.landTitle}" was accepted (${booking.from} → ${booking.to}).`);
}

export async function rejectBooking(bookingId, booking) {
  await updateDoc(doc(db, "bookings", bookingId), { status: "rejected" });
  await tryNotify(booking.requesterId, `Your booking request for "${booking.landTitle}" was declined.`);
}

export async function cancelBooking(bookingId, booking) {
  // If it was confirmed, free up the blocked range on the land too.
  if (booking.status === "confirmed") {
    const landRef = doc(db, "lands", booking.landId);
    await runTransaction(db, async (tx) => {
      const landSnap = await tx.get(landRef);
      if (!landSnap.exists()) return;
      const ranges = (landSnap.data().bookedRanges || []).filter((r) => r.bookingId !== bookingId);
      tx.update(landRef, { bookedRanges: ranges });
    });
  }
  await updateDoc(doc(db, "bookings", bookingId), { status: "cancelled" });
  // Notify whichever side didn't initiate the cancellation. We don't
  // reliably know who clicked cancel here, so this notifies both —
  // harmless since it's just an FYI message either way.
  await tryNotify(booking.ownerId, `The booking for "${booking.landTitle}" (${booking.from} → ${booking.to}) was cancelled.`);
  await tryNotify(booking.requesterId, `The booking for "${booking.landTitle}" (${booking.from} → ${booking.to}) was cancelled.`);
}

export async function getBooking(bookingId) {
  const snap = await getDoc(doc(db, "bookings", bookingId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listMyBookings(requesterId) {
  const snap = await getDocs(query(bookingsCol, where("requesterId", "==", requesterId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// All bookings against this owner's lands — pending ones need Accept/Reject,
// confirmed ones surface the requester's contact details (see Bookings.jsx).
export async function listBookingRequestsForOwner(ownerId) {
  const snap = await getDocs(query(bookingsCol, where("ownerId", "==", ownerId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
