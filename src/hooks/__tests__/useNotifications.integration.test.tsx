/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNotifications } from '../notifications';

// Mock the hook
jest.mock('../notifications', () => ({
  useNotifications: jest.fn(),
}));

const mockUseNotifications = useNotifications as jest.MockedFunction<
  typeof useNotifications
>;

// Test component
const TestNotificationsComponent = () => {
  const {
    notifications,
    preferences,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
  } = useNotifications();

  const handleToggleEmail = () => {
    updatePreferences({ emailNotifications: !preferences.emailNotifications });
  };

  return (
    <div>
      <div data-testid='loading'>{loading ? 'Loading...' : 'Loaded'}</div>
      <div data-testid='error'>{error || 'No error'}</div>
      <div data-testid='unread-count'>Unread: {unreadCount}</div>
      <div data-testid='notifications-count'>Total: {notifications.length}</div>

      <button data-testid='refresh-btn' onClick={fetchNotifications}>
        Refresh
      </button>

      <button data-testid='mark-all-read-btn' onClick={markAllAsRead}>
        Mark All as Read
      </button>

      <button data-testid='toggle-email-btn' onClick={handleToggleEmail}>
        {preferences.emailNotifications ? 'Disable Email' : 'Enable Email'}
      </button>

      <div data-testid='notifications-list'>
        {notifications.map(notification => (
          <div
            key={notification.id}
            data-testid={`notification-${notification.id}`}
          >
            <h4 data-testid={`title-${notification.id}`}>
              {notification.title}
            </h4>
            <p data-testid={`message-${notification.id}`}>
              {notification.message}
            </p>
            <span data-testid={`read-${notification.id}`}>
              {notification.read ? 'Read' : 'Unread'}
            </span>
            <button
              data-testid={`mark-read-${notification.id}`}
              onClick={() => markAsRead([notification.id])}
            >
              Mark as Read
            </button>
            <button
              data-testid={`delete-${notification.id}`}
              onClick={() => deleteNotification(notification.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('useNotifications Hook Integration', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      userId: 'user-123',
      title: 'Test Notification',
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

  it('should render with initial state', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      preferences: mockPreferences,
      unreadCount: 0,
      loading: false,
      error: null,
      fetchNotifications: jest.fn(),
      fetchPreferences: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<TestNotificationsComponent />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 0');
    expect(screen.getByTestId('notifications-count')).toHaveTextContent(
      'Total: 0'
    );
    expect(screen.getByTestId('toggle-email-btn')).toHaveTextContent(
      'Disable Email'
    );
  });

  it('should render with notifications', () => {
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      preferences: mockPreferences,
      unreadCount: 1,
      loading: false,
      error: null,
      fetchNotifications: jest.fn(),
      fetchPreferences: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<TestNotificationsComponent />);

    expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 1');
    expect(screen.getByTestId('notifications-count')).toHaveTextContent(
      'Total: 1'
    );
    expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
    expect(screen.getByTestId('title-notif-1')).toHaveTextContent(
      'Test Notification'
    );
    expect(screen.getByTestId('message-notif-1')).toHaveTextContent(
      'Test message'
    );
    expect(screen.getByTestId('read-notif-1')).toHaveTextContent('Unread');
  });

  it('should call fetchNotifications when refresh button is clicked', () => {
    const mockFetchNotifications = jest.fn();

    mockUseNotifications.mockReturnValue({
      notifications: [],
      preferences: mockPreferences,
      unreadCount: 0,
      loading: false,
      error: null,
      fetchNotifications: mockFetchNotifications,
      fetchPreferences: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<TestNotificationsComponent />);

    fireEvent.click(screen.getByTestId('refresh-btn'));
    expect(mockFetchNotifications).toHaveBeenCalledTimes(1);
  });

  it('should call markAsRead when mark as read button is clicked', () => {
    const mockMarkAsRead = jest.fn();

    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      preferences: mockPreferences,
      unreadCount: 1,
      loading: false,
      error: null,
      fetchNotifications: jest.fn(),
      fetchPreferences: jest.fn(),
      markAsRead: mockMarkAsRead,
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<TestNotificationsComponent />);

    fireEvent.click(screen.getByTestId('mark-read-notif-1'));
    expect(mockMarkAsRead).toHaveBeenCalledWith(['notif-1']);
  });

  it('should call markAllAsRead when mark all as read button is clicked', () => {
    const mockMarkAllAsRead = jest.fn();

    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      preferences: mockPreferences,
      unreadCount: 1,
      loading: false,
      error: null,
      fetchNotifications: jest.fn(),
      fetchPreferences: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<TestNotificationsComponent />);

    fireEvent.click(screen.getByTestId('mark-all-read-btn'));
    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('should call deleteNotification when delete button is clicked', () => {
    const mockDeleteNotification = jest.fn();

    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      preferences: mockPreferences,
      unreadCount: 1,
      loading: false,
      error: null,
      fetchNotifications: jest.fn(),
      fetchPreferences: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: mockDeleteNotification,
      updatePreferences: jest.fn(),
    });

    render(<TestNotificationsComponent />);

    fireEvent.click(screen.getByTestId('delete-notif-1'));
    expect(mockDeleteNotification).toHaveBeenCalledWith('notif-1');
  });

  it('should call updatePreferences when toggle button is clicked', () => {
    const mockUpdatePreferences = jest.fn();

    mockUseNotifications.mockReturnValue({
      notifications: [],
      preferences: mockPreferences,
      unreadCount: 0,
      loading: false,
      error: null,
      fetchNotifications: jest.fn(),
      fetchPreferences: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      updatePreferences: mockUpdatePreferences,
    });

    render(<TestNotificationsComponent />);

    fireEvent.click(screen.getByTestId('toggle-email-btn'));
    expect(mockUpdatePreferences).toHaveBeenCalledWith({
      emailNotifications: false,
    });
  });

  it('should show loading state', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      preferences: mockPreferences,
      unreadCount: 0,
      loading: true,
      error: null,
      fetchNotifications: jest.fn(),
      fetchPreferences: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<TestNotificationsComponent />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
  });

  it('should show error state', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      preferences: mockPreferences,
      unreadCount: 0,
      loading: false,
      error: 'Failed to load notifications',
      fetchNotifications: jest.fn(),
      fetchPreferences: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<TestNotificationsComponent />);

    expect(screen.getByTestId('error')).toHaveTextContent(
      'Failed to load notifications'
    );
  });
});
