'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/notifications';
import {
  FiBell,
  FiCheck,
  FiTrash2,
  FiSettings,
  FiInfo,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiBellOff,
} from 'react-icons/fi';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const {
    notifications,
    unreadCount,
    preferences,
    loading: isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
  } = useNotifications();

  const filteredNotifications =
    activeTab === 'unread' ? notifications.filter(n => !n.read) : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className='h-5 w-5 text-green-500' />;
      case 'warning':
        return <FiAlertTriangle className='h-5 w-5 text-yellow-500' />;
      case 'error':
        return <FiAlertCircle className='h-5 w-5 text-red-500' />;
      case 'system':
        return <FiBell className='h-5 w-5 text-blue-500' />;
      default:
        return <FiInfo className='h-5 w-5 text-blue-500' />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'error':
        return 'border-l-red-500';
      case 'system':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  if (!session) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-2xl font-bold text-gray-900 mb-2'
          >
            Please Sign In
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='text-gray-600'
          >
            You need to be signed in to view notifications.
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <FiBell className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Notifications
                </h1>
                <p className='text-gray-600'>
                  {unreadCount} unread{' '}
                  {unreadCount === 1 ? 'notification' : 'notifications'}
                </p>
              </div>
            </div>
            <div className='flex space-x-3'>
              {unreadCount > 0 && (
                <button
                  onClick={() => handleMarkAllAsRead()}
                  disabled={isMarkingAllRead}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors ${
                    isMarkingAllRead ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isMarkingAllRead ? (
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700' />
                  ) : (
                    <FiCheck className='h-4 w-4' />
                  )}
                  <span>
                    {isMarkingAllRead ? 'Marking...' : 'Mark all as read'}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className='flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
              >
                <FiSettings className='h-4 w-4' />
                <span>Preferences</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Preferences Panel */}
        <AnimatePresence>
          {showPreferences && preferences && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 overflow-hidden'
            >
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Notification Preferences
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {Object.entries(preferences).map(([key, value]) => (
                  <div key={key} className='flex items-center justify-between'>
                    <label
                      htmlFor={key}
                      className='text-sm font-medium text-gray-700 capitalize'
                    >
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </label>
                    <input
                      type='checkbox'
                      id={key}
                      checked={value as boolean}
                      onChange={e =>
                        updatePreferences({ [key]: e.target.checked })
                      }
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='flex -mb-px'>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Notifications
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'unread'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </nav>
          </div>

          {/* Notifications List */}
          <div className='p-6'>
            {isLoading ? (
              <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
            ) : error ? (
              <div className='text-center py-8 text-red-600'>
                <p>{error}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className='text-center py-12 text-gray-500'>
                <FiBellOff className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                <p className='text-lg font-medium'>No notifications</p>
                <p className='text-sm'>
                  {activeTab === 'unread'
                    ? 'You have no unread notifications'
                    : 'You have no notifications yet'}
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {filteredNotifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`bg-white border-l-4 ${getNotificationColor(notification.type)} border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start space-x-3 flex-1'>
                        {getNotificationIcon(notification.type)}
                        <div className='flex-1'>
                          <h3 className='text-sm font-semibold text-gray-900'>
                            {notification.title}
                          </h3>
                          <p className='text-sm text-gray-600 mt-1'>
                            {notification.message}
                          </p>
                          <div className='flex items-center space-x-4 mt-2'>
                            <span className='text-xs text-gray-500'>
                              {new Date(
                                notification.createdAt
                              ).toLocaleDateString()}{' '}
                              at{' '}
                              {new Date(
                                notification.createdAt
                              ).toLocaleTimeString()}
                            </span>
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className='text-xs text-blue-600 hover:text-blue-800 font-medium'
                              >
                                {notification.actionLabel || 'View'}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2 ml-4'>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead([notification.id], true)}
                            className='p-1 text-gray-400 hover:text-green-600 transition-colors'
                            title='Mark as read'
                          >
                            <FiCheck className='h-4 w-4' />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className='p-1 text-gray-400 hover:text-red-600 transition-colors'
                          title='Delete notification'
                        >
                          <FiTrash2 className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
