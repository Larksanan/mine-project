/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications } from '../notifications';

global.fetch = jest.fn();
console.error = jest.fn();

describe('useNotifications Hook Edge Cases', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      userId: 'user-123',
      title: 'Test',
      message: 'Test message',
      type: 'info' as const,
      priority: 'medium' as const,
      read: false,
      createdAt: '2026-01-15T09:00:00.000Z',
      updatedAt: '2026-01-15T09:00:00.000Z',
    },
  ];

  const mockPreferences = {
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    appointmentReminders: true,
    messageAlerts: true,
    systemUpdates: true,
    marketingEmails: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Network and API Edge Cases', () => {
    it('should handle large number of notifications', async () => {
      const largeNotifications = Array.from({ length: 1000 }, (_, i) => ({
        id: `notif-${i}`,
        userId: 'user-123',
        title: `Notification ${i}`,
        message: `Message ${i}`,
        type: 'info' as const,
        priority: 'medium' as const,
        read: i % 2 === 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: largeNotifications,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockPreferences,
          }),
        });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notifications).toHaveLength(1000);
      expect(result.current.unreadCount).toBe(500); // Half should be unread
    });

    it('should handle notifications with missing optional fields', async () => {
      const minimalNotification = {
        id: 'min-notif',
        userId: 'user-123',
        title: 'Minimal',
        message: 'Minimal message',
        type: 'info' as const,
        priority: 'medium' as const,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // No actionUrl, actionLabel, relatedId
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [minimalNotification],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockPreferences,
          }),
        });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notifications[0].actionUrl).toBeUndefined();
      expect(result.current.notifications[0].actionLabel).toBeUndefined();
      expect(result.current.notifications[0].relatedId).toBeUndefined();
    });

    it('should handle rapid successive updates', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockNotifications,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockPreferences,
          }),
        })
        .mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Rapid successive calls
      await act(async () => {
        await Promise.all([
          result.current.markAsRead(['notif-1']),
          result.current.markAsRead(['notif-1']),
          result.current.markAsRead(['notif-1']),
        ]);
      });

      // Should handle gracefully
      expect(global.fetch).toHaveBeenCalledTimes(5); // 2 initial + 3 markAsRead
    });
  });

  describe('State Management Edge Cases', () => {
    it('should handle marking non-existent notifications', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockNotifications,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockPreferences,
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markAsRead(['non-existent-id']);
      });

      // Should not crash, but state won't change since notification doesn't exist
      expect(result.current.notifications[0].read).toBe(false);
    });

    it('should handle deleting non-existent notification', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockNotifications,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockPreferences,
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteNotification('non-existent-id');
      });

      // Should not crash, but state won't change
      expect(result.current.notifications).toHaveLength(1);
    });

    it('should handle empty arrays for markAsRead', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockNotifications,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockPreferences,
          }),
        });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markAsRead([]);
      });

      // Should handle empty array gracefully
      expect(global.fetch).toHaveBeenCalledTimes(3); // 2 initial + 1 markAsRead
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/mark-read',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: [], read: true }),
        }
      );
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent read and delete operations', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockNotifications,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockPreferences,
          }),
        })
        .mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Concurrent operations
      await act(async () => {
        await Promise.all([
          result.current.markAsRead(['notif-1']),
          result.current.deleteNotification('notif-1'),
          result.current.markAllAsRead(),
        ]);
      });

      // Should handle gracefully
      expect(global.fetch).toHaveBeenCalledTimes(5); // 2 initial + 3 operations
    });
  });
});
