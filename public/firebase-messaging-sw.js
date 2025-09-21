// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Note: Service workers can't access environment variables directly
// You'll need to replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyDS3gPgaPMHW28Zj6hqlahWNKgLT9Ovt1U",
  authDomain: "cyber-duel-grid.firebaseapp.com",
  projectId: "cyber-duel-grid",
  storageBucket: "cyber-duel-grid.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Tournament Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new tournament update',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: payload.notification?.badge || '/badge-72x72.png',
    tag: payload.data?.type || 'tournament',
    requireInteraction: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event);
  
  event.notification.close();
  
  // Handle different notification types
  const data = event.notification.data;
  
  let url = '/';
  
  switch (data?.type) {
    case 'tournament_ready':
    case 'tournament_started':
      url = '/tournament';
      break;
    case 'match_ready':
      url = '/tournament';
      break;
    default:
      url = '/';
  }
  
  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
