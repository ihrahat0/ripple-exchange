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
import { DEFAULT_COINS } from '../utils/constants';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  async function signup(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Initialize balances for all coins
      const initialBalances = {};
      Object.keys(DEFAULT_COINS).forEach(coin => {
        initialBalances[coin] = DEFAULT_COINS[coin].initialBalance || 0;
      });
      
      // Initialize user document with all balances and bonus
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        emailVerified: false,
        balances: initialBalances,
        // Add a bonus that can only be used for liquidation protection
        bonusAccount: {
          amount: 100, // $100 bonus for liquidation protection
          currency: 'USDT',
          isActive: true,
          canWithdraw: false,
          canTrade: false,
          purpose: 'liquidation_protection',
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          description: 'Welcome bonus - protects your deposits from liquidation'
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
        // Initialize balances for all coins
        const initialBalances = {};
        Object.keys(DEFAULT_COINS).forEach(coin => {
          initialBalances[coin] = DEFAULT_COINS[coin].initialBalance || 0;
        });
        
        // Create new user document for Google sign-in
        await setDoc(userDocRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          emailVerified: true,
          balances: initialBalances,
          // Add a bonus that can only be used for liquidation protection
          bonusAccount: {
            amount: 100, // $100 bonus for liquidation protection
            currency: 'USDT',
            isActive: true,
            canWithdraw: false,
            canTrade: false,
            purpose: 'liquidation_protection',
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            description: 'Welcome bonus - protects your deposits from liquidation'
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

  // Check email verification status from Firestore
  async function checkEmailVerificationStatus(user) {
    if (!user) return false;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.emailVerified === true;
      }
      return false;
    } catch (error) {
      console.error('Error checking email verification status:', error);
      return false;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check email verification status from Firestore
        const isVerified = await checkEmailVerificationStatus(user);
        setIsEmailVerified(isVerified);
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setIsEmailVerified(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isEmailVerified,
    signup,
    login,
    loginWithGoogle,
    logout,
    checkAdminStatus,
    isUserAdmin,
    checkEmailVerificationStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 