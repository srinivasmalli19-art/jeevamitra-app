// DEVELOPMENT/TEST ONLY. Stand-in for "firebase/auth". The signed-in user is
// per tab (sessionStorage `fakeUid`), so two tabs can be two different users.
const subs = new Set();
const current = () => {
  const uid = sessionStorage.getItem("fakeUid");
  return uid ? { uid, email: `${uid}@test.local` } : null;
};
const auth = { get currentUser() { return current(); } };
export const getAuth = () => auth;
export const connectAuthEmulator = () => {};
export function onAuthStateChanged(_a, cb) {
  subs.add(cb);
  setTimeout(() => cb(current()), 0);
  return () => subs.delete(cb);
}
const emit = () => subs.forEach((cb) => cb(current()));
export async function signInWithEmailAndPassword(_a, email) {
  sessionStorage.setItem("fakeUid", email.split("@")[0]);
  emit();
  return { user: current() };
}
export const createUserWithEmailAndPassword = signInWithEmailAndPassword;
export async function signOut() { sessionStorage.removeItem("fakeUid"); emit(); }
export const EmailAuthProvider = { credential: (email, password) => ({ email, password }) };
export async function reauthenticateWithCredential() {}
export async function deleteUser() { sessionStorage.removeItem("fakeUid"); emit(); }
