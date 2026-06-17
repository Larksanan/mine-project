/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useNotifications,
  Notification,
  NotificationPreferences,
} from '../notifications';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.error
console.error = jest.fn();

describe('useNotifications Hook', () => {
  // Mock data
  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      userId: 'user-123',
      title: 'Appointment Reminder',
      type: 'info',
      priority: 'medium',
      read: false,
      actionUrl: '/appointments/apt-1',
      actionLabel: 'View Appointment',
      relatedId: 'apt-1',
      createdAt: '2026-01-15T09:00:00.000Z',
      updatedAt: '2026-01-15T09:00:00.000Z',
      message: '',
    },
    {
      id: 'notif-2',
      userId: 'user-123',
      title: 'New Message',
      message: 'You have a new message from Dr.jebarsan',
      type: 'warning',
      priority: 'high',
      read: false,
      actionUrl: '/messages/conv-1',
      actionLabel: 'View Message',
      relatedId: 'msg-1',
      createdAt: '2026-01-15T10:30:00.000Z',
      updatedAt: '2026-01-15T10:30:00.000Z',
    },
    {
      id: 'notif-3',
      userId: 'user-123',
      title: 'Lab Results Ready',
      message: 'Your lab test results are now available',
      type: 'success',
      priority: 'medium',
      read: true,
      actionUrl: '/lab-results/res-1',
      actionLabel: 'View Results',
      relatedId: 'lab-1',
      createdAt: '2026-01-14T14:20:00.000Z',
      updatedAt: '2026-01-14T14:20:00.000Z',
    },
    {
      id: 'notif-4',
      userId: 'user-123',
      title: 'System Maintenance',
      message: 'System maintenance scheduled for tonight 2 AM - 4 AM',
      type: 'system',
      priority: 'low',
      read: true,
      createdAt: '2026-01-13T08:00:00.000Z',
      updatedAt: '2026-01-13T08:00:00.000Z',
    },
    {
      id: 'notif-5',
      userId: 'user-123',
      title: 'Payment Failed',
      message: 'Your recent payment failed. Please update payment method.',
      type: 'error',
      priority: 'urgent',
      read: false,
      actionUrl: '/billing/payment',
      actionLabel: 'Update Payment',
      relatedId: 'payment-1',
      createdAt: '2026-01-15T11:45:00.000Z',
      updatedAt: '2026-01-15T11:45:00.000Z',
    },
  ];

  const mockPreferences: NotificationPreferences = {
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    appointmentReminders: true,
    messageAlerts: true,
    systemUpdates: true,
    marketingEmails: false,
  };

  const mockSession = {
    data: {
      user: {
        id: 'user-123',
      },
    },
    status: 'authenticated',
  };

  // Helper to create mock responses
  const createMockResponse = (data: any, success = true) => ({
    ok: success,
    json: async () => ({
      success,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue(mockSession);
    (global.fetch as jest.Mock).mockClear();
    (console.error as jest.Mock).mockClear();
  });

  describe('Initial state', () => {
    it('should initialize with empty notifications and default preferences', () => {
      // Mock empty responses for initial fetch
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([]))
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.preferences).toEqual(mockPreferences);
      expect(result.current.loading).toBe(true); // Loading during initial fetch
      expect(result.current.error).toBeNull();
      expect(result.current.unreadCount).toBe(0);
      expect(typeof result.current.fetchNotifications).toBe('function');
      expect(typeof result.current.fetchPreferences).toBe('function');
      expect(typeof result.current.markAsRead).toBe('function');
      expect(typeof result.current.markAllAsRead).toBe('function');
      expect(typeof result.current.deleteNotification).toBe('function');
      expect(typeof result.current.updatePreferences).toBe('function');
    });

    it('should calculate unread count correctly', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 3 unread notifications in mock data (notif-1, notif-2, notif-5)
      expect(result.current.unreadCount).toBe(3);
    });
  });

  describe('fetchNotifications', () => {
    it('should fetch notifications successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications');
      expect(result.current.notifications).toHaveLength(5);
      expect(result.current.notifications[0].id).toBe('notif-1');
      expect(result.current.notifications[0].type).toBe('info');
      expect(result.current.notifications[0].priority).toBe('medium');
      expect(result.current.error).toBeNull();
    });

    it('should handle API error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Server error',
          }),
        })
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch notifications');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle empty response data', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            // No data property
          }),
        })
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notifications).toEqual([]);
    });

    it('should handle null response data', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(null))
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notifications).toEqual([]);
    });

    it('should set loading state correctly during refetch', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockImplementationOnce(
          () =>
            new Promise(resolve =>
              setTimeout(
                () =>
                  resolve(createMockResponse(mockNotifications.slice(0, 2))),
                100
              )
            )
        );

      const { result } = renderHook(() => useNotifications());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger refetch
      let promise: Promise<void>;
      act(() => {
        promise = result.current.fetchNotifications();
      });

      // Should be loading during refetch
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await promise;
      });

      // Should be done loading after refetch
      expect(result.current.loading).toBe(false);
    });
  });

  describe('fetchPreferences', () => {
    it('should fetch preferences successfully', async () => {
      const customPreferences: NotificationPreferences = {
        emailNotifications: false,
        pushNotifications: true,
        inAppNotifications: false,
        appointmentReminders: true,
        messageAlerts: false,
        systemUpdates: true,
        marketingEmails: false,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([]))
        .mockResolvedValueOnce(createMockResponse(customPreferences));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/preferences'
      );
      expect(result.current.preferences).toEqual(customPreferences);
    });

    it('should handle preferences fetch error silently', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([]))
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Failed to fetch preferences',
          }),
        });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still have default preferences
      expect(result.current.preferences).toEqual(mockPreferences);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark single notification as read successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockResolvedValueOnce(createMockResponse({}));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialUnreadCount = result.current.unreadCount;

      await act(async () => {
        await result.current.markAsRead(['notif-1']);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/mark-read',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: ['notif-1'], read: true }),
        }
      );

      // Should update local state
      expect(result.current.notifications[0].read).toBe(true);
      expect(result.current.unreadCount).toBe(initialUnreadCount - 1);
    });

    it('should mark multiple notifications as read', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockResolvedValueOnce(createMockResponse({}));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialUnreadCount = result.current.unreadCount;

      await act(async () => {
        await result.current.markAsRead(['notif-1', 'notif-2', 'notif-5']);
      });

      expect(result.current.notifications[0].read).toBe(true); // notif-1
      expect(result.current.notifications[1].read).toBe(true); // notif-2
      expect(result.current.notifications[4].read).toBe(true); // notif-5
      expect(result.current.unreadCount).toBe(initialUnreadCount - 3);
    });

    it('should mark notifications as unread when read=false', async () => {
      const notificationsWithRead = [
        { ...mockNotifications[0], read: false },
        { ...mockNotifications[2], read: true }, // This one is already read
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(notificationsWithRead))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockResolvedValueOnce(createMockResponse({}));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markAsRead(['notif-1', 'notif-3'], false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/mark-read',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationIds: ['notif-1', 'notif-3'],
            read: false,
          }),
        }
      );

      expect(result.current.notifications[0].read).toBe(false);
      expect(result.current.notifications[1].read).toBe(false); // Was true, now false
    });

    it('should handle API error and throw', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Failed to mark notifications',
          }),
        });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.markAsRead(['notif-1']);
        })
      ).rejects.toThrow('Failed to mark notifications');

      // State should not be updated on error
      expect(result.current.notifications[0].read).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockResolvedValueOnce(createMockResponse({}));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/mark-all-read',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // All notifications should be marked as read
      result.current.notifications.forEach(notification => {
        expect(notification.read).toBe(true);
      });
      expect(result.current.unreadCount).toBe(0);
    });

    it('should handle API error and throw', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Failed to mark all notifications as read',
          }),
        });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.markAllAsRead();
        })
      ).rejects.toThrow('Failed to mark all notifications as read');
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockResolvedValueOnce(createMockResponse({}));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.notifications.length;

      await act(async () => {
        await result.current.deleteNotification('notif-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/notif-1', {
        method: 'DELETE',
      });

      expect(result.current.notifications).toHaveLength(initialCount - 1);
      expect(
        result.current.notifications.find(n => n.id === 'notif-1')
      ).toBeUndefined();
    });

    it('should handle API error and throw', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Failed to delete notification',
          }),
        });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.deleteNotification('notif-1');
        })
      ).rejects.toThrow('Failed to delete notification');
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([]))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockResolvedValueOnce(createMockResponse({}));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newPreferences: Partial<NotificationPreferences> = {
        emailNotifications: false,
        pushNotifications: false,
        marketingEmails: true,
      };

      await act(async () => {
        await result.current.updatePreferences(newPreferences);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/preferences',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...mockPreferences,
            ...newPreferences,
          }),
        }
      );

      expect(result.current.preferences).toEqual({
        ...mockPreferences,
        ...newPreferences,
      });
    });

    it('should handle API error and throw', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([]))
        .mockResolvedValueOnce(createMockResponse(mockPreferences))
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Failed to update preferences',
          }),
        });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newPreferences: Partial<NotificationPreferences> = {
        emailNotifications: false,
      };

      await expect(
        act(async () => {
          await result.current.updatePreferences(newPreferences);
        })
      ).rejects.toThrow('Failed to update preferences');

      // Preferences should not be updated on error
      expect(result.current.preferences.emailNotifications).toBe(true);
    });

    it('should update preferences with dependencies', async () => {
      const initialPrefs: NotificationPreferences = {
        emailNotifications: false,
        pushNotifications: false,
        inAppNotifications: false,
        appointmentReminders: false,
        messageAlerts: false,
        systemUpdates: false,
        marketingEmails: false,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse([]))
        .mockResolvedValueOnce(createMockResponse(initialPrefs))
        .mockResolvedValueOnce(createMockResponse({}));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updates = { emailNotifications: true, pushNotifications: true };

      await act(async () => {
        await result.current.updatePreferences(updates);
      });

      expect(result.current.preferences).toEqual({
        ...initialPrefs,
        ...updates,
      });
    });
  });

  describe('useEffect on mount', () => {
    it('should fetch notifications and preferences on mount', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(mockNotifications))
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/preferences'
      );
    });

    it('should handle fetch errors on mount', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error on mount'))
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error on mount');
      expect(result.current.notifications).toEqual([]);
    });
  });

  describe('Notification types and priorities', () => {
    it('should handle all notification types', async () => {
      const allTypes: Notification[] = [
        { ...mockNotifications[0], type: 'info' },
        { ...mockNotifications[0], type: 'success' },
        { ...mockNotifications[0], type: 'warning' },
        { ...mockNotifications[0], type: 'error' },
        { ...mockNotifications[0], type: 'system' },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(allTypes))
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const types = result.current.notifications.map(n => n.type);
      expect(types).toContain('info');
      expect(types).toContain('success');
      expect(types).toContain('warning');
      expect(types).toContain('error');
      expect(types).toContain('system');
    });

    it('should handle all priority levels', async () => {
      const allPriorities: Notification[] = [
        { ...mockNotifications[0], priority: 'low' },
        { ...mockNotifications[0], priority: 'medium' },
        { ...mockNotifications[0], priority: 'high' },
        { ...mockNotifications[0], priority: 'urgent' },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(allPriorities))
        .mockResolvedValueOnce(createMockResponse(mockPreferences));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const priorities = result.current.notifications.map(n => n.priority);
      expect(priorities).toContain('low');
      expect(priorities).toContain('medium');
      expect(priorities).toContain('high');
      expect(priorities).toContain('urgent');
    });
  });
});
