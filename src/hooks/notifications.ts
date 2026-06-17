import { useState, useEffect, useCallback } from 'react';

export interface Notification {
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

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  appointmentReminders: boolean;
  messageAlerts: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    appointmentReminders: true,
    messageAlerts: true,
    systemUpdates: true,
    marketingEmails: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setNotifications(result.data);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/preferences');

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPreferences(result.data);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  }, []);

  const markAsRead = useCallback(
    async (notificationIds: string[], read = true) => {
      try {
        const response = await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds, read }),
        });

        if (!response.ok) {
          throw new Error('Failed to mark notifications');
        }

        setNotifications(prev =>
          prev.map(n => (notificationIds.includes(n.id) ? { ...n, read } : n))
        );
      } catch (err) {
        console.error('Error marking notifications:', err);
        throw err;
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, []);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      try {
        const updatedPreferences = { ...preferences, ...newPreferences };

        const response = await fetch('/api/notifications/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPreferences),
        });

        if (!response.ok) {
          throw new Error('Failed to update preferences');
        }

        setPreferences(updatedPreferences);
      } catch (err) {
        console.error('Error updating preferences:', err);
        throw err;
      }
    },
    [preferences]
  );

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  return {
    notifications,
    preferences,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchPreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
  };
}
