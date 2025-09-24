'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { usePositions } from '@/context/PositionContext';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  INotification,
} from '@/lib/notifications/types';

export const NotificationCenter: React.FC = () => {
  const { notificationManager } = usePositions();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationType | 'ALL'>('ALL');

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    // Initial notifications
    setNotifications(notificationManager.getNotifications({
      status: NotificationStatus.UNREAD,
    }));

    return unsubscribe;
  }, [notificationManager]);

  const handleAction = async (action: string, params: any) => {
    switch (action) {
      case 'VIEW_POSITION':
        // Navigate to position details
        break;
      case 'ADJUST_POSITION':
        // Open position adjustment modal
        break;
      case 'VIEW_STRATEGY':
        // Navigate to strategy details
        break;
      case 'VIEW_TRANSACTION':
        // Open transaction details
        break;
      default:
        console.warn('Unknown action:', action);
    }
  };

  const getPriorityStyles = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 'bg-red-50 border-red-200 text-red-700';
      case NotificationPriority.HIGH:
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case NotificationPriority.MEDIUM:
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'ALL' ? true : n.type === filter
  );

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Notifications
                </h3>
                <button
                  onClick={() => notificationManager.markAllAsRead()}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Mark all as read
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filter === 'ALL'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                {Object.values(NotificationType).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filter === type
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-4 border-b border-gray-100 ${
                        notification.status === NotificationStatus.UNREAD
                          ? getPriorityStyles(notification.priority)
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.actions && (
                            <div className="mt-2 space-x-2">
                              {notification.actions.map((action) => (
                                <button
                                  key={action.label}
                                  onClick={() =>
                                    handleAction(action.action, action.params)
                                  }
                                  className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            notificationManager.archiveNotification(notification.id)
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleString()}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No notifications
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};