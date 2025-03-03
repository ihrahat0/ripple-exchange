import { db } from '../firebase';
import { 
    doc, 
    collection, 
    getDoc, 
    setDoc, 
    updateDoc, 
    arrayUnion, 
    increment,
    query,
    where,
    getDocs,
    serverTimestamp
} from 'firebase/firestore';
import { notificationService } from './notificationService';

export const referralService = {
    /**
     * Generate a referral code for a user
     * @param {string} userId - The user ID
     * @param {string} username - The username to include in referral link
     * @returns {Promise<string>} - The generated referral code
     */
    async generateReferralCode(userId, username) {
        try {
            // Check if user already has a referral code
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // If user already has a referral code, return it
                if (userData.referralCode) {
                    return userData.referralCode;
                }
                
                // Generate a new referral code based on username and a random string
                const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
                const sanitizedUsername = (username || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const referralCode = `${sanitizedUsername}-${randomStr}`;
                
                // Update user with the new referral code
                await updateDoc(userRef, {
                    referralCode,
                    referralLink: `https://rippleexchange.org/register?ref=${referralCode}`,
                    referralStats: {
                        totalReferrals: 0,
                        activeReferrals: 0,
                        totalCommission: 0,
                        lastUpdated: serverTimestamp()
                    }
                });
                
                return referralCode;
            }
            
            throw new Error('User not found');
        } catch (error) {
            console.error('Error generating referral code:', error);
            throw error;
        }
    },

    /**
     * Register a new referral
     * @param {string} referrerCode - The referrer's code
     * @param {string} newUserId - The new user's ID
     * @returns {Promise<boolean>} - Whether the referral was successful
     */
    async registerReferral(referrerCode, newUserId) {
        try {
            if (!referrerCode || !newUserId) {
                return false;
            }
            
            // Find the referrer by their code
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('referralCode', '==', referrerCode));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                console.error('No user found with referral code:', referrerCode);
                return false;
            }
            
            const referrerDoc = querySnapshot.docs[0];
            const referrerId = referrerDoc.id;
            
            // Make sure the referrer is not referring themselves
            if (referrerId === newUserId) {
                console.error('User cannot refer themselves');
                return false;
            }
            
            const referrerRef = doc(db, 'users', referrerId);
            const newUserRef = doc(db, 'users', newUserId);
            
            // Update the referrer's stats
            await updateDoc(referrerRef, {
                'referralStats.totalReferrals': increment(1),
                'referralStats.activeReferrals': increment(1),
                'referrals': arrayUnion({
                    userId: newUserId,
                    date: serverTimestamp(),
                    status: 'active'
                })
            });
            
            // Update the new user with referrer info
            await updateDoc(newUserRef, {
                referredBy: referrerId,
                referralCode: referrerCode,
                joinedViaReferral: true
            });
            
            return true;
        } catch (error) {
            console.error('Error registering referral:', error);
            return false;
        }
    },

    /**
     * Process commission for a deposit made by a referred user
     * @param {string} userId - The user who made the deposit
     * @param {number} depositAmount - The deposit amount
     * @returns {Promise<boolean>} - Whether commission was processed successfully
     */
    async processReferralCommission(userId, depositAmount) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                return false;
            }
            
            const userData = userDoc.data();
            
            // Check if user was referred by someone
            if (userData.referredBy) {
                const referrerId = userData.referredBy;
                const referrerRef = doc(db, 'users', referrerId);
                const referrerDoc = await getDoc(referrerRef);
                
                if (referrerDoc.exists()) {
                    // Calculate commission (10% of deposit)
                    const commission = depositAmount * 0.10;
                    
                    // Add commission to referrer's balance
                    await updateDoc(referrerRef, {
                        'balances.USDT': increment(commission),
                        'referralStats.totalCommission': increment(commission),
                        'referralCommissions': arrayUnion({
                            fromUserId: userId,
                            amount: commission,
                            depositAmount,
                            date: serverTimestamp()
                        })
                    });
                    
                    // Record the commission in a transactions collection for tracking
                    const transactionRef = doc(collection(db, 'transactions'));
                    await setDoc(transactionRef, {
                        type: 'referral_commission',
                        fromUserId: userId,
                        toUserId: referrerId,
                        amount: commission,
                        currency: 'USDT',
                        depositAmount,
                        createdAt: serverTimestamp(),
                        status: 'completed'
                    });
                    
                    // Create a notification for the referrer
                    await notificationService.createCommissionNotification(
                        referrerId,
                        commission,
                        'USDT',
                        userId
                    );
                    
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error processing referral commission:', error);
            return false;
        }
    },

    /**
     * Get referral stats for a user
     * @param {string} userId - The user ID
     * @returns {Promise<object>} - Referral statistics
     */
    async getReferralStats(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            const userData = userDoc.data();
            
            // Check if user has referral stats
            if (!userData.referralStats) {
                // Initialize with default values
                const defaultStats = {
                    totalReferrals: 0,
                    activeReferrals: 0,
                    totalCommission: 0,
                    lastUpdated: serverTimestamp()
                };
                
                // Update user with default stats
                await updateDoc(userRef, {
                    referralStats: defaultStats,
                    referralCode: userData.referralCode || await this.generateReferralCode(userId, userData.displayName)
                });
                
                return {
                    ...defaultStats,
                    referrals: [],
                    referralCode: userData.referralCode,
                    referralLink: userData.referralLink || `https://rippleexchange.org/register?ref=${userData.referralCode}`
                };
            }
            
            // Get list of referrals
            let referrals = [];
            if (userData.referrals && userData.referrals.length > 0) {
                referrals = userData.referrals;
            }
            
            // Get list of commissions
            let commissions = [];
            if (userData.referralCommissions && userData.referralCommissions.length > 0) {
                commissions = userData.referralCommissions;
            }
            
            return {
                stats: userData.referralStats,
                referrals,
                commissions,
                referralCode: userData.referralCode,
                referralLink: userData.referralLink || `https://rippleexchange.org/register?ref=${userData.referralCode}`
            };
        } catch (error) {
            console.error('Error getting referral stats:', error);
            throw error;
        }
    }
}; 