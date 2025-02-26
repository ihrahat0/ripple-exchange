import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const adminService = {
  async makeUserAdmin(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: 'admin'
      });
      return true;
    } catch (error) {
      console.error('Error making user admin:', error);
      return false;
    }
  }
}; 