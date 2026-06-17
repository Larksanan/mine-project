/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiSave } from 'react-icons/fi';
export function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    appointmentReminders: true,
    messageAlerts: true,
    systemUpdates: true,
    marketingEmails: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/profile/notification-settings');
      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  const notificationOptions = [
    {
      key: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Receive notifications via email',
    },
    {
      key: 'pushNotifications',
      label: 'Push Notifications',
      description: 'Receive push notifications on your device',
    },
    {
      key: 'inAppNotifications',
      label: 'In-App Notifications',
      description: 'Show notifications within the application',
    },
    {
      key: 'appointmentReminders',
      label: 'Appointment Reminders',
      description: 'Get reminded about upcoming appointments',
    },
    {
      key: 'messageAlerts',
      label: 'Message Alerts',
      description: 'Receive alerts for new messages',
    },
    {
      key: 'systemUpdates',
      label: 'System Updates',
      description: 'Stay informed about system changes',
    },
    {
      key: 'marketingEmails',
      label: 'Marketing Emails',
      description: 'Receive promotional and marketing content',
    },
  ];

  return (
    <div className='bg-white rounded-xl shadow-md p-6'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
          <FiBell className='w-5 h-5 text-blue-600' />
        </div>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Notification Settings
          </h2>
          <p className='text-sm text-gray-600'>
            Manage how you receive notifications
          </p>
        </div>
      </div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border-l-4 border-green-500'
              : 'bg-red-50 border-l-4 border-red-500'
          }`}
        >
          {message.type === 'success' ? (
            <FiCheck className='w-5 h-5 text-green-600' />
          ) : (
            <FiAlertCircle className='w-5 h-5 text-red-600' />
          )}
          <p
            className={
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }
          >
            {message.text}
          </p>
        </motion.div>
      )}

      <div className='space-y-4 mb-6'>
        {notificationOptions.map(option => (
          <div
            key={option.key}
            className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors'
          >
            <div className='flex-1'>
              <h3 className='font-medium text-gray-900'>{option.label}</h3>
              <p className='text-sm text-gray-600'>{option.description}</p>
            </div>
            <button
              onClick={() => handleToggle(option.key as keyof typeof settings)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings[option.key as keyof typeof settings]
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings[option.key as keyof typeof settings]
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className='flex justify-end'>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/30 disabled:opacity-50'
        >
          <FiSave className='w-4 h-4' />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
