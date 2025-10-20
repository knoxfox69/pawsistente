// Purpose: Notification management system for event reminders
// Context: Handles browser notifications with configurable timing

export type NotificationTiming = '15min' | '30min' | '60min';

export interface NotificationSettings {
  enabled: boolean;
  timing: NotificationTiming;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private settings: NotificationSettings = {
    enabled: false,
    timing: '15min'
  };

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Purpose: Initialize notification system
  // Context: Sets up notification handling without requesting permission
  public async initialize(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      this.settings.enabled = true;
      this.saveSettings();
      return true;
    }

    // Don't request permission automatically, just return current state
    return this.settings.enabled;
  }

  // Purpose: Check if notifications are supported and enabled
  // Context: Returns true if notifications can be sent
  public canNotify(): boolean {
    return this.settings.enabled && 
           'Notification' in window && 
           Notification.permission === 'granted';
  }

  // Purpose: Send a notification
  // Context: Displays a browser notification with given details
  public async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.canNotify()) {
      console.log('Cannot send notification - not enabled or permission denied');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Purpose: Schedule event reminder notification
  // Context: Schedules a notification for an event based on timing settings
  public scheduleEventReminder(eventTitle: string, eventStartTime: Date): void {
    if (!this.canNotify()) {
      return;
    }

    const now = new Date();
    const timeDiff = eventStartTime.getTime() - now.getTime();
    
    let reminderTime = 0;
    switch (this.settings.timing) {
      case '15min':
        reminderTime = timeDiff - (15 * 60 * 1000);
        break;
      case '30min':
        reminderTime = timeDiff - (30 * 60 * 1000);
        break;
      case '60min':
        reminderTime = timeDiff - (60 * 60 * 1000);
        break;
    }

    // Only schedule if the reminder time is in the future
    if (reminderTime > 0) {
      setTimeout(() => {
        this.sendNotification(
          `Event Reminder: ${eventTitle}`,
          {
            body: `Your event "${eventTitle}" starts soon!`,
            tag: `event-${eventTitle}`,
            requireInteraction: true
          }
        );
      }, reminderTime);
    }
  }

  // Purpose: Request notification permission
  // Context: Asks user for notification permission
  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      this.settings.enabled = true;
      this.saveSettings();
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    this.settings.enabled = permission === 'granted';
    this.saveSettings();
    return this.settings.enabled;
  }

  // Purpose: Update notification settings
  // Context: Saves new notification preferences
  public updateSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
  }

  // Purpose: Get current notification settings
  // Context: Returns current notification configuration
  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Purpose: Load settings from localStorage
  // Context: Restores notification preferences from storage
  private loadSettings(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        const loadedSettings = JSON.parse(saved);
        // Migrate 'off' timing to '15min' and disable notifications
        if (loadedSettings.timing === 'off') {
          loadedSettings.timing = '15min';
          loadedSettings.enabled = false;
        }
        this.settings = { ...this.settings, ...loadedSettings };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  // Purpose: Save settings to localStorage
  // Context: Persists notification preferences to storage
  private saveSettings(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }
}
