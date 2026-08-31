import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/init";
import { isCurrentUserAdmin } from "../features/vets/vetsApi";
import { listMyLands, deleteLand } from "../features/lands/landsApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // firebase auth user
  const [profile, setProfile] = useState(null); // our users/{uid} doc
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setProfile(snap.exists() ? snap.data() : null);
        setIsAdmin(await isCurrentUserAdmin(firebaseUser.uid));
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signup({ email, password, name, phone, state, district, mandal, village, profileType }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userDoc = {
      name,
      phone,
      state,
      district,
      mandal,
      village,
      profileType, // 'livestock' | 'land' | 'both'
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", cred.user.uid), userDoc);
    setProfile(userDoc);
    return cred.user;
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    return signOut(auth);
  }

  async function updateProfileType(profileType) {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { profileType }, { merge: true });
    setProfile((p) => ({ ...p, profileType }));
  }

  // Saves name/village/district. Uses merge so it also REPAIRS accounts
  // whose profile document never got created (e.g. if signup failed
  // partway through before Firestore rules were fixed).
  async function saveProfile({ name, phone, state, district, mandal, village }) {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { name, phone, state, district, mandal, village }, { merge: true });
    setProfile((p) => ({ ...(p || {}), name, phone, state, district, mandal, village }));
  }

  // Permanently deletes the account: re-authenticates (Firebase requires a
  // recent login for sensitive operations like this), removes the user's
  // own land listings, their profile doc, then the auth account itself.
  // Doesn't cascade-delete bookings/notifications/alerts they're party to —
  // same simplification the rest of the app already makes (e.g. deleting a
  // land doesn't clean up bookings against it either).
  async function deleteAccount(password) {
    if (!user) return;
    const cred = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(auth.currentUser, cred);
    const myLands = await listMyLands(user.uid);
    await Promise.all(myLands.map((l) => deleteLand(l.id)));
    await deleteDoc(doc(db, "users", user.uid));
    await deleteUser(auth.currentUser);
  }

  const value = { user, profile, isAdmin, loading, signup, login, logout, updateProfileType, saveProfile, deleteAccount };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
