import { getFirestore } from 'firebase-admin/firestore';
import { DocumentData } from 'firebase-admin/firestore';

export class FirebaseService {
  private static db: ReturnType<typeof getFirestore> | null = null;

  private static getDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  static async createUserProfile(userId: string, data: any): Promise<void> {
    try {
      await this.getDb().collection('user_profiles').doc(userId).set({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error: unknown) {
      console.error('Error creating user profile:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create user profile');
    }
  }

  static async getUserProfile(userId: string): Promise<DocumentData | undefined> {
    try {
      const doc = await this.getDb().collection('user_profiles').doc(userId).get();
      return doc.exists ? doc.data() : undefined;
    } catch (error: unknown) {
      console.error('Error getting user profile:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get user profile');
    }
  }

  static async updateUserProfile(userId: string, data: any): Promise<void> {
    try {
      await this.getDb().collection('user_profiles').doc(userId).update({
        ...data,
        updatedAt: new Date()
      });
    } catch (error: unknown) {
      console.error('Error updating user profile:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update user profile');
    }
  }

  static async deleteUserProfile(userId: string): Promise<void> {
    try {
      await this.getDb().collection('user_profiles').doc(userId).delete();
    } catch (error: unknown) {
      console.error('Error deleting user profile:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete user profile');
    }
  }

  static async addNotification(userId: string, notification: {
    title: string;
    message: string;
    type: string;
  }): Promise<void> {
    try {
      await this.getDb().collection('user_profiles').doc(userId).collection('notifications').add({
        ...notification,
        read: false,
        createdAt: new Date()
      });
    } catch (error: unknown) {
      console.error('Error adding notification:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add notification');
    }
  }

  static async getNotifications(userId: string): Promise<Array<DocumentData & { id: string }>> {
    try {
      const snapshot = await this.getDb()
        .collection('user_profiles')
        .doc(userId)
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error: unknown) {
      console.error('Error getting notifications:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get notifications');
    }
  }

  static async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await this.getDb()
        .collection('user_profiles')
        .doc(userId)
        .collection('notifications')
        .doc(notificationId)
        .update({ read: true });
    } catch (error: unknown) {
      console.error('Error marking notification as read:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to mark notification as read');
    }
  }
} 