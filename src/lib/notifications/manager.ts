import { v4 as uuidv4 } from 'uuid';
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
  INotification,
} from './types';

export class NotificationManager {
  private notifications: Map<string, INotification> = new Map();
  private preferences: NotificationPreferences;
  private subscribers: Set<(notification: INotification) => void> = new Set();
  private soundEnabled: boolean = true;

  constructor(preferences?: Partial<NotificationPreferences>) {
    this.preferences = {
      enabledTypes: Object.values(NotificationType),
      minPriority: NotificationPriority.LOW,
      emailNotifications: false,
      pushNotifications: true,
      soundEnabled: true,
      healthAlertThreshold: 0.8,
      priceAlertThreshold: 0.05,
      ...preferences,
    };
  }

  subscribe(callback: (notification: INotification) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(notification: INotification): void {
    this.subscribers.forEach(callback => callback(notification));
    
    if (this.preferences.soundEnabled && notification.priority >= NotificationPriority.HIGH) {
      this.playNotificationSound();
    }

    if (this.preferences.pushNotifications) {
      this.sendPushNotification(notification);
    }

    if (this.preferences.emailNotifications && notification.priority >= NotificationPriority.HIGH) {
      this.sendEmailNotification(notification);
    }
  }

  async createNotification(params: {
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    data?: any;
    actions?: Array<{ label: string; action: string; params?: any }>;
  }){
    // Check if notification type is enabled
    if (!this.preferences.enabledTypes.includes(params.type)) {
      return null;
    }

    // Check if priority meets minimum threshold
    if (params.priority < this.preferences.minPriority) {
      return null;
    }

    const notification: INotification = {
      id: uuidv4(),
      status: NotificationStatus.UNREAD,
      timestamp: Date.now(),
      ...params,
    };

    this.notifications.set(notification.id, notification);
    this.notify(notification);

    return notification;
  }

  async createHealthAlert(
    positionId: string,
    healthScore: number,
    message: string
  ): Promise<INotification | null> {
    if (healthScore >= this.preferences.healthAlertThreshold) {
      return null;
    }

    const priority = healthScore < 0.5
      ? NotificationPriority.CRITICAL
      : NotificationPriority.HIGH;

    return this.createNotification({
      type: NotificationType.POSITION_HEALTH,
      priority,
      title: 'Position Health Alert',
      message,
      data: { positionId, healthScore },
      actions: [
        {
          label: 'View Position',
          action: 'VIEW_POSITION',
          params: { positionId },
        },
        {
          label: 'Adjust Position',
          action: 'ADJUST_POSITION',
          params: { positionId },
        },
      ],
    });
  }

  async createPriceAlert(
    positionId: string,
    priceChange: number,
    currentPrice: number
  ): Promise<INotification | null> {
    if (Math.abs(priceChange) < this.preferences.priceAlertThreshold) {
      return null;
    }

    const priority = Math.abs(priceChange) > 0.1
      ? NotificationPriority.HIGH
      : NotificationPriority.MEDIUM;

    const direction = priceChange > 0 ? 'increased' : 'decreased';
    const percentage = Math.abs(priceChange * 100).toFixed(2);

    return this.createNotification({
      type: NotificationType.PRICE_ALERT,
      priority,
      title: 'Price Movement Alert',
      message: `Price has ${direction} by ${percentage}%`,
      data: { positionId, priceChange, currentPrice },
      actions: [
        {
          label: 'View Position',
          action: 'VIEW_POSITION',
          params: { positionId },
        },
      ],
    });
  }

  async createStrategyUpdate(
    positionId: string,
    strategyId: string,
    action: string,
    details: string
  ) {
    return this.createNotification({
      type: NotificationType.STRATEGY_UPDATE,
      priority: NotificationPriority.MEDIUM,
      title: 'Strategy Update',
      message: details,
      data: { positionId, strategyId, action },
      actions: [
        {
          label: 'View Strategy',
          action: 'VIEW_STRATEGY',
          params: { positionId, strategyId },
        },
      ],
    });
  }

  async createTransactionNotification(
    transactionHash: string,
    status: 'pending' | 'success' | 'error',
    message: string
  ){
    return this.createNotification({
      type: NotificationType.TRANSACTION,
      priority: status === 'error'
        ? NotificationPriority.HIGH
        : NotificationPriority.MEDIUM,
      title: `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message,
      data: { transactionHash, status },
      actions: [
        {
          label: 'View Transaction',
          action: 'VIEW_TRANSACTION',
          params: { transactionHash },
        },
      ],
    });
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.status = NotificationStatus.READ;
      this.notifications.set(notificationId, notification);
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      if (notification.status === NotificationStatus.UNREAD) {
        notification.status = NotificationStatus.READ;
      }
    });
  }

  archiveNotification(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.status = NotificationStatus.ARCHIVED;
      this.notifications.set(notificationId, notification);
    }
  }

  getNotifications(
    filter?: {
      type?: NotificationType;
      status?: NotificationStatus;
      priority?: NotificationPriority;
    }
  ): INotification[] {
    let notifications = Array.from(this.notifications.values());

    if (filter) {
      if (filter.type) {
        notifications = notifications.filter(n => n.type === filter.type);
      }
      if (filter.status) {
        notifications = notifications.filter(n => n.status === filter.status);
      }
      if (filter.priority) {
        notifications = notifications.filter(n => n.priority === filter.priority);
      }
    }

    return notifications.sort((a, b) => b.timestamp - a.timestamp);
  }

  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...preferences,
    };
  }

  private playNotificationSound(): void {
    if (typeof window !== 'undefined' && this.soundEnabled) {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(console.error);
    }
  }

  private async sendPushNotification(notification: INotification): Promise<void> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/notification-icon.png',
          });
        }
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }
  }

  private async sendEmailNotification(notification: INotification): Promise<void> {
    // TODO: Implement email notification service integration
    console.log('Email notification:', notification);
  }
}