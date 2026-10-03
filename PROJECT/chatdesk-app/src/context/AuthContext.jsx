
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const heartbeatRef = useRef(null);
  const profileUnsubRef = useRef(null);

  async function signup(email, password, name, role) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });

    const userData = {
      uid: user.uid,
      email,
      name,
      role,
      isOnline: true,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid), userData);
    setUserProfile(userData);
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          isOnline: false,
          lastSeen: new Date().toISOString()
        });
      } catch (_) {}
    }
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (profileUnsubRef.current) profileUnsubRef.current();
    setUserProfile(null);
    return signOut(auth);
  }

  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);

    async function goOnline() {
      try {
        await updateDoc(userRef, {
          isOnline: true,
          lastSeen: new Date().toISOString()
        });
      } catch (_) {}
    }

    async function goOffline() {
      try {
        await updateDoc(userRef, {
          isOnline: false,
          lastSeen: new Date().toISOString()
        });
      } catch (_) {}
    }

    goOnline();
    heartbeatRef.current = setInterval(goOnline, 30000);

    const onVis = () => {
      if (document.visibilityState === 'visible') goOnline();
      else goOffline();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', goOffline);

    return () => {
      clearInterval(heartbeatRef.current);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', goOffline);
      goOffline();
    };
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
        profileUnsubRef.current = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          if (snap.exists()) setUserProfile(snap.data());
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (profileUnsubRef.current) profileUnsubRef.current();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    loading
  };

  return (
<AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}