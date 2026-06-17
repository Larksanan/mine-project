/**
 * @jest-environment node
 */
import { POST } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/User');
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((body, init) => ({
        json: async () => body,
        status: init?.status || 200,
        ...init,
      })),
    },
  };
});

describe('Admin Migrate Preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized - Admin only');
  });

  it('should return 403 if user is not an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'USER' },
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized - Admin only');
  });

  it('should return success message if all users already have preferences', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' },
    });

    // Mock User.find().countDocuments() chain
    const mockFind = {
      countDocuments: jest.fn().mockResolvedValue(0),
    };
    (User.find as jest.Mock).mockReturnValue(mockFind);

    const response = await POST();
    const body = await response.json();

    expect(connectDB).toHaveBeenCalled();
    expect(User.find).toHaveBeenCalled();
    expect(body.success).toBe(true);
    expect(body.message).toBe(
      'All users already have notification preferences'
    );
    expect(body.updated).toBe(0);
    expect(User.updateMany).not.toHaveBeenCalled();
  });

  it('should migrate preferences for users without them', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' },
    });

    // Mock User.find().countDocuments() chain
    const mockFind = {
      countDocuments: jest.fn().mockResolvedValue(5),
    };
    (User.find as jest.Mock).mockReturnValue(mockFind);

    // Mock User.updateMany
    (User.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 5,
      matchedCount: 5,
    });

    const response = await POST();
    const body = await response.json();

    expect(connectDB).toHaveBeenCalled();
    expect(User.updateMany).toHaveBeenCalledWith(
      {
        $or: [
          { notificationPreferences: { $exists: false } },
          { notificationPreferences: null },
        ],
      },
      {
        $set: {
          notificationPreferences: {
            emailNotifications: true,
            pushNotifications: true,
            inAppNotifications: true,
            appointmentReminders: true,
            messageAlerts: true,
            systemUpdates: true,
            marketingEmails: false,
          },
        },
      }
    );
    expect(body.success).toBe(true);
    expect(body.message).toBe('Migration completed successfully');
    expect(body.updated).toBe(5);
  });

  it('should handle database errors gracefully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: 'ADMIN' },
    });

    const error = new Error('Database connection failed');
    (connectDB as jest.Mock).mockRejectedValue(error);

    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Migration failed');
    expect(body.details).toBe('Database connection failed');

    consoleSpy.mockRestore();
  });
});
