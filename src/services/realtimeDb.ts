import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database, auth } from '../lib/firebase';

export interface UserActivity {
  isOnline: boolean;
  lastSeen: number;
  lastActivity: string;
}

export interface OnlineUser {
  uid: string;
  isOnline: boolean;
  lastSeen: number;
  lastActivity: string;
}

export const realtimeDbService = {
  // Update current user's online status
  updateOnlineStatus: async (isOnline: boolean) => {
    if (!auth.currentUser) return;
    
    const uid = auth.currentUser.uid;
    const userRef = ref(database, `onlineUsers/${uid}`);
    const activityRef = ref(database, `userActivity/${uid}`);
    
    const now = Date.now();
    const lastActivity = isOnline ? 'Online now' : 'Offline';
    
    try {
      // Update online status
      await set(userRef, {
        uid,
        isOnline,
        lastSeen: now,
        lastActivity
      });
      
      // Update user activity
      await set(activityRef, {
        isOnline,
        lastSeen: now,
        lastActivity
      });
      
      console.log('Online status updated:', isOnline);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  },

  // Get current user's activity
  getCurrentUserActivity: async (): Promise<UserActivity | null> => {
    if (!auth.currentUser) return null;
    
    const uid = auth.currentUser.uid;
    const activityRef = ref(database, `userActivity/${uid}`);
    
    try {
      const snapshot = await get(activityRef);
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Error getting user activity:', error);
      return null;
    }
  },

  // Listen to current user's activity changes
  listenToCurrentUserActivity: (callback: (activity: UserActivity | null) => void) => {
    if (!auth.currentUser) return () => {};
    
    const uid = auth.currentUser.uid;
    const activityRef = ref(database, `userActivity/${uid}`);
    
    const unsubscribe = onValue(activityRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    });
    
    return () => off(activityRef, 'value', unsubscribe);
  },

  // Get all online users
  getOnlineUsers: async (): Promise<OnlineUser[]> => {
    const onlineUsersRef = ref(database, 'onlineUsers');
    
    try {
      const snapshot = await get(onlineUsersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        return Object.values(users).filter((user: any) => user.isOnline);
      }
      return [];
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  },

  // Listen to online users changes
  listenToOnlineUsers: (callback: (users: OnlineUser[]) => void) => {
    const onlineUsersRef = ref(database, 'onlineUsers');
    
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        const onlineUsers = Object.values(users).filter((user: any) => user.isOnline);
        callback(onlineUsers);
      } else {
        callback([]);
      }
    });
    
    return () => off(onlineUsersRef, 'value', unsubscribe);
  },

  // Set user as online when component mounts
  setUserOnline: () => {
    realtimeDbService.updateOnlineStatus(true);
    
    // Set user as offline when page unloads
    window.addEventListener('beforeunload', () => {
      realtimeDbService.updateOnlineStatus(false);
    });
    
    // Set user as offline when tab becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        realtimeDbService.updateOnlineStatus(false);
      } else {
        realtimeDbService.updateOnlineStatus(true);
      }
    });
  }
};
