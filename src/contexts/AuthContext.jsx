import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null));
    return unsub;
  }, []);

  // Look up the email stored for this username in Firestore, then sign in.
  const loginWithUsername = async (username, password) => {
    const snap = await getDoc(doc(db, 'admins', username));
    if (!snap.exists()) throw new Error('no-user');
    const { email } = snap.data();
    if (!email) throw new Error('no-email');
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      // Surface the Firebase error code so LoginPage can show a useful message
      throw new Error(err.code ?? 'auth/unknown');
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loginWithUsername, logout, isAdmin: !!user, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
