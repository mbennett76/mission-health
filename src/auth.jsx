// Sign-in, first-login password change, and the signed-in person's profile (role, zones).
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword, sendPasswordResetEmail,
  createUserWithEmailAndPassword, getAuth,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db, PREVIEW, ADMIN_EMAIL, firebaseConfig } from './firebase.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const PREVIEW_PROFILE = { uid: 'preview', email: ADMIN_EMAIL, name: 'Preview', role: 'admin', active: true, myZones: [] };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(PREVIEW ? { uid: 'preview' } : undefined); // undefined = still checking
  const [profile, setProfile] = useState(PREVIEW ? PREVIEW_PROFILE : null);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    if (PREVIEW) return;
    let unsubProfile = () => {};
    const unsub = onAuthStateChanged(auth, async u => {
      unsubProfile();
      setUser(u || null);
      setProfile(null);
      setProblem('');
      if (!u) return;
      const ref = doc(db, 'users', u.uid);
      // Bootstrap: the admin's first sign-in creates their own record.
      if (u.email?.toLowerCase() === ADMIN_EMAIL) {
        const snap = await getDoc(ref).catch(() => null);
        if (snap && !snap.exists()) {
          await setDoc(ref, { email: ADMIN_EMAIL, name: 'Marc', role: 'admin', active: true, mustChangePassword: false, myZones: [] });
        }
      }
      unsubProfile = onSnapshot(ref, s => {
        if (!s.exists()) { setProblem('This account has not been given access yet. Ask Marc to add you.'); return; }
        const p = { uid: u.uid, ...s.data() };
        if (!p.active) { setProblem('Access for this account has been turned off.'); setProfile(null); return; }
        setProfile(p);
      }, () => setProblem('Could not load your access. Check your connection and try again.'));
    });
    return () => { unsub(); unsubProfile(); };
  }, []);

  const value = {
    user, profile, problem,
    isAdmin: profile?.role === 'admin',
    canEdit: ['admin', 'editor'].includes(profile?.role),
    signIn: (email, pw) => signInWithEmailAndPassword(auth, email.trim(), pw),
    signOut: () => (PREVIEW ? null : signOut(auth)),
    resetMyPassword: email => sendPasswordResetEmail(auth, email.trim()),
    async changePassword(pw) {
      await updatePassword(auth.currentUser, pw);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { mustChangePassword: false });
    },
    async updateMe(values) {
      if (PREVIEW) { setProfile(p => ({ ...p, ...values })); return; }
      await updateDoc(doc(db, 'users', profile.uid), values);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ---- Admin helpers ----
// Creating an account normally signs you in as that person, so we use a separate, temporary Firebase instance.
export async function adminCreateUser({ email, name, role, tempPassword }) {
  const second = initializeApp(firebaseConfig, 'create-user-' + Date.now());
  try {
    const cred = await createUserWithEmailAndPassword(getAuth(second), email.trim(), tempPassword);
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: email.trim().toLowerCase(), name, role, active: true, mustChangePassword: true, myZones: [],
    });
    await signOut(getAuth(second));
  } finally {
    await deleteApp(second);
  }
}
export const adminSendReset = email => sendPasswordResetEmail(auth, email);
export const adminUpdateUser = (uid, values) => updateDoc(doc(db, 'users', uid), values);
