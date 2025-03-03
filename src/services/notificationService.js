import { db } from '../firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    updateDoc,
    doc,
    deleteDoc,
    getDoc
} from 'firebase/firestore';

export const notificationService = {
    /**
     * Create a new notification for a user
     * @param {string} userId - The user ID to receive the notification
     * @param {Object} notificationData - The notification data
     * @returns {Promise<string>} - The ID of the created notification
     */
    async createNotification(userId, notificationData) {
        try {
            const notificationRef = collection(db, 'notifications');
            const notification = {
                userId,
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type || 'system',
                read: false,
                createdAt: serverTimestamp(),
                ...notificationData
            };

            const docRef = await addDoc(notificationRef, notification);
            return docRef.id;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    /**
     * Create a notification for a referral commission
     * @param {string} userId - The user ID receiving the commission
     * @param {number} amount - The amount of the commission
     * @param {string} currency - The currency of the commission
     * @param {string} fromUserId - The user ID who made the deposit
     * @returns {Promise<string>} - The ID of the created notification
     */
    async createCommissionNotification(userId, amount, currency, fromUserId) {
        try {
            // Get some details about the referral if available
            let fromUserName = 'A referred user';
            
            try {
                const userDoc = await getDoc(doc(db, 'users', fromUserId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    fromUserName = userData.displayName || userData.email.split('@')[0];
                }
            } catch (e) {
                console.error('Error getting referral user details:', e);
            }
            
            return await this.createNotification(userId, {
                title: 'Referral Commission Received',
                message: `You received a ${Math.round(amount * 100) / 100} ${currency} commission from ${fromUserName}'s deposit.`,
                type: 'commission',
                amount,
                currency,
                fromUserId,
                read: false
            });
        } catch (error) {
            console.error('Error creating commission notification:', error);
            throw error;
        }
    },

    /**
     * Get notifications for a user
     * @param {string} userId - The user ID
     * @param {number} limit - The maximum number of notifications to return
     * @returns {Promise<Array>} - Array of notifications
     */
    async getUserNotifications(userId, limitCount = 20) {
        try {
            const notificationsRef = collection(db, 'notifications');
            const q = query(
                notificationsRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            const notifications = [];
            
            snapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return notifications;
        } catch (error) {
            console.error('Error getting user notifications:', error);
            throw error;
        }
    },

    /**
     * Mark a notification as read
     * @param {string} notificationId - The notification ID
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async markAsRead(notificationId) {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await updateDoc(notificationRef, {
                read: true
            });
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    },

    /**
     * Delete a notification
     * @param {string} notificationId - The notification ID
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async deleteNotification(notificationId) {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await deleteDoc(notificationRef);
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    },

    /**
     * Get unread notification count for a user
     * @param {string} userId - The user ID
     * @returns {Promise<number>} - The count of unread notifications
     */
    async getUnreadCount(userId) {
        try {
            const notificationsRef = collection(db, 'notifications');
            const q = query(
                notificationsRef,
                where('userId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting unread notification count:', error);
            return 0;
        }
    }
}; 