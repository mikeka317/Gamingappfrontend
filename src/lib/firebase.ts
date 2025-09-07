import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';



const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDS3gPgaPMHW28Zj6hqlahWNKgLT9Ovt1U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cyber-duel-grid.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://cyber-duel-grid-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cyber-duel-grid",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cyber-duel-grid.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "242259935079",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:242259935079:web:a60902f45f09f98f9539c2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-T56RGXB0ZQ"
};
// Initialize Firebase once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

// console.log('✅ Firebase initialized');

export { auth, db, database };
export default app;
