import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Initialize user document with default balance
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        balances: {
          USDT: 10000, // Default 10,000 USDT
          BTC: 0,
          ETH: 0
        }
      });
      
      return userCredential;
    } catch (error) {
      console.error('Error in signup:', error);
      throw error;
    }
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user document exists
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user document for Google sign-in
        await setDoc(userDocRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          balances: {
            USDT: 10000, // Default 10,000 USDT
            BTC: 0,
            ETH: 0
          },
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          authProvider: 'google'
        });
      } else {
        // Update last login
        await updateDoc(userDocRef, {
          lastLogin: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in Google login:', error);
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  async function checkAdminStatus(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() && userDoc.data().role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  async function isUserAdmin() {
    try {
      if (!currentUser) return false;
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      return userDoc.exists() && userDoc.data().role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    checkAdminStatus,
    isUserAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 