import { GET, PUT } from '@/app/api/notifications/preferences/route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockUser = User as jest.Mocked<typeof User>;

describe('/api/notifications/preferences', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const defaultPreferences = {
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
    mockConnectDB.mockResolvedValue(null as any);
  });

  describe('GET /api/notifications/preferences', () => {
    it('should return 401 if no session exists', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 401 if session has no user ID', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 404 if user not found in database', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      (mockUser.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should return default preferences if user has no preferences', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      const mockUserData = {
        _id: mockUserId,
        notificationPreferences: null,
      };

      (mockUser.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(defaultPreferences);
    });

    it('should return user preferences if they exist', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      const customPreferences = {
        ...defaultPreferences,
        emailNotifications: false,
        marketingEmails: true,
      };

      const mockUserData = {
        _id: mockUserId,
        notificationPreferences: customPreferences,
      };

      (mockUser.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(customPreferences);
      expect(data.data.emailNotifications).toBe(false);
      expect(data.data.marketingEmails).toBe(true);
    });

    it('should merge partial preferences with defaults', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      const partialPreferences = {
        emailNotifications: false,
        pushNotifications: false,
      };

      const mockUserData = {
        _id: mockUserId,
        notificationPreferences: partialPreferences,
      };

      (mockUser.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.emailNotifications).toBe(false);
      expect(data.data.pushNotifications).toBe(false);
      expect(data.data.inAppNotifications).toBe(true); // from defaults
      expect(data.data.appointmentReminders).toBe(true); // from defaults
    });

    it('should handle database connection errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      mockConnectDB.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle database query errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      (mockUser.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Query failed')),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Query failed');
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    const validPreferences = {
      emailNotifications: false,
      pushNotifications: true,
      inAppNotifications: false,
      appointmentReminders: true,
      messageAlerts: false,
      systemUpdates: true,
      marketingEmails: true,
    };

    const createMockRequest = (body: any): NextRequest => {
      return {
        json: jest.fn().mockResolvedValue(body),
      } as any;
    };

    it('should return 401 if no session exists', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const request = createMockRequest(validPreferences);

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 400 for invalid JSON', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any;

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should return 400 for invalid preference keys', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      const invalidPreferences = {
        ...validPreferences,
        invalidKey: true,
        anotherInvalidKey: false,
      };

      const request = createMockRequest(invalidPreferences);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid preference keys');
      expect(data.error).toContain('invalidKey');
      expect(data.error).toContain('anotherInvalidKey');
    });

    it('should return 400 for non-boolean values', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      const invalidPreferences = {
        ...validPreferences,
        emailNotifications: 'true', // string instead of boolean
      };

      const request = createMockRequest(invalidPreferences);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('expected boolean');
    });

    it('should successfully update preferences', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      const mockUpdatedUser = {
        _id: mockUserId,
        notificationPreferences: validPreferences,
      };

      (mockUser.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      });

      const request = createMockRequest(validPreferences);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(validPreferences);
      expect(data.message).toBe('Preferences updated successfully');

      expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        { $set: { notificationPreferences: validPreferences } },
        { new: true, runValidators: true }
      );
    });

    it('should return 404 if user not found during update', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      (mockUser.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const request = createMockRequest(validPreferences);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should handle partial preference updates', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      const partialPreferences = {
        emailNotifications: false,
        marketingEmails: true,
      };

      const mockUpdatedUser = {
        _id: mockUserId,
        notificationPreferences: partialPreferences,
      };

      (mockUser.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      });

      const request = createMockRequest(partialPreferences);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(partialPreferences);
    });

    it('should handle database update errors', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetServerSession.mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      } as any);

      (mockUser.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Update failed')),
      });

      const request = createMockRequest(validPreferences);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Update failed');
      consoleErrorSpy.mockRestore();
    });
  });
});
