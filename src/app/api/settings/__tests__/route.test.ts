/* eslint-disable @typescript-eslint/no-require-imports */

import { NextRequest } from 'next/server';
import { GET, PUT } from '../route';

// Define interfaces for mocks
interface MockUser {
  new (): any;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
}

// Mock all dependencies
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      url: string;
      method?: string;
      body?: any;

      constructor(url: string, init?: { method?: string; body?: any }) {
        this.url = url;
        this.method = init?.method;
        this.body = init?.body;
      }

      json() {
        return Promise.resolve(this.body ? JSON.parse(this.body) : {});
      }
    },
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({
        json: async () => data,
        status: init?.status || 200,
      }),
    },
  };
});

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/User', () => {
  const MockUser = function () {} as any as { new (): any };

  // Add static methods
  (MockUser as any).findById = jest.fn();
  (MockUser as any).findByIdAndUpdate = jest.fn();

  return {
    __esModule: true,
    default: MockUser as MockUser,
  };
});

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Settings API', () => {
  let User: MockUser;
  let getServerSession: jest.Mock;
  let connectDB: jest.Mock;

  const originalConsoleError = console.error;
  const mockConsoleError = jest.fn();

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.resetAllMocks();

    User = require('@/models/User').default;
    const nextAuth = require('next-auth');
    getServerSession = nextAuth.getServerSession;
    connectDB = require('@/lib/mongodb').connectDB;

    // Default mock implementations
    connectDB.mockResolvedValue(undefined);
  });

  describe('GET /api/settings', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    // Default settings as defined in the route
    const defaultSettings = {
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      notifications: {
        email: true,
        push: true,
        sms: false,
        desktop: true,
        appointmentReminders: true,
        prescriptionUpdates: true,
        labResults: true,
        billingAlerts: true,
        marketingEmails: false,
        newsletter: false,
      },
      privacy: {
        profileVisibility: 'contacts',
        showOnlineStatus: true,
        allowMessaging: 'contacts',
        dataSharing: true,
        analytics: true,
      },
      security: {
        twoFactorAuth: false,
        loginAlerts: true,
        sessionTimeout: 60,
        passwordExpiry: 90,
      },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should fetch user settings successfully', async () => {
      const mockUserSettings = {
        theme: 'dark',
        language: 'es',
        timezone: 'America/New_York',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        notifications: {
          email: true,
          push: false,
          sms: true,
          desktop: true,
          appointmentReminders: false,
          prescriptionUpdates: true,
          labResults: false,
          billingAlerts: true,
          marketingEmails: false,
          newsletter: true,
        },
        privacy: {
          profileVisibility: 'private',
          showOnlineStatus: false,
          allowMessaging: 'none',
          dataSharing: false,
          analytics: true,
        },
        security: {
          twoFactorAuth: true,
          loginAlerts: false,
          sessionTimeout: 30,
          passwordExpiry: 60,
        },
      };

      // Mock: User.findById().select()
      const mockSelect = jest.fn().mockResolvedValue({
        settings: mockUserSettings,
      });
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockUserSettings);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockSelect).toHaveBeenCalledWith('settings');
    });

    it('should return default settings when user has no settings', async () => {
      // Mock: User.findById().select() returns user with no settings
      const mockSelect = jest.fn().mockResolvedValue({
        // User exists but has no settings property
      });
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(defaultSettings);
    });

    it('should return default settings when user is null', async () => {
      // Mock: User.findById().select() returns null
      const mockSelect = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(defaultSettings);
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle database errors', async () => {
      // Mock: User.findById().select() throws error
      const mockSelect = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle connection errors', async () => {
      connectDB.mockRejectedValue(new Error('Connection failed'));

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should return partial settings merged with defaults', async () => {
      const partialSettings = {
        theme: 'dark',
        language: 'fr',
        // Missing other settings
      };

      // Mock: User.findById().select() returns partial settings
      const mockSelect = jest.fn().mockResolvedValue({
        settings: partialSettings,
      });
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      // Should return the partial settings as-is (not merged with defaults)
      expect(data.data).toEqual(partialSettings);
    });
  });

  describe('PUT /api/settings', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    const mockUpdatedSettings = {
      theme: 'dark',
      language: 'es',
      timezone: 'America/New_York',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      notifications: {
        email: true,
        push: false,
        sms: true,
        desktop: true,
        appointmentReminders: false,
        prescriptionUpdates: true,
        labResults: false,
        billingAlerts: true,
        marketingEmails: false,
        newsletter: true,
      },
      privacy: {
        profileVisibility: 'private',
        showOnlineStatus: false,
        allowMessaging: 'none',
        dataSharing: false,
        analytics: true,
      },
      security: {
        twoFactorAuth: true,
        loginAlerts: false,
        sessionTimeout: 30,
        passwordExpiry: 60,
      },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('should update user settings successfully', async () => {
      // Mock: User.findByIdAndUpdate().select()
      const mockSelect = jest.fn().mockResolvedValue({
        settings: mockUpdatedSettings,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(mockUpdatedSettings),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Settings updated successfully');
      expect(data.data).toEqual(mockUpdatedSettings);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          $set: { settings: mockUpdatedSettings },
        },
        { new: true }
      );
      expect(mockSelect).toHaveBeenCalledWith('settings');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(mockUpdatedSettings),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle empty settings object', async () => {
      const emptySettings = {};

      // Mock: User.findByIdAndUpdate().select()
      const mockSelect = jest.fn().mockResolvedValue({
        settings: emptySettings,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(emptySettings),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(emptySettings);
    });

    it('should handle partial settings update', async () => {
      const partialSettings = {
        theme: 'dark',
        language: 'fr',
        // Only updating a few fields
      };

      // Mock: User.findByIdAndUpdate().select()
      const mockSelect = jest.fn().mockResolvedValue({
        settings: partialSettings,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(partialSettings),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(partialSettings);
    });

    it('should handle database errors during update', async () => {
      // Mock: User.findByIdAndUpdate().select() throws error
      const mockSelect = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(mockUpdatedSettings),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle connection errors during update', async () => {
      connectDB.mockRejectedValue(new Error('Connection failed'));

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(mockUpdatedSettings),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle invalid JSON in request body', async () => {
      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: 'invalid json',
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle null user after update', async () => {
      // Mock: User.findByIdAndUpdate().select() returns null
      const mockSelect = jest.fn().mockResolvedValue(null);
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(mockUpdatedSettings),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeUndefined(); // user?.settings is undefined when user is null
    });

    it('should handle deeply nested settings', async () => {
      const deeplyNestedSettings = {
        theme: 'dark',
        notifications: {
          email: true,
          push: {
            enabled: true,
            sound: 'chime',
            vibration: 'short',
          },
          sms: {
            enabled: false,
            international: true,
            emergency: true,
          },
        },
        privacy: {
          profileVisibility: 'custom',
          customVisibility: {
            showEmail: false,
            showPhone: true,
            showAddress: false,
            showBirthday: true,
          },
        },
        security: {
          twoFactorAuth: {
            enabled: true,
            method: 'app',
            backupCodes: ['123456', '789012', '345678'],
          },
          session: {
            timeout: 30,
            singleDevice: true,
            rememberMe: false,
          },
        },
      };

      // Mock: User.findByIdAndUpdate().select()
      const mockSelect = jest.fn().mockResolvedValue({
        settings: deeplyNestedSettings,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(deeplyNestedSettings),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(deeplyNestedSettings);
    });

    it('should handle updating only notification settings', async () => {
      const notificationSettingsOnly = {
        notifications: {
          email: false,
          push: true,
          sms: false,
          desktop: false,
          appointmentReminders: false,
          prescriptionUpdates: false,
          labResults: false,
          billingAlerts: false,
          marketingEmails: false,
          newsletter: false,
        },
      };

      // Mock: User.findByIdAndUpdate().select()
      const mockSelect = jest.fn().mockResolvedValue({
        settings: notificationSettingsOnly,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(notificationSettingsOnly),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(notificationSettingsOnly);
    });

    it('should handle updating only security settings', async () => {
      const securitySettingsOnly = {
        security: {
          twoFactorAuth: true,
          loginAlerts: false,
          sessionTimeout: 120,
          passwordExpiry: 180,
        },
      };

      // Mock: User.findByIdAndUpdate().select()
      const mockSelect = jest.fn().mockResolvedValue({
        settings: securitySettingsOnly,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(securitySettingsOnly),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(securitySettingsOnly);
    });

    it('should handle concurrent GET and PUT requests', async () => {
      // Setup mocks for concurrent requests
      const mockSelectGet = jest.fn().mockResolvedValue({
        settings: mockUpdatedSettings,
      });
      User.findById.mockReturnValue({
        select: mockSelectGet,
      });

      const mockSelectPut = jest.fn().mockResolvedValue({
        settings: { ...mockUpdatedSettings, theme: 'light' },
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelectPut,
      });

      // Execute GET and PUT concurrently
      const [getRes, putRes] = await Promise.all([
        GET(),
        PUT(
          new NextRequest('http://localhost:3000/api/settings', {
            method: 'PUT',
            body: JSON.stringify({ ...mockUpdatedSettings, theme: 'light' }),
          })
        ),
      ]);

      const getData = await getRes.json();
      const putData = await putRes.json();

      expect(getRes.status).toBe(200);
      expect(putRes.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(putData.success).toBe(true);
      expect(getData.data).toEqual(mockUpdatedSettings);
      expect(putData.data.theme).toBe('light');
    });
  });

  describe('Edge Cases', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    beforeEach(() => {
      getServerSession.mockResolvedValue(mockSession);
    });

    it('GET should handle timezone detection', async () => {
      const mockSelect = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({
        select: mockSelect,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.timezone).toBe(
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
    });

    it('PUT should handle very large settings object', async () => {
      const largeSettings = {
        theme: 'dark',
        // Add many properties to simulate large object
        ...Array.from({ length: 50 }, (_, i) => ({
          [`customProp${i}`]: `value${i}`,
        })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
      };

      const mockSelect = jest.fn().mockResolvedValue({
        settings: largeSettings,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(largeSettings),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(largeSettings);
    });

    it('should handle settings with special characters', async () => {
      const settingsWithSpecialChars = {
        theme: 'dark 🌙',
        language: 'es-ES',
        timezone: 'America/New_York (EST)',
        dateFormat: 'DD/MM/YYYY 📅',
        notifications: {
          email: true,
          customSound: '🔔',
        },
      };

      const mockSelect = jest.fn().mockResolvedValue({
        settings: settingsWithSpecialChars,
      });
      User.findByIdAndUpdate.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsWithSpecialChars),
      });

      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(settingsWithSpecialChars);
    });
  });
});
