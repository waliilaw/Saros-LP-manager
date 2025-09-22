export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    actionUrl?: string;
    positionId?: string;
}

export class NotificationManager {
    private notifications: Map<string, Notification> = new Map();
    private listeners: Set<(notifications: Notification[]) => void> = new Set();
    private static instance: NotificationManager;

    private constructor() {}

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
        const id = Math.random().toString(36).substring(2, 15);
        const fullNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now(),
            read: false,
        };

        this.notifications.set(id, fullNotification);
        this.notifyListeners();
        this.showBrowserNotification(fullNotification);

        return id;
    }

    markAsRead(id: string): void {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.read = true;
            this.notifications.set(id, notification);
            this.notifyListeners();
        }
    }

    markAllAsRead(): void {
        for (const [id, notification] of this.notifications) {
            notification.read = true;
            this.notifications.set(id, notification);
        }
        this.notifyListeners();
    }

    removeNotification(id: string): void {
        this.notifications.delete(id);
        this.notifyListeners();
    }

    getNotifications(): Notification[] {
        return Array.from(this.notifications.values())
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    subscribe(listener: (notifications: Notification[]) => void): () => void {
        this.listeners.add(listener);
        listener(this.getNotifications());

        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners(): void {
        const notifications = this.getNotifications();
        this.listeners.forEach(listener => listener(notifications));
    }

    private async showBrowserNotification(notification: Notification): Promise<void> {
        if (!('Notification' in window)) {
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/notification-icon.png', // Add an appropriate icon
                tag: notification.id,
            });
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.showBrowserNotification(notification);
            }
        }
    }
}