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
  createdAt: Date;
  updatedAt: Date;
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

export interface NotificationsResponse {
  success: boolean;
  data?: Notification[] | Notification;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MarkAsReadData {
  notificationIds: string[];
  read: boolean;
}

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  relatedId?: string;
}
