import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/init";
import { isCurrentUserAdmin } from "../features/vets/vetsApi";

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

  async function signup({ email, password, name, state, district, mandal, village, profileType }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userDoc = {
      name,
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
  async function saveProfile({ name, state, district, mandal, village }) {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { name, state, district, mandal, village }, { merge: true });
    setProfile((p) => ({ ...(p || {}), name, state, district, mandal, village }));
  }

  const value = { user, profile, isAdmin, loading, signup, login, logout, updateProfileType, saveProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
