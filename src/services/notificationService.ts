import { requestNotificationPermission, onMessageListener } from '../config/firebase';
import { API_BASE_URL } from './api';

class NotificationService {
  private token: string | null = null;

  /**
   * Initialize notifications and request permission
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing push notifications...');
      
      // Request permission and get token
      this.token = await requestNotificationPermission();
      
      if (this.token) {
        // Save token to backend
        await this.saveTokenToBackend(this.token);
        
        // Set up message listener
        this.setupMessageListener();
        
        console.log('✅ Push notifications initialized successfully');
        return true;
      } else {
        console.warn('⚠️ Could not get FCM token');
        return false;
      }
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Save FCM token to backend
   */
  private async saveTokenToBackend(token: string): Promise<void> {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.warn('No auth token found, skipping FCM token save');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ fcmToken: token })
      });

      if (response.ok) {
        console.log('✅ FCM token saved to backend');
      } else {
        console.warn('⚠️ Failed to save FCM token to backend');
      }
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
  }

  /**
   * Set up message listener for foreground notifications
   */
  private setupMessageListener(): void {
    onMessageListener().then((payload: any) => {
      console.log('📱 Received foreground message:', payload);
      
      // Show notification
      this.showNotification(payload);
      
      // Handle different notification types
      this.handleNotification(payload);
    });
  }

  /**
   * Show browser notification
   */
  private showNotification(payload: any): void {
    if (Notification.permission === 'granted') {
      const notification = new Notification(payload.notification?.title || 'Tournament Update', {
        body: payload.notification?.body || 'You have a new tournament update',
        icon: payload.notification?.icon || '/icon-192x192.png',
        badge: payload.notification?.badge || '/badge-72x72.png',
        tag: payload.data?.type || 'tournament',
        requireInteraction: true
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate based on notification type
        this.handleNotificationClick(payload);
      };
    }
  }

  /**
   * Handle notification based on type
   */
  private handleNotification(payload: any): void {
    const data = payload.data;
    
    switch (data?.type) {
      case 'tournament_ready':
        console.log('🎮 Tournament ready notification received');
        // You can add custom logic here, like updating UI state
        break;
        
      case 'tournament_started':
        console.log('🚀 Tournament started notification received');
        // You can add custom logic here, like refreshing tournament data
        break;
        
      case 'match_ready':
        console.log('⚔️ Match ready notification received');
        // You can add custom logic here, like updating match status
        break;
        
      default:
        console.log('📱 Unknown notification type:', data?.type);
    }
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(payload: any): void {
    const data = payload.data;
    
    switch (data?.type) {
      case 'tournament_ready':
      case 'tournament_started':
        // Navigate to tournament page
        window.location.href = '/tournament';
        break;
        
      case 'match_ready':
        // Navigate to tournament page with match focus
        window.location.href = '/tournament';
        break;
        
      default:
        // Navigate to home page
        window.location.href = '/';
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Check if permission is granted
   */
  hasPermission(): boolean {
    return Notification.permission === 'granted';
  }
}

export default new NotificationService();
