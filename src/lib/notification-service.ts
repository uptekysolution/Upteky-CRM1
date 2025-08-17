import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

export class NotificationService {
  private static messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

  // Request permission and get FCM token
  static async requestPermission(): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting notification permission:', error);
      return null;
    }
  }

  // Listen for foreground messages
  static onMessage(callback: (payload: any) => void) {
    if (!this.messaging) return () => {};

    return onMessage(this.messaging, (payload) => {
      callback(payload);
    });
  }

  // Show local notification
  static showNotification(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

  // Show notification for new task
  static showTaskNotification(taskTitle: string, assigneeName: string) {
    this.showNotification('New Task Assigned', {
      body: `You have been assigned: ${taskTitle}`,
      icon: '/favicon.ico',
      tag: 'new-task',
      requireInteraction: true
    });
  }

  // Show notification for new meeting
  static showMeetingNotification(meetingTitle: string, date: string) {
    this.showNotification('New Meeting Invitation', {
      body: `You're invited to: ${meetingTitle} on ${date}`,
      icon: '/favicon.ico',
      tag: 'new-meeting',
      requireInteraction: true
    });
  }

  // Show notification for task deadline
  static showDeadlineNotification(taskTitle: string, daysLeft: number) {
    const message = daysLeft === 0 
      ? `Task "${taskTitle}" is due today!`
      : `Task "${taskTitle}" is due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
    
    this.showNotification('Task Deadline Reminder', {
      body: message,
      icon: '/favicon.ico',
      tag: 'deadline-reminder'
    });
  }

  // Show notification for meeting reminder
  static showMeetingReminder(meetingTitle: string, time: string) {
    this.showNotification('Meeting Reminder', {
      body: `Meeting "${meetingTitle}" starts in ${time}`,
      icon: '/favicon.ico',
      tag: 'meeting-reminder'
    });
  }
}
