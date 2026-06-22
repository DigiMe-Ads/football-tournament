import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';

const AuthContext = createContext(null);
const TOURNAMENT_STATUS_DOC = doc(db, 'tournament', 'global');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [tournamentOver, setTournamentOverState] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null));
    return unsub;
  }, []);

  // Global flag: when true, every admin edit/reset/backup control freezes.
  // Viewers are unaffected — this only gates the admin UI.
  useEffect(() => {
    const unsub = onSnapshot(TOURNAMENT_STATUS_DOC, snap => {
      setTournamentOverState(snap.data()?.over === true);
    });
    return unsub;
  }, []);

  const setTournamentOver = (over) =>
    setDoc(TOURNAMENT_STATUS_DOC, { over }, { merge: true });

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
    <AuthContext.Provider value={{
      user, loginWithUsername, logout, isAdmin: !!user, loading: user === undefined,
      tournamentOver, setTournamentOver,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
