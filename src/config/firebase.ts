import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDS3gPgaPMHW28Zj6hqlahWNKgLT9Ovt1U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cyber-duel-grid.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cyber-duel-grid",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cyber-duel-grid.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

// Check if the browser supports service workers
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase messaging not supported:', error);
  }
} else {
  console.warn('Service workers not supported in this browser');
}

export { messaging };

// Request permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('Firebase messaging not available');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      // Get FCM token
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "your-vapid-key";
      
      if (vapidKey === "your-vapid-key") {
        console.warn('⚠️ VAPID key not configured. Push notifications may not work properly.');
        console.warn('Please set VITE_FIREBASE_VAPID_KEY in your .env file');
      }
      
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: {
          scope: '/',
          updateViaCache: 'none'
        }
      });
      
      if (token) {
        console.log('📱 FCM Token:', token);
        return token;
      } else {
        console.warn('No registration token available');
        return null;
      }
    } else {
      console.warn('❌ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () => {
  if (!messaging) {
    return new Promise(() => {});
  }
  
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('📱 Message received in foreground:', payload);
      resolve(payload);
    });
  });
};

export default app;
