'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { usePositions } from '@/context/PositionContext';
import {
  NotificationType,
  NotificationPriority,
  NotificationPreferences as INotificationPreferences,
} from '@/lib/notifications/types';

export const NotificationPreferences: React.FC = () => {
  const { notificationManager }: any = usePositions();
  const [preferences, setPreferences] = useState<INotificationPreferences>({
    enabledTypes: [],
    minPriority: NotificationPriority.LOW,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
    healthAlertThreshold: 0.8,
    priceAlertThreshold: 0.05,
  });

  useEffect(() => {
    // Load current preferences
    const currentPreferences = notificationManager.getPreferences();
    setPreferences(currentPreferences);
  }, [notificationManager]);

  const handleTypeToggle = (type: NotificationType) => {
    const newTypes = preferences.enabledTypes.includes(type)
      ? preferences.enabledTypes.filter(t => t !== type)
      : [...preferences.enabledTypes, type];

    const newPreferences = {
      ...preferences,
      enabledTypes: newTypes,
    };

    setPreferences(newPreferences);
    notificationManager.updatePreferences(newPreferences);
  };

  const handlePriorityChange = (priority: NotificationPriority) => {
    const newPreferences = {
      ...preferences,
      minPriority: priority,
    };

    setPreferences(newPreferences);
    notificationManager.updatePreferences(newPreferences);
  };

  const handleToggle = (key: keyof INotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(newPreferences);
    notificationManager.updatePreferences(newPreferences);
  };

  const handleThresholdChange = (
    key: 'healthAlertThreshold' | 'priceAlertThreshold',
    value: number
  ) => {
    const newPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(newPreferences);
    notificationManager.updatePreferences(newPreferences);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
    >
      <h2 className="text-xl font-medium text-gray-900 mb-6">
        Notification Preferences
      </h2>

      <div className="space-y-6">
        {/* Notification Types */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Notification Types
          </h3>
          <div className="space-y-2">
            {Object.values(NotificationType).map((type) => (
              <label
                key={type}
                className="flex items-center space-x-3"
              >
                <input
                  type="checkbox"
                  checked={preferences.enabledTypes.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {type.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Minimum Priority */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Minimum Priority
          </h3>
          <select
            value={preferences.minPriority}
            onChange={(e) =>
              handlePriorityChange(e.target.value as NotificationPriority)
            }
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {Object.values(NotificationPriority).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Methods */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Delivery Methods
          </h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={preferences.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Push Notifications</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Email Notifications</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={() => handleToggle('soundEnabled')}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Sound Enabled</span>
            </label>
          </div>
        </div>

        {/* Alert Thresholds */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Alert Thresholds
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Health Alert Threshold ({(preferences.healthAlertThreshold * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={preferences.healthAlertThreshold}
                onChange={(e) =>
                  handleThresholdChange('healthAlertThreshold', Number(e.target.value))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Price Alert Threshold ({(preferences.priceAlertThreshold * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.01"
                value={preferences.priceAlertThreshold}
                onChange={(e) =>
                  handleThresholdChange('priceAlertThreshold', Number(e.target.value))
                }
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
