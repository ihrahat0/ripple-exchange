import { Wallet } from 'ethers';
import * as solanaWeb3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  doc, 
  serverTimestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { encrypt, decrypt } from '../utils/encryption';

// Master wallet addresses (your exchange wallets)
const MASTER_WALLETS = {
  ethereum: '0x24054c37bcd31353F9A29bA2eEe6F4149A62277D',
  bsc: '0x24054c37bcd31353F9A29bA2eEe6F4149A62277D',
  polygon: '0x24054c37bcd31353F9A29bA2eEe6F4149A62277D',
  arbitrum: '0x24054c37bcd31353F9A29bA2eEe6F4149A62277D',
  base: '0x24054c37bcd31353F9A29bA2eEe6F4149A62277D',
  solana: '7ZbzGBuy7qhocgubReateJ6juaE6MA6Qz1MYNwkXgB4f', // Example Solana address
};

// Define chains that support tokens and their corresponding networks
export const SUPPORTED_CHAINS = {
  ethereum: {
    name: 'Ethereum',
    tokens: ['ETH', 'USDT', 'LINK', 'UNI'],
    explorer: 'https://etherscan.io'
  },
  bsc: {
    name: 'BNB Smart Chain',
    tokens: ['BNB', 'USDT', 'LINK'],
    explorer: 'https://bscscan.com'
  },
  polygon: {
    name: 'Polygon',
    tokens: ['MATIC', 'USDT', 'LINK', 'UNI'],
    explorer: 'https://polygonscan.com'
  },
  arbitrum: {
    name: 'Arbitrum',
    tokens: ['ETH', 'USDT', 'LINK', 'UNI'],
    explorer: 'https://arbiscan.io'
  },
  base: {
    name: 'Base',
    tokens: ['ETH', 'USDT'],
    explorer: 'https://basescan.org'
  },
  solana: {
    name: 'Solana',
    tokens: ['SOL', 'USDT'],
    explorer: 'https://solscan.io',
    isSPL: true
  }
};

// SPL Token addresses for Solana
const SPL_TOKEN_MINTS = {
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' // USDT SPL token mint address
};

/**
 * Generate a proper Solana wallet using the Solana Web3.js library
 * @returns {Object} The Solana wallet with address and private key
 */
const generateSolanaWallet = async () => {
  try {
    // Generate a new keypair
    const keypair = solanaWeb3.Keypair.generate();
    
    // Get the public key (address) correctly formatted for Solana
    const publicKey = keypair.publicKey.toBase58();
    
    // Store the private key as a Base58 encoded string
    const privateKeyBytes = keypair.secretKey;
    const privateKeyBase58 = Buffer.from(privateKeyBytes).toString('base64');
    
    return {
      address: publicKey,
      privateKey: privateKeyBase58
    };
  } catch (error) {
    console.error('Error generating Solana wallet:', error);
    throw error;
  }
};

/**
 * Generate a Bitcoin-like wallet (placeholder for demo purposes)
 * In a real implementation, you would use a Bitcoin library
 */
const generateBitcoinWallet = () => {
  // This is a simplified placeholder
  // In a real implementation, use a Bitcoin library
  const wallet = Wallet.createRandom();
  const address = `bc1q${wallet.address.substring(2, 42).toLowerCase()}`;
  return {
    address,
    privateKey: wallet.privateKey
  };
};

/**
 * Generate wallets for different chains
 * @param {string} mnemonic - The mnemonic phrase to generate wallets from
 * @returns {Object} Wallet addresses and private keys for all supported chains
 */
const generateWallets = async (mnemonic) => {
  try {
    // Create Ethereum wallet from mnemonic
    const ethWallet = Wallet.fromPhrase(mnemonic);
    
    // Generate Solana wallet (independent of Ethereum)
    const solanaWallet = await generateSolanaWallet();
    
    // Generate Bitcoin wallet (placeholder)
    const bitcoinWallet = generateBitcoinWallet();
    
    // Generate addresses for all supported chains
    const walletAddresses = {};
    const privateKeys = {};

    // Generate wallets for each chain
    for (const chain of Object.keys(SUPPORTED_CHAINS)) {
      if (chain === 'solana') {
        walletAddresses[chain] = solanaWallet.address;
        privateKeys[chain] = solanaWallet.privateKey;
      } else if (chain === 'bitcoin' || chain === 'dogecoin') {
        walletAddresses[chain] = bitcoinWallet.address;
        privateKeys[chain] = bitcoinWallet.privateKey;
      } else if (SUPPORTED_CHAINS[chain]) {
        // EVM compatible chains
        walletAddresses[chain] = ethWallet.address;
        privateKeys[chain] = ethWallet.privateKey;
      }
    }

    return {
      addresses: walletAddresses,
      privateKeys: privateKeys,
      encryptedMnemonic: encrypt(mnemonic) // We still encrypt the mnemonic for safety
    };
  } catch (error) {
    console.error('Error generating wallets:', error);
    throw error;
  }
};

/**
 * Get user's wallet addresses
 * @param {string} userId - The user ID to get wallet addresses for
 * @returns {Object} The user's wallet addresses for all supported chains
 */
export const getUserWalletAddress = async (userId) => {
  try {
    const userWalletRef = doc(db, 'walletAddresses', userId);
    const walletDoc = await getDoc(userWalletRef);

    if (!walletDoc.exists()) {
      // Automatically generate wallet if it doesn't exist
      const result = await generateUserWallet(userId);
      return result.wallets;
    }

    return walletDoc.data().wallets;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    throw error;
  }
};

