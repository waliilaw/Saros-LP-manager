export enum NotificationType {
  POSITION_HEALTH = 'POSITION_HEALTH',
  PRICE_ALERT = 'PRICE_ALERT',
  STRATEGY_UPDATE = 'STRATEGY_UPDATE',
  TRANSACTION = 'TRANSACTION',
  SYSTEM = 'SYSTEM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export interface NotificationPreferences {
  enabledTypes: NotificationType[];
  minPriority: NotificationPriority;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  healthAlertThreshold: number;
  priceAlertThreshold: number;
}

export interface INotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  timestamp: number;
  data?: {
    positionId?: string;
    transactionHash?: string;
    healthScore?: number;
    priceChange?: number;
    strategyId?: string;
    [key: string]: any;
  };
  actions?: Array<{
    label: string;
    action: string;
    params?: any;
  }>;
}
