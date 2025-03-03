import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  serverTimestamp,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { referralService } from './referralService';

const MASTER_WALLETS = {
  arbitrum: '0x4F54cF379B087C8c800B73c958F5dE6225C46F5d',
  ethereum: '0x4F54cF379B087C8c800B73c958F5dE6225C46F5d',
  bsc: '0x4F54cF379B087C8c800B73c958F5dE6225C46F5d',
  polygon: '0x4F54cF379B087C8c800B73c958F5dE6225C46F5d',
  solana: 'DxXnPZvjgc8QdHYzx4BGwvKCs9GbxdkwVZSUvzKVPktr'
};

export const monitorDeposits = (userId, onDepositDetected) => {
  // Set up real-time listener for pending deposits
  const pendingDepositsQuery = query(
    collection(db, 'pendingDeposits'),
    where('userId', '==', userId)
  );

  return onSnapshot(pendingDepositsQuery, async (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const deposit = change.doc.data();
        await processDeposit(deposit, userId, onDepositDetected);
      }
    });
  });
};

export const processDeposit = async (deposit, userId, onDepositDetected) => {
  try {
    const { amount, token, chain, txHash } = deposit;

    // 1. Record the transaction
    await addDoc(collection(db, 'transactions'), {
      userId,
      type: 'deposit',
      amount,
      token,
      chain,
      txHash,
      status: 'completed',
      timestamp: serverTimestamp(),
      masterWallet: MASTER_WALLETS[chain]
    });

    // 2. Update user's balance
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`balances.${token}`]: increment(amount)
    });

    // 3. Process referral commission (10%)
    await referralService.processReferralCommission(userId, amount);

    // 4. Remove from pending deposits
    await updateDoc(doc(db, 'pendingDeposits', deposit.id), {
      status: 'completed',
      processedAt: serverTimestamp()
    });

    // 5. Notify the UI
    if (onDepositDetected) {
      onDepositDetected({
        type: 'success',
        message: `Successfully deposited ${amount} ${token}`,
        details: {
          amount,
          token,
          chain,
          txHash
        }
      });
    }

  } catch (error) {
    console.error('Error processing deposit:', error);
    if (onDepositDetected) {
      onDepositDetected({
        type: 'error',
        message: 'Error processing deposit. Please contact support.',
        error
      });
    }
  }
};

export const createPendingDeposit = async (userId, depositData) => {
  try {
    const { amount, token, chain, txHash } = depositData;

    // Create pending deposit
    await addDoc(collection(db, 'pendingDeposits'), {
      userId,
      amount,
      token,
      chain,
      txHash,
      status: 'pending',
      createdAt: serverTimestamp(),
      masterWallet: MASTER_WALLETS[chain]
    });

    return true;
  } catch (error) {
    console.error('Error creating pending deposit:', error);
    return false;
  }
};

export const getDepositAddress = (chain) => {
  return MASTER_WALLETS[chain];
};

export const validateDeposit = (amount, token, chain) => {
  // Add validation logic here
  if (!amount || amount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }

  if (!token) {
    return { valid: false, error: 'Token not specified' };
  }

  if (!chain || !MASTER_WALLETS[chain]) {
    return { valid: false, error: 'Invalid chain' };
  }

  return { valid: true };
}; 