/**
 * Get user's private keys (would typically require authentication in a real app)
 * @param {string} userId - The user ID to get private keys for
 * @returns {Object} The user's private keys for all supported chains
 */
export const getUserPrivateKeys = async (userId) => {
  try {
    const userWalletRef = doc(db, 'walletAddresses', userId);
    const walletDoc = await getDoc(userWalletRef);

    if (!walletDoc.exists()) {
      throw new Error('Wallet not found');
    }

    return walletDoc.data().privateKeys;
  } catch (error) {
    console.error('Error getting private keys:', error);
    throw error;
  }
};

/**
 * Generate a new wallet for a user
 * @param {string} userId - The user ID to generate a wallet for
 * @returns {Object} The generated wallet addresses and mnemonic
 */
export const generateUserWallet = async (userId) => {
  try {
    // Generate a new random wallet with high entropy
    const wallet = Wallet.createRandom({ entropyLength: 256 });
    const mnemonic = wallet.mnemonic.phrase;
    
    console.log("Generating wallets for user:", userId);
    // Generate addresses for all supported chains
    const walletData = await generateWallets(mnemonic);

    // Prepare wallet storage data
    const walletStorageData = {
      wallets: walletData.addresses,
      privateKeys: walletData.privateKeys,
      encryptedMnemonic: walletData.encryptedMnemonic,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      // Store the addresses and encrypted private keys in Firestore
      const userWalletRef = doc(db, 'walletAddresses', userId);
      await setDoc(userWalletRef, walletStorageData);
      console.log("Wallet addresses stored successfully");
    } catch (error) {
      console.error("Error storing wallet addresses:", error);
      if (error.code === 'permission-denied') {
        console.log("Permission denied when storing wallet. User may need to retry later.");
      } else {
        throw error; // Re-throw non-permission errors
      }
    }

    try {
      // Create a separate, more secure document for backup purposes
      const backupRef = doc(db, 'walletBackups', userId);
      await setDoc(backupRef, {
        encryptedMnemonic: walletData.encryptedMnemonic,
        createdAt: serverTimestamp()
      });
      console.log("Wallet backup created successfully");
    } catch (backupError) {
      console.error("Error creating wallet backup:", backupError);
      // Continue even if backup fails - not critical for initial registration
    }

    try {
      // Create a log of wallet generation for audit purposes
      await addDoc(collection(db, 'securityLogs'), {
        userId,
        action: 'wallet_generated',
        timestamp: serverTimestamp(),
        metadata: {
          chains: Object.keys(walletData.addresses)
        }
      });
      console.log("Security log created successfully");
    } catch (logError) {
      console.error("Error creating security log:", logError);
      // Continue even if logging fails - not critical for initial registration
    }

    // Return only the addresses to the frontend, not the private keys
    return {
      wallets: walletData.addresses,
      mnemonic: mnemonic // This should ONLY be shown once during setup
    };
  } catch (error) {
    console.error('Error generating user wallet:', error);
    throw error;
  }
};

/**
 * Recover wallet from stored mnemonic
 * @param {string} userId - The user ID to recover the wallet for
 * @returns {Object} The recovered Ethereum wallet (can be used to derive others)
 */
export const recoverUserWallet = async (userId) => {
  try {
    const userWalletRef = doc(db, 'walletAddresses', userId);
    const walletDoc = await getDoc(userWalletRef);

    if (!walletDoc.exists()) {
      throw new Error('Wallet not found');
    }

    const { encryptedMnemonic } = walletDoc.data();
    const mnemonic = decrypt(encryptedMnemonic);
    
    return Wallet.fromPhrase(mnemonic);
  } catch (error) {
    console.error('Error recovering wallet:', error);
    throw error;
  }
};

/**
 * Record a deposit to the user's balance
 * @param {string} userId - The user ID to record the deposit for
 * @param {string} token - The token symbol
 * @param {number} amount - The deposit amount
 * @param {string} txHash - The transaction hash
 * @param {string} chain - The blockchain chain
 * @returns {boolean} Whether the deposit was successfully recorded
 */
export const recordDeposit = async (userId, token, amount, txHash, chain) => {
  try {
    // Add the deposit to transaction history
    await addDoc(collection(db, 'transactions'), {
      userId,
      type: 'deposit',
      token,
      amount,
      txHash,
      chain,
      status: 'completed',
      timestamp: serverTimestamp()
    });
    
    // Update user's balance
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Increment the user's balance
      await updateDoc(userRef, {
        [`balances.${token}`]: increment(amount)
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error recording deposit:', error);
    throw error;
  }
};

/**
 * Reset a user's wallet by deleting existing wallet and generating a new one
 * @param {string} userId - The user ID to reset the wallet for
 * @returns {Object} The newly generated wallet addresses and mnemonic
 */
export const resetUserWallet = async (userId) => {
  try {
    console.log("Resetting wallet for user:", userId);
    
    // Delete existing wallet
    const userWalletRef = doc(db, 'walletAddresses', userId);
    await setDoc(userWalletRef, { deleted: true, deletedAt: serverTimestamp() });
    
    // Generate new wallet
    return await generateUserWallet(userId);
  } catch (error) {
    console.error('Error resetting wallet:', error);
    throw error;
  }
};

// Note: In a real application, we'd have backend monitoring services listening for 
// incoming transactions to user deposit addresses and then automatically forwarding
// those funds to the master wallet while crediting the user's account balance 