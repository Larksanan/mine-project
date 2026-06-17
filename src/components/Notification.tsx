'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheck, FiSettings, FiExternalLink } from 'react-icons/fi';
import Link from 'next/link';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationBell() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);
  const hasUnread = unreadCount > 0;

  // Fetch notifications
  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (
    notificationIds: string[],
    read: boolean = true
  ) => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds, read }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (notificationIds.includes(n.id) ? { ...n, read } : n))
        );
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notificationId: string) => {
    markAsRead([notificationId], true);
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'error':
        return '🔴';
      case 'system':
        return '🔵';
      default:
        return 'ℹ️';
    }
  };

  if (!session) return null;

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 text-gray-400 hover:text-gray-600 transition-colors'
        aria-label='Notifications'
      >
        <FiBell className='h-6 w-6' />
        {hasUnread && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className='absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center'
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className='absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50'
          >
            <div className='p-4 border-b border-gray-200'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Notifications
                </h3>
                {hasUnread && (
                  <button
                    onClick={() => {
                      const unreadIds = recentNotifications
                        .filter(n => !n.read)
                        .map(n => n.id);
                      if (unreadIds.length > 0) {
                        markAsRead(unreadIds, true);
                      }
                    }}
                    className='flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800'
                  >
                    <FiCheck className='h-4 w-4' />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
            </div>

            <div className='max-h-96 overflow-y-auto'>
              {loading ? (
                <div className='p-4 text-center text-gray-500'>
                  <div className='animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto'></div>
                  <p className='text-sm mt-2'>Loading...</p>
                </div>
              ) : recentNotifications.length === 0 ? (
                <div className='p-4 text-center text-gray-500'>
                  <FiBell className='h-8 w-8 mx-auto mb-2 text-gray-300' />
                  <p className='text-sm'>No notifications</p>
                </div>
              ) : (
                <div className='divide-y divide-gray-100'>
                  {recentNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className='flex items-start space-x-3'>
                        <span className='text-lg shrink-0 mt-0.5'>
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {notification.title}
                          </p>
                          <p className='text-sm text-gray-500 mt-1 line-clamp-2'>
                            {notification.message}
                          </p>
                          <p className='text-xs text-gray-400 mt-2'>
                            {new Date(
                              notification.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {notification.actionUrl && (
                          <FiExternalLink className='h-4 w-4 text-gray-400 shrink-0 mt-1' />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='p-4 border-t border-gray-200'>
              <Link
                href='/notifications'
                className='flex items-center justify-center space-x-2 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
                onClick={() => setIsOpen(false)}
              >
                <FiSettings className='h-4 w-4' />
                <span>View all notifications</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
