import { Session } from 'next-auth';
import { UserRole } from '@/models/User';

process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

export const createMockSession = (overrides?: Partial<Session>): Session => {
  return {
    user: {
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      name: 'jebarsan Thatcroos',
      role: 'USER' as UserRole,
      ...overrides?.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
};

export const createMockUser = (overrides?: any) => {
  return {
    _id: '507f1f77bcf86cd799439011',
    name: 'jebarsan Thatcroos',
    email: 'test@example.com',
    nic: '123456789V',
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockRequest = (
  body: any,
  method = 'PUT',
  url = 'http://localhost:3000/test'
) => {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers(),
    method,
    url,
    nextUrl: new URL(url),
  } as any;
};

export const mockNotificationPreferences = {
  default: {
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    appointmentReminders: true,
    messageAlerts: true,
    systemUpdates: true,
    marketingEmails: false,
  },
  allDisabled: {
    emailNotifications: false,
    pushNotifications: false,
    inAppNotifications: false,
    appointmentReminders: false,
    messageAlerts: false,
    systemUpdates: false,
    marketingEmails: false,
  },
  allEnabled: {
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    appointmentReminders: true,
    messageAlerts: true,
    systemUpdates: true,
    marketingEmails: true,
  },
  custom: {
    emailNotifications: false,
    pushNotifications: true,
    inAppNotifications: false,
    appointmentReminders: true,
    messageAlerts: false,
    systemUpdates: true,
    marketingEmails: true,
  },
};

describe('Test Helpers', () => {
  it('should export helper functions', () => {
    expect(createMockSession).toBeDefined();
    expect(createMockUser).toBeDefined();
  });
});
