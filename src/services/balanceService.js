import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

// Default coins to ensure all users have these initialized
const DEFAULT_COINS = {
  BTC: 0,
  ETH: 0,
  BNB: 0,
  LINK: 0,
  USDT: 0,
  MATIC: 0,
  SOL: 0,
  DOGE: 0,
  SHIB: 0,
  RIPPLEX: 0
};

/**
 * Fetches and initializes a user's balances
 * @param {string} userId - The user ID to fetch balances for
 * @returns {Promise<Object>} - The user's balances
 */
export const fetchBalances = async (userId) => {
  if (!userId) {
    const auth = getAuth();
    userId = auth.currentUser?.uid;
    
    if (!userId) {
      console.error('No user ID provided and no authenticated user');
      return DEFAULT_COINS;
    }
  }
  
  try {
    console.log("Fetching balances for user:", userId);
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log("User document exists in Firestore");
      const currentBalances = userDoc.data().balances || {};
      const updatedBalances = { ...DEFAULT_COINS };
      
      // Preserve existing balance values
      Object.keys(currentBalances).forEach(coin => {
        updatedBalances[coin] = currentBalances[coin];
      });
      
      // Check if we need to update the database (if any coins were added)
      const needsUpdate = Object.keys(updatedBalances).some(
        coin => !(coin in currentBalances)
      );
      
      if (needsUpdate) {
        // Update the user document with complete balance set
        try {
          await updateDoc(userRef, {
            balances: updatedBalances,
            updatedAt: serverTimestamp()
          });
          console.log("Updated user balances in Firestore with missing coins");
        } catch (updateError) {
          console.error("Error updating balances in Firestore:", updateError);
          if (updateError.code === 'permission-denied') {
            console.warn("Permission denied when updating balance - check Firebase rules");
          }
        }
      } else {
        console.log("No new coins to add to user's balances");
      }
      
      return updatedBalances;
    } else {
      console.log("User document doesn't exist, creating default balances");
      // If user doc doesn't exist, create default balances
      const defaultBalances = { ...DEFAULT_COINS };
      
      // Try to create a user document with default balances
      try {
        const auth = getAuth();
        await setDoc(userRef, {
          email: auth.currentUser?.email || '',
          displayName: auth.currentUser?.displayName || '',
          balances: defaultBalances,
          createdAt: serverTimestamp(),
          emailVerified: auth.currentUser?.emailVerified || false
        });
        console.log("Created new user document with default balances");
      } catch (setError) {
        console.error("Error creating user document with balances:", setError);
        if (setError.code === 'permission-denied') {
          console.warn("Permission denied when creating user document - check Firebase rules");
        }
      }
      
      return defaultBalances;
    }
  } catch (error) {
    console.error('Error fetching balances:', error);
    // Return default balances object as fallback
    return { ...DEFAULT_COINS };
  }
};

/**
 * Updates a specific token balance for a user
 * @param {string} userId - The user ID to update balances for
 * @param {string} token - The token symbol to update
 * @param {number} amount - The amount to update (positive to add, negative to subtract)
 * @returns {Promise<boolean>} - Success indicator
 */
export const updateTokenBalance = async (userId, token, amount) => {
  if (!userId || !token) {
    console.error('Missing userId or token for balance update');
    return false;
  }
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentBalances = userDoc.data().balances || {};
      const currentAmount = currentBalances[token] || 0;
      const newAmount = currentAmount + amount;
      
      // Prevent negative balances
      if (newAmount < 0) {
        console.warn(`Attempted to set negative balance for ${token}. Operation denied.`);
        return false;
      }
      
      await updateDoc(userRef, {
        [`balances.${token}`]: newAmount,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Updated ${token} balance for user ${userId}: ${currentAmount} -> ${newAmount}`);
      return true;
    } else {
      console.error('User document not found');
      return false;
    }
  } catch (error) {
    console.error('Error updating token balance:', error);
    return false;
  }
};

export default {
  fetchBalances,
  updateTokenBalance,
  DEFAULT_COINS
}; 