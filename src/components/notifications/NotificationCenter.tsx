import { useEffect, useState } from 'react';
import { Notification, NotificationManager } from '@/lib/notifications/manager';
import { formatDate } from '@/lib/utils';

interface NotificationCenterProps {
    onClose: () => void;
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const notificationManager = NotificationManager.getInstance();

    useEffect(() => {
        const unsubscribe = notificationManager.subscribe(setNotifications);
        return () => unsubscribe();
    }, [notificationManager]);

    const handleMarkAllRead = () => {
        notificationManager.markAllAsRead();
    };

    const handleMarkAsRead = (id: string) => {
        notificationManager.markAsRead(id);
    };

    const handleDismiss = (id: string) => {
        notificationManager.removeNotification(id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end">
            <div className="bg-white w-96 h-full shadow-xl flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold">Notifications</h2>
                        <p className="text-sm text-gray-500">
                            {notifications.filter(n => !n.read).length} unread
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleMarkAllRead}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Mark all read
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No notifications
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    notification.type === 'success' ? 'bg-green-500' :
                                                    notification.type === 'warning' ? 'bg-yellow-500' :
                                                    notification.type === 'error' ? 'bg-red-500' :
                                                    'bg-blue-500'
                                                }`} />
                                                <h3 className="font-medium">{notification.title}</h3>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {notification.message}
                                            </p>
                                            <div className="mt-2 text-xs text-gray-500">
                                                {formatDate(notification.timestamp)}
                                            </div>
                                        </div>
                                        <div className="ml-4 flex flex-col space-y-2">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    Mark read
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDismiss(notification.id)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <span className="sr-only">Dismiss</span>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    {notification.actionUrl && (
                                        <a
                                            href={notification.actionUrl}
                                            className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            View details
                                            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}