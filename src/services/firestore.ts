import { getFirestore, collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FirestoreUser {
  uid: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profilePicture?: string;
  rank: string;
  winRate: number;
  totalGames: number;
  currentStreak: number;
  favoriteGame: string;
  createdAt: number;
  lastActive: number;
}

export const firestoreService = {
  // Get all users from Firestore
  getAllUsers: async (): Promise<FirestoreUser[]> => {
    try {
      console.log('🔍 Attempting to fetch users from Firestore...');
      console.log('🔍 Database instance:', db);
      
      const usersRef = collection(db, 'users');
      console.log('🔍 Collection reference created:', usersRef);
      
      const snapshot = await getDocs(usersRef);
      
      const users: FirestoreUser[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          uid: doc.id,
          ...userData
        } as FirestoreUser);
      });
      
      // Sort by last active (most recent first)
      users.sort((a, b) => b.lastActive - a.lastActive);
      
      console.log('✅ Fetched users from Firestore:', users.length);
      return users;
    } catch (error) {
      console.error('❌ Error fetching users from Firestore:', error);
      console.log('⚠️ Falling back to mock data due to Firestore error');
      
      // Return empty array instead of mock data
      return [];
    }
  },

  // Get user by UID
  getUserById: async (uid: string): Promise<FirestoreUser | null> => {
    try {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.data();
        return {
          uid: snapshot.id,
          ...userData
        } as FirestoreUser;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  },

  // Get top users by rank
  getTopUsers: async (limitCount: number = 10): Promise<FirestoreUser[]> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        orderBy('winRate', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      
      const users: FirestoreUser[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          uid: doc.id,
          ...userData
        } as FirestoreUser);
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching top users:', error);
      return [];
    }
  },

  // Get users by game preference
  getUsersByGame: async (game: string): Promise<FirestoreUser[]> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('favoriteGame', '==', game)
      );
      
      const snapshot = await getDocs(q);
      
      const users: FirestoreUser[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          uid: doc.id,
          ...userData
        } as FirestoreUser);
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users by game:', error);
      return [];
    }
  }
};
