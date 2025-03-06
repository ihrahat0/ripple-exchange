import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_COINS } from '../utils/constants';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Add a function to check if an email is already used and verified
  async function isEmailVerifiedAndRegistered(email) {
    try {
      // Query users collection to find documents with the provided email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      // If no documents found, email is not registered
      if (querySnapshot.empty) {
        return false;
      }
      
      // Check if any of the found documents has a verified email
      for (const docSnapshot of querySnapshot.docs) {
        const userData = docSnapshot.data();
        if (userData.emailVerified === true) {
          return true; // Found a verified account with this email
        }
      }
      
      // If we found documents but none are verified, we can allow registration
      return false;
    } catch (error) {
      console.error('Error checking email verification status:', error);
      // In case of error, assume email is not registered to avoid blocking registration
      return false;
    }
  }

  async function signup(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email,
        emailVerified: false,
        createdAt: serverTimestamp(),
      });

      setIsEmailVerified(false);

      return user;
    } catch (error) {
      console.error('Error in signup:', error);
      throw error;
    }
  }

  async function verifyEmail(uid) {
    await updateDoc(doc(db, 'users', uid), { emailVerified: true });
    setIsEmailVerified(true);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithVerification(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if the user's email is verified
      const isVerified = await checkEmailVerificationStatus(user);
      
      if (!isVerified) {
        // Email not verified, sign out and throw error
        await signOut(auth);
        throw new Error('Please verify your email before logging in.');
      }
      
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
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
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setIsEmailVerified(userDoc.data()?.emailVerified || false);
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
    verifyEmail,
    login,
    loginWithVerification,
    loginWithGoogle,
    logout,
    checkAdminStatus,
    isUserAdmin,
    checkEmailVerificationStatus,
    isEmailVerifiedAndRegistered
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 